import express from "express"
import { sendError, sendServerError, sendSuccess } from "../../helper/client.js"
import { createOrderValidate, updateOrderStatusValidate } from "../../validation/order.js"
import { verifyAdmin, verifyToken } from '../../middleware/index.js'
import { calculateOrderFee, canChangeOrderStatus, genarateOrderID, generateRoute, handleOrderInfo, sendCancelOrder, sendCompletedOrder, sendInfoOrder, sendPaylOrder, sendUnpaylOrder } from "../../service/order.js"
import DeliveryService from '../../model/DeliveryService.js'
import Order from "../../model/Order.js"
import Customer from "../../model/Customer.js"
import Product from "../../model/Product.js"
import { locateAddress } from "../../service/location.js"
import Warehouse from "../../model/Warehouse.js"
import { ORDER_STATUS } from "../../constant.js"
import { isServedByService } from "../../service/deliveryService.js"

const orderAdminRoute = express.Router()

/**
 * @route GET /api/admin/order
 * @description get list of order
 * @access private
 */
orderAdminRoute.get('/', async (req, res) => {
    try {
        const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 0
        const page = req.query.page ? parseInt(req.query.page) : 0
        const { sortBy, status } = req.query
        var filterCondition = status ? { status: status } : {}
        const orders = await Promise.all((await Order.find({ filterCondition })
            .skip(pageSize * page)
            .limit(pageSize)
            .sort(sortBy)
            .select('-__v')).map(async order => await handleOrderInfo(order)))
        const length = await Order.find({ filterCondition }).count()
        return sendSuccess(res, 'get order successfully', { length, orders })
    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})


/**
 * @route GET /api/admin/order/:orderId
 * @description get an order by orderId
 * @access private
 */
orderAdminRoute.get('/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params
        const order = await handleOrderInfo(await Order.findOne({ orderId: orderId }).select('-__v'))
        if (order)
            return sendSuccess(res, 'get order successfully', order)
        return sendError(res, `The order ${orderId} does not exist.`)
    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})

/**
 * @route POST /api/order
 * @description customer create a new order
 * @access private
 */
orderAdminRoute.post('/:customerId',
    verifyToken,
    verifyAdmin,
    async (req, res) => {
        try {
            const errors = createOrderValidate(req.body)
            if (errors) return sendError(res, errors)

            const customerId = await Customer.exists({ _id: req.params.customerId })
            if (!customerId) return sendError(res, "Customer does not exist.")

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
            if (!(await isServedByService(serviceObj, province)))
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
            if (!(await isServedByService(serviceObj, province)))
                return sendError(res, "No available service serve this route.")

            const orderId = await genarateOrderID()

            const order = await Order.create({ orderId, service: serviceObj._id, customer: customerId._id, sender, receiver, origin, destination })

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
 * @route PUT /api/admin/order/:orderId/status
 * @description update status order by orderId
 * @access private
 */
orderAdminRoute.put('/:orderId/status', async (req, res) => {
    const errors = updateOrderStatusValidate(req.body)
    if (errors) return sendError(res, errors)

    const { orderId } = req.params
    const { status } = req.body

    try {
        const order = await Order.findOne({ orderId })
        if (!order) return sendError(res, 'Order does not exist.', 404)

        const canChange = await canChangeOrderStatus(order, status)

        if (canChange) {
            if (order.status === ORDER_STATUS.waiting) {
                const orderFee = await calculateOrderFee(order._id)
                const orderWithNewStatus = await Order.findOneAndUpdate({ orderId }, { status: status, total_price: orderFee })
                if (orderWithNewStatus) {
                    if (status === ORDER_STATUS.accepted) {
                        sendInfoOrder(order.orderId)
                    }
                    return sendSuccess(res, 'Change status of the order successfully.',
                        {
                            ...(await handleOrderInfo(orderWithNewStatus)),
                            status,
                            total_price: orderFee
                        }
                    )
                }
            }
            else {
                const orderWithNewStatus = await Order.findOneAndUpdate({ orderId }, { status: status })
                if (orderWithNewStatus) {
                    if (status === ORDER_STATUS.completed) {
                        sendCompletedOrder(order.orderId)
                    }
                    if (status === ORDER_STATUS.pay) {
                        sendPaylOrder(order.orderId)
                    }
                    if (status === ORDER_STATUS.unpay) {
                        sendUnpaylOrder(order.orderId)
                    }
                    if (status === ORDER_STATUS.cancel) {
                        sendCancelOrder(order.orderId)
                    }
                    return sendSuccess(res, 'Change status of the order successfully.',
                        {
                            ...(await handleOrderInfo(orderWithNewStatus)),
                            status
                        }
                    )
                }
            }
        }
        return sendError(res, "Can not change the status of this order.")
    }
    catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})

/**
 * @route PUT /api/admin/order/:orderId/route
 * @description update route of an order by orderId
 * @access private
 */
orderAdminRoute.put('/:orderId/route', async (req, res) => {
    const { orderId } = req.params

    try {
        const order = await handleOrderInfo(await Order.findOne({ orderId }))
        if (!order) return sendError(res, 'Order does not exist.', 404)

        const route = await generateRoute({ _id: order.service }, order.origin, order.destination)
        // console.log(route)
        await Order.findOneAndUpdate({ orderId }, { route })
        const returnRoute = (await Order.findOne({ orderId }).populate('route')).route
        return sendSuccess(res, "Genarate transportation route successfully.", returnRoute)
    }
    catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})
export default orderAdminRoute