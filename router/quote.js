import express from "express"
import { sendError, sendServerError, sendSuccess } from "../helper/client.js"
import Quote from "../model/Quote.js"
import DeliveryService from "../model/DeliveryService.js"
const quoteRoute = express.Router()

/**
 * @route GET /api/quote
 * @description get all quotes 
 * @access public
 */
quoteRoute.get('/',
    async(req, res) => {
        try {
            const {limit, sortBy, keyword} = req.query
            var keywordCondition = keyword ? { $or:[
                { name: { $regex: keyword, $options: 'i'} },
                { description: { $regex: keyword, $options: 'i'} },
                { quote: { $regex: keyword, $options: 'i'} },
            ]} : {} 
            const quotes = await Quote.find(keywordCondition).limit(limit).sort(`${sortBy}`)
            if (quotes) return sendSuccess(res, "Get quote successfully.", quotes)
            return sendError(res, "No information found.")
        } catch(error){
            console.log(error)
            return sendServerError(res)
        }
    }
)

/**
 * @route GET /api/quote/:id
 * @description get a quote
 * @access public
 */
quoteRoute.get('/:id',
    async(req, res) => {
        try {
            const {id} = req.params
            const quote = await Quote.findById(id)
            if (quote) return sendSuccess(res, "Get quote successfully.", quote)
            return sendError(res, "No information found.")
        } catch(error){
            console.log(error)
            return sendServerError(res)
        }
    }
)

/**
 * @route GET /api/quote/service/:serviceId
 * @description get list of quotes of a service by serviceid
 * @access public
 */
quoteRoute.get('/service/:serviceId', async(req, res) =>{
    try{
        const {serviceId} = req.params
        const isExistedService = await DeliveryService.exists({_id: serviceId})
        if (!isExistedService) return sendError(res, "Service is not existed.")
        const service = await DeliveryService.find({ _id: serviceId})
        if (! service ) return sendError(res, 'Service is not existed')
        const result = await Quote.find({_id: service[0].quotes})
        
        return sendSuccess(res, 'Get quote successfully.', result)
    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
}
)
export default quoteRoute
