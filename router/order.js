import express from "express"
import { sendError, sendServerError, sendSuccess } from "../helper/client.js"
import { createOrderValidate, updateOrderValidate } from "../validation/order.js"
import { locateAddress } from "../service/location.js"
import { verifyToken, verifyCustomer, verifyCustomerOrAdmin } from '../middleware/index.js'
import { genarateOrderID, handleOrderInfo } from "../service/order.js"
import DeliveryService from '../model/DeliveryService.js'
import Order from "../model/Order.js"
import Product from "../model/Product.js"
import Warehouse from "../model/Warehouse.js"
import User from "../model/User.js"
import Customer from "../model/Customer.js"
import { ORDER_STATUS } from "../constant.js"
import { isServedByService } from "../service/deliveryService.js"
import { sendFeedback, sendtokenfeedbacktoCustomer } from "../service/order.js"
const orderRoute = express.Router()

/**
 * @route POST /api/order
 * @description customer create a new order
 * @access private
 */
orderRoute.post('/',
    verifyToken,
    verifyCustomer,
    async (req, res) => {
        try {
            const errors = createOrderValidate(req.body)
            if (errors) return sendError(res, errors)

            const { service, sender, receiver, products, origin, destination } = req.body

            // check whether service is available
            const serviceObj = await DeliveryService.findOne({ name: service })
            if (!serviceObj) return sendError(res, "Delivery service is not available.")

            let province = null
            // check whether address is real or not
            if (typeof origin.address === 'object') {
                let data = await locateAddress(origin.address.street + origin.address.ward + origin.address.district + origin.address.province)
                if (!data) return sendError(res, 'Origin is not existing.')
                province = origin.address.province
            }
            else {
                const originWh = await Warehouse.findById(origin.address).select({ _id: 1, province: 1 })
                origin.address = originWh._id
                province = originWh.province
                if (!origin.address) return sendError(res, "Origin warehouse doesn't exist.")
            }
            if(!(await isServedByService(serviceObj, province)))
                return sendError(res, "No available service serve this route.")

            if (typeof destination.address === 'object') {
                let data = await locateAddress(destination.address.street + destination.address.ward + destination.address.district + destination.address.province)
                if (!data) return sendError(res, 'Destination is not existing.')
                province = destination.address.province
            }
            else {
                const destinationWh = await Warehouse.findById(destination.address).select({ _id: 1, province: 1 })
                destination.address = destinationWh._id
                province = destinationWh.province
                if (!destination.address) return sendError(res, "Destination warehouse doesn't exist.")
            }
            if(!(await isServedByService(serviceObj, province)))
                return sendError(res, "No available service serve this route.")

            const orderId = await genarateOrderID()

            const order = await Order.create({ orderId, service: serviceObj._id, customer: req.user.role._id, sender, receiver, origin, destination })

            products.forEach(async product => {
                const { name, quantity, unit, note } = product
                await Product.create({ name, quantity, unit, note, order: order._id })
            })

            return sendSuccess(res, 'Create new order successfully', { orderId: order.orderId })
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    })


/**
 * @route GET /api/order/
 * @description customer get list of their order
 * @access private
 */
orderRoute.get('/',
    verifyToken,
    verifyCustomer,
    async (req, res) => {
        try {
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 0
            const page = req.query.page ? parseInt(req.query.page) : 0
            const { sortBy, status } = req.query
            var filterCondition = status ? { status: status } : {}
            const customerId = req.user.role._id
            const orders = await Promise.all((await Order.find({ $and: [{ customer: customerId }, filterCondition] })
                .skip(pageSize * page)
                .limit(pageSize)
                .sort(sortBy)
                .select('-__v')).map(async order => await handleOrderInfo(order)))
            const length = await Order.find({ $and: [{ customer: customerId }, filterCondition] }).count()
            return sendSuccess(res, 'get list of orders successfully.', { length, orders })
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    })


/**
 * @route GET /api/order/:orderId
 * @description customer see their order by orderId  
 * @access private
 */
orderRoute.get('/:orderId',
    verifyToken,
    verifyCustomer,
    async (req, res) => {
        try {
            const { orderId } = req.params
            const order = await handleOrderInfo(await Order.findOne({ orderId: orderId }).select('-__v'))
            if (order)
                return sendSuccess(res, 'get order successfully.', order)
            return sendError(res, `The order ${orderId} does not exist.`)
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
)

/**
 * @route PUT /api/order/:orderId
 * @description customer can update their order when order status is waiting 
 * @access private
 */
orderRoute.put('/:orderId',
    verifyToken,
    verifyCustomer,
    async (req, res) => {
        try {
            const errors = updateOrderValidate(req.body)
            if (errors) return sendError(res, errors)

            const { sender, receiver, products, origin, destination } = req.body
            const orderId = req.params.orderId
            
            const order = await Order.findOne({ orderId })
            if(!order) return sendError(`The order ${orderId} does not exist.`)
            if(order.status !== ORDER_STATUS.waiting)
                return sendError('Can not edit this order because it is not in waiting process.')

            // check whether address is real or not
            if (typeof origin.address === 'object') {
                let data = await locateAddress(origin.address.street + origin.address.ward + origin.address.district + origin.address.province)
                if (!data) return sendError(res, 'Origin is not existing.')
            }
            else {
                origin.address = await Warehouse.exists({ _id: origin.address })
                if (!origin.address) return sendError(res, "Origin warehouse doesn't exist.")
            }

            if (typeof destination.address === 'object') {
                let data = await locateAddress(destination.address.street + destination.address.ward + destination.address.district + destination.address.province)
                if (!data) return sendError(res, 'Destination is not existing.')
            }
            else {
                destination.address = await Warehouse.exists({ _id: destination.address })
                if (!destination.address) return sendError(res, "Destination warehouse doesn't exist.")
            }

            const updatedOrder = await Order.findByIdAndUpdate(order._id, { sender, receiver, origin, destination })

            await Product.deleteMany({ order: order._id })

            products.forEach(async product => {
                const { name, quantity, unit, note } = product
                await Product.create({ name, quantity, unit, note, order: order._id })
            })

            return sendSuccess(res, 'Update the order successfully.', await handleOrderInfo(updatedOrder))
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
)

/**
 * @route GET /api/order/tracking/:lstOrderId
 * @description get list of order
 * @access public
 */
orderRoute.get('/tracking/:lstOrderId', async (req, res) => {
    try {
        const lstOrderId = req.params.lstOrderId.split('&')
        const orders = await Promise.all((await Order.find({ orderId: { $in: lstOrderId } }).select('-__v')).map(async order => await handleOrderInfo(order)))
        return sendSuccess(res, 'Request successfully.', { orders, success: orders.length, failure: lstOrderId.length - orders.length })
    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})
/**
 * @route put /api/order/feedlback/:orderId
 * @description put feedback of order
 * @access private
 */
 orderRoute.put('/feedlback/:orderId',
 verifyToken,
 verifyCustomerOrAdmin,
 async (req, res) => {
     try {
        const staff = req.user.role.staff_type
        if(!staff){
         const orderId = req.params.orderId
         const {content} = req.body
         const order = await Order.findOne({ orderId })
         if(!order) return sendError(res,`the order ${orderId} does not exist.`)
         if(!content) return sendError(res,`the content does not exist.`)
         const staffId = order.staffconfirm
         if(!staffId) return sendError(res,'StaffConfirm not in Order')
         const customer = await Customer.findById(order.customer)
         sendFeedback(staffId,content,customer._id)
         let add = {user: customer.name, content: content}
         let feedlback = [...order.feedback, add]
         await Order.findByIdAndUpdate(order._id,{feedback: feedlback})
         return sendSuccess(res,"Create Feeback by customer successfully")    
        }
        else{
        const nameStaff = req.user.role.name
        const orderId = req.params.orderId
        const {content} = req.body
        const order = await Order.findOne({ orderId })
        if(!order) return sendError(res,`the order ${orderId} does not exist.`)
        if(!content) return sendError(res,`the content does not exist.`)
        const customer = await Customer.findById(order.customer)
        sendtokenfeedbacktoCustomer(customer._id,content)
        let add = {user: nameStaff, content: content}
        let feedlback = [...order.feedback, add]
        await Order.findByIdAndUpdate(order._id,{feedback: feedlback})
        return sendSuccess(res,"Create Feeback by staff successfully")               
        }
        
     } catch (error) {
         console.log(error)
         return sendServerError(res)
     }
 })
 /**
 * @route get /api/order/:orderId/feedback
 * @description get feedback of order
 * @access private
 */
  orderRoute.get('/:orderId/feedback',
  verifyToken,
  verifyCustomerOrAdmin,
  async(req, res) => {
    try {
          const orderId = req.params.orderId
          const order = await Order.findOne({orderId})
          if(!order) return sendError(res,`the orderID ${orderId} does not exist.`)
          const staff = req.user.role.staff_type
          const user = await User.findOne({role: order.customer})
          if(!staff){
                if(req.user.role._id == order.customer)  return sendSuccess(res, "get feedback successfully",order.feedback)
        
                else{return sendError(res, "forbidden")}
          }
          else
                return sendSuccess(res, "get feedback successfully",order.feedback)
      } catch (error) {
          return sendServerError(res)
      }
  })
export default orderRoute
