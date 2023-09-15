import express from "express"
import { sendError, sendServerError, sendSuccess } from "../helper/client.js"
import Participant from "../model/Participant.js"
import DeliveryService from "../model/DeliveryService.js"
const participantRoute = express.Router()

/**
 * @route GET /api/participant
 * @description get all participants
 * @access public
 */

participantRoute.get('/',
    async(req, res) => {
        try {
            const {limit, sortBy, keyword} = req.query
            var keywordCondition = keyword ? { $or:[
                { name: { $regex: keyword, $options: 'i'} },
                { description: { $regex: keyword, $options: 'i'} },
            ]} : {} 
            const participants = await Participant.find(keywordCondition).limit(limit).sort(`${sortBy}`)
            if (participants) return sendSuccess(res, "Get participant successfully.", participants)
            return sendError(res, "No information found.")
        } catch(error){
            console.log(error)
            return sendServerError(res)
        }
    }
)

/**
 * @route GET /api/participant/:participantId
 * @description get a participant by id
 * @access public
 */
participantRoute.get('/:participantId', async (req, res) => {
    try {
        const {participantId} = req.params;
        const participant = await Participant.findById(participantId)
        if (participant)
            return sendSuccess(res, 'get participant information successfully.', participant)
        return sendError(res, 'No information found.')
    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})


/**
 * @route GET /api/participant/service/:serviceId
 * @description get list of participants of a service by serviceid
 * @access public
 */
participantRoute.get('/service/:serviceId', async(req, res) =>{
    try{
        const {serviceId} = req.params
        const isExistedService = await DeliveryService.exists({_id: serviceId})
        if (!isExistedService) return sendError(res, "Service is not existed")
        const service = await DeliveryService.find({ _id: serviceId})
        if (! service ) return sendError(res, 'Service is not existed')
        const result = await Participant.find({_id: service[0].participants})
        return sendSuccess(res, 'Get participant successfully.', result)
    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
}

)
export default participantRoute