import express from "express"
import Order from "../../model/Order.js"
import Warehouse from "../../model/Warehouse.js"
import Product from "../../model/Product.js"

import { sendError, sendServerError, sendSuccess } from "../../helper/client.js"
import { verifyToken, verifyCustomer} from "../../middleware/index.js"
import { addProductValidate } from "../../validation/product.js"
import { handleProductInfo } from "../../service/product.js"
import {PRODUCT_STATUS} from "../../constant.js"
import ProductShipment from "../../model/ProductShipment.js"

const productAdminRoute = express.Router()


/**
 * @route GET api/admin/product
 * @description admin get list of products
 * @access private
 */
productAdminRoute.get('/',
    async (req, res) => {
        try {
            const {page, pageSize, sortBy, keyword, orderId} = req.query 
            var keywordCondition = keyword ? { $or:[
                { name: { $regex: keyword, $options: 'i'} },
                { unit: { $regex: keyword, $options: 'i'} },
            ]} : {}            
            
            var filterCondition = {}
            if (orderId){
                const order = await Order.findOne({orderId})
                if(!order) sendError(res, 'Order Not Found')
                filterCondition = {order : order._id}
            }
            const products = await Product.find({
                $and: [            
                    filterCondition,
                    keywordCondition                
                ]
            }).skip(pageSize*page).limit(pageSize).sort(`${sortBy}`)

            return sendSuccess(res, "Get product successfully.", products)
            
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
)

/**
 * @route GET api/admin/product/:productId
 * @description admin get product info
 * @access private
 */
productAdminRoute.get('/:productId', async (req, res) => {
    const productId = req.params.productId
    try {
        const product = await Product.findOne({_id: productId})
        if(!product) return sendError(res, "Product doesn\'t exist")
        return sendSuccess(res, "Get product information successfully.", await handleProductInfo(product))
    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})
/**
 * @route GET api/admin/product/:productId/movement
 * @description admin get movement of product info
 * @access private
 */
 productAdminRoute.get('/:productId/movement/', async (req, res) => {
    const productId = req.params.productId
    //console.log(productId)
    try {
        const product = await Product.findOne({_id: productId})
        //console.log(product)
        if(!product) return sendError(res, "Product doesn\'t exist")   
        
        const pOrder = await Product.findOne({_id: productId}).populate('order')
        //console.log(pOrder)
        const movement = {
            "origin": "",
            "destination": "",
            "shipments": []
        }
        
        movement.origin =  pOrder.order.origin.address['street'] + ' ' + pOrder.order.origin.address['ward'] 
                            + ' ' + pOrder.order.origin.address['district'] + ' ' + pOrder.order.origin.address['province']
        movement.destination =  pOrder.order.destination.address['street'] + ' ' + pOrder.order.destination.address['ward'] 
                            + ' ' + pOrder.order.destination.address['district'] + ' ' + pOrder.order.destination.address['province']
        var shipment = []
        for(let i = 0; i < product.product_shipments.length; i++){
            shipment[i] = product.product_shipments[i] + ""
        }
        
        let warehouse = []
        warehouse = await Warehouse.find()   
        for(let i = 0; i<shipment.length; i++){
            for(let j = 0; j < warehouse.length; j++){
                for(let k = 0; k < warehouse[j].inventory_product_shipments.length; k++){
                    if((warehouse[j].inventory_product_shipments)[k].shipment == shipment[i]) {
                        movement.shipments.push({"ShipmentID": shipment[i],"Address":warehouse[j].street + ", " + 
                        warehouse[j].ward + ", " + warehouse[j].district + ", " + warehouse[j].province})
                    }
                }
            }
        }
        
        return sendSuccess(res, "Get product movement of information successfully.", movement)
    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})
/**
 * @route POST api/admin/product/:orderId
 * @description admin add product to customer's order
 * @access public
 */
productAdminRoute.post('/:orderId',
    async (req, res) => {
        try {
            const {orderId} = req.params
            const {products} = req.body      
            if(!products) return sendError(res, 'Product Not null')      
            const order = await Order.findOne({orderId: orderId})
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
* @route  PUT api/admin/product/:productId
* @description admin update product information
* @access public
*/
productAdminRoute.put('/:productId',
    async (req, res) => {
        try {
            const {productId} = req.params
            const product = await Product.findOne({_id: productId})
            if (!product)
                return sendError(res, "Product does not exist")
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
            const errors = addProductValidate(req.body)
            if (errors) return sendError(res, errors)
            await Product.findByIdAndUpdate(productId, {name, quantity, unit, note})            
            return sendSuccess(res, "Update product successfully.")
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
    )


/**
* @route DELETE api/admin/product/:productId
* @description admin update product
* @access public
*/
productAdminRoute.delete('/:productId',
    async (req, res) => {
        try {
            const {productId} = req.params
            const product = await Product.findOne({_id: productId})
            if (!product)
                return sendError(res, "Product does not exist.")
            console.log(product.product_shipments.length)
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
            return sendSuccess(res, "Delete product successfully")
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
)



export default productAdminRoute
