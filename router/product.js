import express from "express"
import Order from "../model/Order.js"
import Product from "../model/Product.js"

import { sendError, sendServerError, sendSuccess } from "../helper/client.js"
import { verifyToken, verifyCustomer} from '../middleware/index.js'
import { addProductValidate } from "../validation/product.js"
import ProductShipment from "../model/ProductShipment.js"
import { PRODUCT_STATUS } from "../constant.js"

const productRoute = express.Router()

/**
 * @route POST api/product/:orderId
 * @description customer add product to their order
 * @access public
 */
productRoute.post('/:orderId',
    verifyToken,
    verifyCustomer,
    async (req, res) => {
        try {
            const customerId = req.user.role._id
            const {orderId} = req.params
            const {products} = req.body
            const order = await Order.findOne({orderId: orderId, customer:customerId})
            if (!order) return sendError(res, "Order is not found.")
            if (order.status !== "waiting") return sendError(res, "Orders can't add more products.")
            for (let i = 0; i < products.length; i++) {
                const product = products[i];
                const errors = addProductValidate(product)
                if (errors) return sendError(res, errors)
                const _product = await Product.create({name: product.name, quantity: product.quantity, unit: product.unit, order, note: product.note})
            }
            return sendSuccess(res, "Add product to order successfully.", products)
            
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
)

/**
 * @route GET api/product/:orderId
 * @description customer get product from order
 * @access public
 */
productRoute.get('/:orderId',
    verifyToken,
    verifyCustomer,
    async (req, res) => {
        try {
            const customerId = req.user.role._id
            const {orderId} = req.params
            const order = await Order.findOne({orderId: orderId, customer: customerId})
            if (!order) return sendError(res, "Order is not found.")
            
            const products = await Product.find({order})

            return sendSuccess(res, "Get products successfully.", products)
            
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
)

/**
 * @route  PUT api/product/:productId
 * @description customer update product
 * @access public
 */
productRoute.put('/:productId',
    verifyToken,
    verifyCustomer,
    async (req, res) => {
        try {
            const {productId} = req.params
            const product = await Product.findOne({_id: productId})
            if (!product)
                return sendError(res, "Product does not exist.")
            const order = await Order.findOne({_id: product.order})
            if (!order) 
                return sendError(res, "Order for this product is not found.")
            if (order.status !== "waiting") 
                return sendError(res, "Product can't be changed.")
             
            const {name, quantity, unit, note} = req.body
            let countquantity = 0
            for (let index = 0; index < product.product_shipments.length; index++) {
                const shipmentid = product.product_shipments[index]
                const shipment = await ProductShipment.findById({_id: shipmentid})
                countquantity += shipment.quantity                
            }
            if(countquantity > quantity) return sendError(res, "Quantity Product less quantity product_shipment")
            const errors = addProductValidate(product)
            if (errors) return sendError(res, errors)
            await Product.findByIdAndUpdate(productId, {name, quantity, unit,note})            
            return sendSuccess(res, "Update product successfully.")
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
)


/**
 * @route DELETE api/product/:productId
 * @description customer update product
 * @access public
 */
productRoute.delete('/:productId',
    verifyToken,
    verifyCustomer,
    async (req, res) => {
        try {
            const {productId} = req.params
            const product = await Product.findOne({_id: productId})
            if (!product)
                return sendError(res, "Product does not exist.")
            if(product.product_shipments.length > 0 ){
                return sendError(res, "Product has been divided!")
            }
            if(product.status == PRODUCT_STATUS.already)
                return sendError(res ,"Can not Delete Product !")
            const order = await Order.findOne({_id: product.order})
            if (!order) 
                return sendError(res, "Order for this product is not found.")
            if (order.status !== "waiting") 
                return sendError(res, "Product can't be changed.")
                
            await Product.findByIdAndRemove(productId)            
            return sendSuccess(res, "Delete product successfully.")
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
)


export default productRoute