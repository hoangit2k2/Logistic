import express from "express"
import { sendError, sendServerError, sendSuccess } from "../../helper/client.js"
import {createLogoDir, verifyAdmin, verifyToken} from "../../middleware/index.js"
import { handleFilePath, upload, uploadResources } from "../../constant.js"
import {createQuoteValidate} from "../../validation/quote.js"
import { unlinkSync } from 'fs'
import Quote from "../../model/Quote.js"
import DeliveryService from "../../model/DeliveryService.js"
const quoteAdminRoute = express.Router()

/**
 * @route POST /api/admin/quote/:serviceId
 * @description create a new quote
 * @access private
 */
quoteAdminRoute.post('/:serviceId', 
    createLogoDir,
    uploadResources.single('avatar'),   
    async (req, res) => {    
        const error = createQuoteValidate(req.body)
        if (error) return sendError(res, error)
      
        try {
            const {serviceId} = req.params
            const isExistedService = await DeliveryService.exists({_id: serviceId})
            if (!isExistedService) return sendError(res, "Service is not existed.")
           
            const avatar = handleFilePath(req.file) 
            const {name, description, quote} = req.body;
            const isExist = await Quote.exists({
                $and: [
                    {name, description}
                ]
            })
            if (isExist) {
                return sendError(res, "This person is existed !")
            }
                            
            const newquote = await Quote.create({name, avatar: avatar , description, quote});
            await DeliveryService.updateOne( { _id: serviceId}, { $push: {quotes : newquote}} )
            return sendSuccess(res, 'Create quote successfully.', {name, description, quote, avatar})
            
        } catch (error) {
            console.log(error)
            if (req.avatar) unlinkSync(req.avatar.path)
            return sendServerError(res)
        }
    }
)

/**
 * @route PUT /api/admin/quote/:id
 * @description update content of quote by quoteId
 * @access private
 */
quoteAdminRoute.put('/:id',
    createLogoDir,
    uploadResources.single('avatar'),
    async (req, res) => {
        try{
            const {id} = req.params
            const isExist = await Quote.exists({_id: id})
            if(! isExist) return sendError(res, "Quote does not exist.")

            const avatar = handleFilePath(req.file)
            const {name, description, quote} = req.body
            
            const data = await Quote.findByIdAndUpdate(id, {name, description, quote, avatar:avatar})
            return sendSuccess(res, "Update quote successfully.", {name, description, quote, avatar})
            
        } catch (error) {
            console.log(error)
            if(req.avatar) unlinkSync(req.avatar.path)
            return sendServerError(res)
        }
    }
)


/**
 * @route DELETE /api/admin/quote/:id
 * @description delete a quote by quoteId
 * @access private
 */
quoteAdminRoute.delete('/:id',
    async (req, res) => {
        const {id} = req.params;    
        try {
            const isExist = await Quote.exists({_id : id});
            if (!isExist) return sendError(res, "Quote does not exist.");
            await DeliveryService.updateOne({},{ $pull: { quotes: id}})
            const data = await Quote.findByIdAndRemove(id)
            return sendSuccess(res, "Delete quote successfully.", data)
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
)

export default quoteAdminRoute