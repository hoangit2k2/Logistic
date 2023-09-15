import mongoose from "mongoose"
import { RETURN_ZONE, PRODUCT_UNIT, ORDER_STATUS, PRODUCT_STATUS, PICK_UP_AT, NOTIFY_EVENT } from "../constant.js"
import Order from "../model/Order.js"
import Product from "../model/Product.js"
import Warehouse from "../model/Warehouse.js"
import DeliveryService from '../model/DeliveryService.js'
import Customer from '../model/Customer.js'
import User from "../model/User.js"
import { findNearestWarehouse } from "./location.js"
import { findRoutes } from "./DijkstraWeightedGraph.js"
import { sendError, sendServerError, sendSuccess, sendAutoMail, sendAutoSMS } from "../helper/client.js"
import { io } from "socket.io-client"
/**
 * generate ID for an order
 * @returns {string} generated order ID
 */
export const genarateOrderID = async () => {
    try {
        while (true) {
            const orderId = Math.floor(10000000 + Math.random() * 90000000).toString()
            const isExist = await Order.exists({
                orderId
            })
            if (!isExist) {
                return orderId
            }
        }
    } catch (error) {
        console.log(error)
        return null
    }
}

/**
 * calculate order fee
 * @param {ObjectId} orderId
 * @returns {Number|null} 
 */
export const calculateOrderFee = async orderId => {
    let fee = null
    try {
        const products = await Product.find({ order: orderId }).populate('product_shipments', 'value')
        products.forEach(pro => {
            pro.product_shipments.forEach(shipment => {
                fee += shipment.value
            })
        })
    } catch (error) {
        console.log(error)
    }
    return fee
}

/**
 * generate a chain of routes
 * @param {*} origin
 * @param {*} destination
 * @returns {string[]|null} the chain of roads for transporting shipments
 */
export const generateRoute = async (service, origin, destination) => {
    try {
        const originWh = ((origin.loading === PICK_UP_AT.SHIP) ? await findNearestWarehouse(origin.address) : origin.address)._id
        const destinationWh = ((destination.unloading === PICK_UP_AT.SHIP) ? await findNearestWarehouse(destination.address) : destination.address)._id
        const route = await findRoutes(service, originWh.toString(), destinationWh.toString())
        if (route) {
            route.map(ele => mongoose.Types.ObjectId(ele))
        }
        return route
    } catch (error) {
        console.log(error)
        return null
    }
}

/**
 * check condition for changing the status of order
 * @param {Order} order order need to be handled
 * @param {ORDER_STATUS} nxtSta next status
 * @returns {boolean} whether can change the status or not
 */
export const canChangeOrderStatus = async (order, nxtSta) => {
    try {
        const curSta = order.status
        if (curSta === ORDER_STATUS.waiting) {
            if (nxtSta === ORDER_STATUS.refused) {

            }
            else if (nxtSta === ORDER_STATUS.accepted && order.route && order.route.length >= 0) {
                const numberOfProduct = await Product.find({ order: order._id }).count()
                const numberOfHandledProduct = await Product.find({ order: order._id, status: PRODUCT_STATUS.already })
                if (numberOfHandledProduct < numberOfProduct) {
                    return false
                }
            }
            else {
                return false
            }
        }

        else if (curSta === ORDER_STATUS.completed) {
            if (nxtSta === ORDER_STATUS.accepted) {
                return false
            }
            else {
                return false
            }
        }
        else if (curSta === ORDER_STATUS.cancel) {
            if (nxtSta === ORDER_STATUS.accepted) {
                return false
            }
            else {
                return false
            }
        }
        else if (curSta === ORDER_STATUS.pay) {
            if (nxtSta === ORDER_STATUS.completed) {
                return true
            }
            else {
                return false
            }
        }
        
        else if (curSta === ORDER_STATUS.unpay) {
            if (nxtSta === ORDER_STATUS.pay) {
                return true
            }
            if (nxtSta === ORDER_STATUS.cancel) {
                return true
            }
            else {
                return false
            }
        }
        return true
    } catch (error) {
        console.log(error)
        return false
    }
}

/**
 * handle order with product information
 * @param {Order} order order need to be handled
 * @returns {Object} order with more information
 */
export const handleOrderInfo = async (order) => {
    if (!order) return order
    const swallowOrder = { ...order._doc }
    try {
        order = await order.populate(
            [
                {
                    path: 'service',
                    select: ['name'],
                    model: DeliveryService
                },
                {
                    path: 'customer',
                    select: ['name', 'customer_type'],
                    model: Customer
                },
                {
                    path: 'route',
                    model: Warehouse,
                    select: ['name', 'phone', 'street', 'ward', 'district', 'province', 'lon', 'lat']
                }
            ]
        )
        if (mongoose.Types.ObjectId.isValid(order.origin.address)) {
            order = await order.populate(
                {
                    path: 'origin.address',
                    model: Warehouse,
                    select: ['name', 'phone', 'street', 'ward', 'district', 'province', 'lon', 'lat']
                }
            )
        }

        if (mongoose.Types.ObjectId.isValid(order.destination.address)) {
            order = await order.populate(
                {
                    path: 'destination.address',
                    model: Warehouse,
                    select: ['name', 'phone', 'street', 'ward', 'district', 'province', 'lon', 'lat']
                }
            )
        }

        if (order.route && order.route.length > 0) {
            order = await order.populate(
                {
                    path: 'route',
                    model: Warehouse,
                    select: ['name', 'phone', 'street', 'ward', 'district', 'province', 'lon', 'lat']
                }
            )
        }

        const products = await Product.find({ order: order._id }).select(['-order', '-__v', '-product_shipments'])
        return { ...order._doc, products }
    } catch (error) {
        console.log(error)
        return swallowOrder
    }
}

/**
 * calculate shipment fee
 * @param {Distance} distance 
 * @param {Number} quantity
 * @param {Price} price 
 * @param {String} unit // PRODUCT_UNIT: 'kg' || 'm3' || 'ton'
 * @param {{value: number, base: boolean}[]} tax // value >= 0, base is true means tax will be increated from base price, the preceding tax element is used first
 * @param {Number[]} surcharge // surcharge >= 0, the preceding tax element is used first
 * @returns {Number} total price
 */
export const calculateShipmentFee = (distance, quantity, price, unit, tax = [], surcharge = []) => {
    let totalPrice = 0
    if (unit === PRODUCT_UNIT.KG)
        totalPrice = calculateShipmentFeeUtl(distance, quantity, price.uKG)
    else if (unit === PRODUCT_UNIT.TON)
        totalPrice = calculateShipmentFeeUtl(distance, quantity, price.uTON)
    else if (unit === PRODUCT_UNIT.M3)
        totalPrice = calculateShipmentFeeUtl(distance, quantity, price.uM3)
    let basePrice = totalPrice
    if (tax.length > 0) {
        tax.forEach((ele) => {
            if (ele.value >= 0) {
                if (ele.base)
                    totalPrice += basePrice * ele.value
                else
                    totalPrice *= 1 + ele.value
            }
        })
    }
    if (surcharge.length > 0) {
        surcharge.forEach((value) => {
            if (value >= 0) {
                totalPrice += value
            }
        })
    }
    return Math.ceil(totalPrice / 1000) * 1000
}

const calculateShipmentFeeUtl = (distance, weight, price) => {
    let totalPrice = 0
    const priceIdx = Object.keys(RETURN_ZONE).indexOf(distance.zonecode)

    let idx = 0
    let value = price[idx]
    while (weight > 0 && idx < price.length) {
        if (value.next) {
            totalPrice += value.prices[priceIdx]
            weight -= value.sidestep
        }
        else {
            totalPrice += value.prices[priceIdx]
            weight -= value.sidestep
            idx += 1
            value = price[idx]
        }
    }
    return totalPrice
}
//send feeback order to user
export const sendFeedback = async (staffId, content, IdCustomer) => {
    try {
        const staff = await User.findById(staffId)
        const customer = await Customer.findById(IdCustomer)
        const user = await User.findOne({ role: customer._id })
        if (staff.email) {
            const optionsStaff = {
                from: process.env.MAIL_HOST,
                to: staff.email,
                subject: '[noreply-Logistics Webapp]  Feedback customer',
                html: `<p>Feedback của khách hàng: ${customer.name}</p>
                   <p>IdCustomer: ${IdCustomer}</p>
                   <P>Nội dung: ${content}</p>`
            }
            const sendMailToStaff = await sendAutoMail(optionsStaff)
        }

        else { //Send SMS
            const optionsStaff = {
                from: process.env.PHONE_NUMBER,
                to: staff.phone,
                body: `Feedback từ khách hàng: ${customer.name} có ID: ${IdCustomer} với nội dung: ${content}`
            }
            const senSMSToStaff = await sendAutoSMS(optionsStaff)
        }

        if (user.email) {
            const optionsCustomer = {
                from: process.env.MAIL_HOST,
                to: user.email,
                subject: '[noreply-Logistics Webapp]  Feedback customer',
                html: `<p>Chúng tôi đã nhân được feedback từ quý khách </p>
                       <P>Nội dung: ${content}</p>
                       <P>Xin chân thành sự phản hồi của quý khách !</p>`
            }
            const sendMailToCustomer = await sendAutoMail(optionsCustomer)
        }
        else {
            const optionsCustomer = {
                from: process.env.PHONE_NUMBER,
                to: user.phone,
                body: `Chúng tôi đã nhận được feedback từ bạn, Xin chân thành cảm ơn sự phản hồi của quý khách`
            }
            const sendSMSToCustomer = await sendAutoSMS(optionsCustomer)
        }
        const nameCustomer = customer.name
        const socket = io(process.env.SOCKET_SERVER, { reconnection: true });
        socket.emit(NOTIFY_EVENT.send, staffId, { IdCustomer, nameCustomer, content })
    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
}

export const sendtokenfeedbacktoCustomer = async (customerID, content) => {
    const socket = io(process.env.SOCKET_SERVER, { reconnection: true });
    socket.emit(NOTIFY_EVENT.send, customerID, { content })
}
// Send infor order to customer
export const sendInfoOrder = async (orderId) => {
    try {
        const id = (orderId).trim();
        const order = await Order.findOne({ orderId })
        const customerId = order.customer;
        const user = await User.findOne({ role: customerId })
        const products = await Product.find({ customerId })
        const delivery_services = await DeliveryService.findOne({ _id: order.service })

        let toalPostage = 0;
        for (const p of products) {
            for (const ps of p.product_shipments) {
                const productShipment = await Product_Shipment.find({ _id: ps })
                let valueproductShipment = productShipment[0].value
                toalPostage += valueproductShipment
            }
        }
        if (user.email) {//Send email
            const options = {
                from: process.env.MAIL_HOST,
                to: user.email,
                subject: '[noreply-Logistics Webapp] Order details information',
                html: `<p>Đơn hàng của bạn đã được xác nhận</p>
                            <p>Dịch vụ của bạn: ${delivery_services.name}</p>
                            <p>Lộ phí: ${toalPostage}</p>
                            <p>Gửi từ: ${order.origin.address}</p>
                            <p>Đến: ${order.destination.address}</p>`

            }
            const sendMailSuccess = await sendAutoMail(options)
            if (!sendMailSuccess) return false
        }
        else {//Send SMS
            const options = {
                from: process.env.PHONE_NUMBER,
                to: user.phone,
                body: `Đơn hàng của bạn đã được xác nhận.Dịch vụ của bạn  ${delivery_services.name}.Với tổng lộ phí là ${toalPostage} .Được gửi từ ${order.origin.address} đến ${order.destination.address}.Xin cảm ơn bạn đã đặt hàng`
            }
            const sendSMSSuccess = await sendAutoSMS(options)
            if (!sendSMSSuccess) return false
        }
        const serviceName = delivery_services.name
        const userId = user._id
        const socket = io(process.env.SOCKET_SERVER, { reconnection: true });
        socket.emit(NOTIFY_EVENT.send, userId, { order, serviceName, products, toalPostage });
    }
    catch (error) {
        console.log(error)
        return false
    }
}
// Send completed order to customer
export const sendCompletedOrder = async (orderId) => {
    try {
        const id = (orderId).trim();
         const order = await Order.findOne({ orderId })
         const customerId = order.customer;
         const user = await User.findOne({ role: customerId })
         const products = await Product.find({ customerId })
         const delivery_services = await DeliveryService.findOne({ _id: order.service })

         if (user.email) { //send email
             const options = {
                 from: process.env.MAIL_HOST,
                 to: user.email,
                 subject: '[noreply-Logistics Webapp] Order details information',
                 html : `<p>Đã hoàn tất đơn hàng của ban.</p>
                             <p>Dịch vụ của bạn: ${delivery_services.name}</p>
                             <p>Mã kiện hàng: ${order.orderId}</p>
                             `
             }
             const sendMailSuccess = await sendAutoMail(options)
             if(!sendMailSuccess) return false
         }
         else {//Send SMS
             const options = {
                 from: process.env.PHONE_NUMBER,
                 to: user.phone,
                 body: `Đã hoàn tất đơn hàng của ban. Dịch vụ của bạn: ${delivery_services.name}. Tên sản phẩm: ${order.products}`}
             const sendSMSSuccess = await sendAutoSMS(options)
             if (!sendSMSSuccess) return false
         }
         const serviceName = delivery_services.name
         const userId = user._id
         const socket = io(process.env.SOCKET_SERVER, { reconnection: true });
         socket.emit(NOTIFY_EVENT.send, userId, { order, products, serviceName, orderId });
     } catch (error) {
         console.log(error);
         return false
     } 
 }
 // Send cancel order to customer
   export const sendCancelOrder = async (orderId) => {
    try {
         const id = (orderId).trim()
         const order = await Order.findOne({ orderId })
         const customerId = order.customer;
         const user = await User.findOne({ role: customerId })
         const products = await Product.find({ customerId })
         const delivery_services = await DeliveryService.findOne({ _id : order.service })

         if (user.email) { //send email
             const options = {
                 from: process.env.MAIL_HOST,
                 to: user.email,
                 subject: '[noreply-Logistics Webapp] Order details information',
                 html : `<p>Đơn hàng của bạn đã được hủy.</p>
                             <p>Mã Đơn hàng: ${order.orderId}</p>
                             `
             }
             const sendMailSuccess = await sendAutoMail(options)
             if(!sendMailSuccess) return false
         }
         else {//Send SMS
             const options = {
                 from: process.env.PHONE_NUMBER,
                 to: user.phone,
                 body: `Đơn hàng của bạn đã được hủy. Mã đơn hàng: ${order.orderId}`
             }
             const sendSMSSuccess = await sendAutoSMS(options)
             if (!sendSMSSuccess) return false
         }
         const serviceName = delivery_services.name
         const userId = user._id
         const socket = io(process.env.SOCKET_SERVER, { reconnection: true });
         socket.emit(NOTIFY_EVENT.send, userId, { order, products, serviceName, orderId });
     } catch (error) {
         console.log(error);
         return false
     } 
 }
 // Send Pay order to customer
   export const sendPaylOrder = async (orderId) => {
    try {
         const order = await Order.findOne({ orderId })
         const customerId = order.customer;
         const user = await User.findOne({ role: customerId })
         const products = await Product.find({ customerId })
         const delivery_services = await DeliveryService.findOne({ _id: order.service })

         if (user.email) { //send email
             const options = {
                 from: process.env.MAIL_HOST,
                 to: user.email,
                 subject: '[noreply-Logistics Webapp] Order details information',
                 html : `<p>Đơn hàng của bạn <b>đã được thanh toán</b>.</p>
                             <p>Dịch vụ của bạn: ${delivery_services.name}</p>
                             <p>Mã Đơn hàng: ${order.orderId}</p>
                             `
             }
             const sendMailSuccess = await sendAutoMail(options)
             if(!sendMailSuccess) return false
         }
         else {//Send SMS
             const options = {
                 from: process.env.PHONE_NUMBER,
                 to: user.phone,
                 body: `Đơn hàng của bạn đã được thanh toán. Dịch vụ của bạn: ${order.service.name}. Mã đơn hàng: ${order.orderId}`
             }
             const sendSMSSuccess = await sendAutoSMS(options)
             if (!sendSMSSuccess) return false
         }
         const serviceName = delivery_services.name
         const userId = user._id
         const socket = io(process.env.SOCKET_SERVER, { reconnection: true });
         socket.emit(NOTIFY_EVENT.send, userId, { order, products, serviceName, orderId });
     } catch (error) {
         console.log(error);
         return false
     } 
 }
 // Send Pay order to customer
   export const sendUnpaylOrder = async (orderId) => {
    try {
         const order = await Order.findOne({ orderId })
         const customerId = order.customer;
         const user = await User.findOne({ role: customerId })
         const products = await Product.find({ customerId })
         const delivery_services = await DeliveryService.findOne({ _id: order.service })

         if (user.email) { //send email
             const options = {
                 from: process.env.MAIL_HOST,
                 to: user.email,
                 subject: '[noreply-Logistics Webapp] Order details information',
                 html : `<p>Đơn hàng của bạn <b>Chưa được thanh toán</b>.</p>
                             <p>Dịch vụ của bạn: ${delivery_services.name}</p>
                             <p>Mã Đơn hàng: ${order.orderId}</p>
                             `
             }
             const sendMailSuccess = await sendAutoMail(options)
             if(!sendMailSuccess) return false
         }
         else {//Send SMS
             const options = {
                 from: process.env.PHONE_NUMBER,
                 to: user.phone,
                 body: `Đơn hàng của bạn chưa được thanh toán. Dịch vụ của bạn: ${order.service.name}. Mã đơn hàng: ${order.orderId}`
             }
             const sendSMSSuccess = await sendAutoSMS(options)
             if (!sendSMSSuccess) return false
         }
         const serviceName = delivery_services.name
         const userId = user._id
         const socket = io(process.env.SOCKET_SERVER, { reconnection: true });
         socket.emit(NOTIFY_EVENT.send, userId, { order, products, serviceName, orderId });
     } catch (error) {
         console.log(error);
         return false
     }
    }