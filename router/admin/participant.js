import express from "express"
import { sendError, sendServerError, sendSuccess } from "../../helper/client.js"
import {createLogoDir} from "../../middleware/index.js"
import { handleFilePath, uploadResources } from '../../constant.js'
import {createParticipantValidate} from "../../validation/participant.js"
import { unlinkSync } from 'fs'
import Participant from "../../model/Participant.js"
import DeliveryService from "../../model/DeliveryService.js"
const participantAdminRoute = express.Router()

/**
 * @route POST /api/admin/participant/:serviceId
 * @description create a new participant
 * @access private
 */
participantAdminRoute.post('/:serviceId', 
    createLogoDir,
    uploadResources.single('banner'),   
    async (req, res) => {    
        const error = createParticipantValidate(req.body)
        if (error) return sendError(res, error)      
        try {            
            const {serviceId} = req.params
            const isExistedService = await DeliveryService.exists({_id: serviceId})
            if (!isExistedService) return sendError(res, "Service is not existed.")
            const banner = handleFilePath(req.file) 
            const {name, description} = req.body;
            const participant = await Participant.create({name, banner, description});

            await DeliveryService.updateOne( { _id: serviceId}, { $push: {participants : participant}} )
            return sendSuccess(res, 'Create participant successfully.', {name, banner, description})
            
        } catch (error) {
            console.log(error)
            if (req.banner) unlinkSync(req.banner.path)
            return sendServerError(res)
        }
    }
)


/**
 * @route PUT /api/admin/participant/:id
 * @description update description/banner of a existing participant
 * @access private
 */
participantAdminRoute.put('/:id',
    createLogoDir,
    uploadResources.single('banner'),
    async (req, res) => {
        const {id} = req.params;
        const banner = handleFilePath(req.file)
        const {name, description} = req.body;
        try {
            //Check participant exists or not
            const participant = await Participant.findById(id);
            if (participant){
                if (name && name !== participant.name) {
                    const isExistName = await Participant.exists({name})
                    if (isExistName) return sendError(res, "New name is existed.")
                }
                await Participant.findByIdAndUpdate(id, {name, banner, description})
                return sendSuccess(res, "Update participant successfully.",{name, banner, description})
            }        
            return sendError(res, "Participant does not exist.")

        } catch (error) {
            console.log(error)
            if (req.banner) unlinkSync(req.banner.path)
            return sendServerError(res, error)
        }
    }
)

/**
 * @route DELETE /api/admin/participant/:id
 * @description delete a existing participant
 * @access private
 */
participantAdminRoute.delete('/:id',
    async (req, res) => {
        const {id} = req.params;    
        try {
            const isExist = await Participant.exists({_id: id})
            if (!isExist) return sendError(res, "Participant does not exist.")
            await DeliveryService.updateOne({},{ $pull: { participants: id}})
            const data = await Participant.findByIdAndRemove(id)
            return sendSuccess(res, "Delete participant successfully.",data)
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
)


export default participantAdminRoute