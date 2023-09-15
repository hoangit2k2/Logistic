import express from "express"
import { PRODUCT_UNIT } from "../constant.js"
import { sendError, sendServerError, sendSuccess } from "../helper/client.js"
import { lookupPostageValidate } from "../validation/tracking.js"
import DeliveryService from '../model/DeliveryService.js'
import Distance from '../model/Distance.js'
import { calculateShipmentFee } from "../service/order.js"

const trackingRoute = express.Router()

/**
 * @route POST /api/tracking/postage
 * @description customer look up a postage
 * @access public
 */
trackingRoute.post('/postage', async (req, res) => {
    const errors = lookupPostageValidate(req.body)
    if (errors) return sendError(res, errors)

    const { fromProvince, fromDistrict, fromWard, toProvince, toDistrict, toWard, unit, quantity, serviceId, serviceName } = req.body
    if (!serviceId.match(/^[0-9a-fA-F]{24}$/))
    return sendError(res, "ServicedID information is not found.")  
    try {
        const sv = await DeliveryService.findOne({
            $or: [
                { _id: serviceId },
                { name: serviceName }
            ]
        }).populate('price')
        if (!sv) return sendError(res, 'the service is not exist.')

        const distances = await Distance.find({
            fromProvince,
            toProvince
        })
        let distance = null
        distances.some(value => {
            if (sv.distances.includes(value._id)) {
                distance = value
                return true
            }
            return false
        })
        if (!distance) return sendError(res, 'the service don\'t support this road.')

        let result = calculateShipmentFee(distance, quantity, sv.price, unit)
        return sendSuccess(res, 'calculate shipment fee successfully.', { result })
    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})

/**
 * @route GET /api/tracking/service/:serviceId
 * @description get pricelist of service by province
 * @access public
 */
// trackingRoute.get('/service/:serviceId', async (req, res) => {
//     const serviceId = req.params.serviceId
//     try {
//         const service = await DeliveryService.findById(serviceId).select({ _id: 1, name: 1, sub_detail: 1, price_files: 1 })
//         if (!service || service.price_files.length === 0) return sendError(res, 'not exist.')
//         const serviceWithUniquePriceFiles = [...new Map(service.price_files.map(item => [item.province, item])).values()]
//         return sendSuccess(res, 'request successfully', serviceWithUniquePriceFiles)
//     } catch (error) {
//         console.log(error)
//         return sendServerError(res)
//     }
// })

export default trackingRoute