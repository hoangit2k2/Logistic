import express from "express"
import { sendError, sendServerError, sendSuccess } from "../../helper/client.js"
import ProductShipment from "../../model/ProductShipment.js"
import Product from "../../model/Product.js"
import { createProductShipmentValidate } from "../../validation/productShipment.js"
import Order from "../../model/Order.js"
import { calculateShipmentFee, handleOrderInfo } from "../../service/order.js"
import { canCreateProductShipment, handleShipmentInfo } from "../../service/shipment.js"
import { ORDER_STATUS, PRODUCT_STATUS } from "../../constant.js"
import mongoose from "mongoose"


const productShipmentAdminRoute = express.Router()

/**
 * @route GET /api/admin/product-shipment
 * @description get information of product shipments
 * @access private
 */
productShipmentAdminRoute.get('/',
    async (req, res) => {
        try {
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 0
            const page = req.query.page ? parseInt(req.query.page) : 0
            const { sortBy, product_id } = req.query

            let length = 0
            let resShipments = []
            if (product_id) {
                if (!product_id.match(/^[0-9a-fA-F]{24}$/))
                return sendError(res, "ProductId is not compatible");
                const product = await Product.findById(product_id).populate('product_shipments')
                if (!product)
                    return sendError(res, "Product ID does not exist.")
                resShipments = product.product_shipments.map(shipment => {
                    return { ...shipment._doc, product_name: product.name }
                })
                length = product.product_shipments.length
            }
            else {
                length = await ProductShipment.count()
                const listProductShipment = await ProductShipment.find()
                    .limit(pageSize)
                    .skip(pageSize * page)
                    .sort(`${sortBy}`)
                resShipments = await Promise.all(listProductShipment.map(async shipment => {
                    return await handleShipmentInfo(shipment)
                }))
            }
            return sendSuccess(res, "Get product shipment information successfully", { length, shipments: resShipments });
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
)

/**
* @route GET /api/admin/product-shipment/:id
* @description get information of product shipment by id
* @access private
*/
productShipmentAdminRoute.get('/:id',
    async (req, res) => {
        try {
            const { id } = req.params
            const productShipments = await ProductShipment.findById(id)
            if (productShipments)
                return sendSuccess(res, "Get product shipment successfully.", await handleShipmentInfo(productShipments))
            return sendError(res, "No information found.")
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    })

/**
 * @route POST /api/admin/product-shipment/product/:product_id
 * @description create information of product shipment
 * @access private
 */
productShipmentAdminRoute.post('/product/:product_id', async (req, res) => {
    const errors = createProductShipmentValidate(req.body)
    if (errors)
        return sendError(res, errors)

    const { quantity } = req.body
    const { product_id } = req.params

    try {
        if (!product_id.match(/^[0-9a-fA-F]{24}$/))
        return sendError(res, "ProductId is not compatible");
        
        const product = await (await (await Product.findById(product_id)
            .populate('order', ['service', 'status']))
            .populate('order.service', ['price', 'distances']))
            .populate(['order.service.price', 'order.service.distances'])
        if (!product)
            return sendError(res, "Product id is not existed.")

        if (product.order.status !== ORDER_STATUS.waiting) {
            return sendError(res, "Can not divide the quantity of a product when the order is not waiting status.")
        }

        const canCreate = canCreateProductShipment(quantity, product)
        if (canCreate) {
            if (product.status === PRODUCT_STATUS.already) {
                product.product_shipments.forEach(async shipment => {
                    // console.log(shipment)
                    await ProductShipment.findByIdAndDelete(shipment)
                })
                await Product.findByIdAndUpdate(product._id, { status: PRODUCT_STATUS.pending, product_shipments: [] })
            }

            const order = await handleOrderInfo(await Order.findById(product.order))
            const [origin, destination] = [order.origin.address.province, order.destination.address.province]
            // console.log(origin,destination)
            // console.log(product.order.service.distances)
            var distance = null
            for (const ele of product.order.service.distances) {
                if ((ele.fromProvince === origin && ele.toProvince === destination) || (ele.toProvince === origin && ele.fromProvince === destination)) {
                    distance = ele
                }
            }

            const shipments = await Promise.all(
                quantity.map(async val => {
                    const shipment = await ProductShipment.create({ quantity: val, value: calculateShipmentFee(distance, val, product.order.service.price, product.unit) })
                    return new mongoose.Types.ObjectId(shipment._id)
                })
            )
            // console.log(shipments)
            const newProduct = await Product.findByIdAndUpdate(product._id, {
                status: PRODUCT_STATUS.already,
                $push: { product_shipments: { $each: shipments } }
            }
            )
            return sendSuccess(res, "Create shipments successfully.", { ...newProduct._doc, status: PRODUCT_STATUS.already })
        }
        // return sendSuccess(res, "Done", product)
        return sendError(res, "Creating shipments is failed.")
    }
    catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})

export default productShipmentAdminRoute