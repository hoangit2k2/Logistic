import express from "express"
import { sendError, sendServerError,sendAutoMail, sendSuccess } from "../../helper/client.js"
import { createMessageValidate} from "../../validation/message.js"
import Message from "../../model/Message.js"

const contactMsgAdminRoute = express.Router()

/**
 * @route GET /api/message
 * @description Get list of message (all or paging)
 * @access private
 */
contactMsgAdminRoute.get('/', async (req, res) => {
    try {
        const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 0
        const page = req.query.page ? parseInt(req.query.page) : 0
        const {keyword, sortBy, status} = req.query
        var keywordCondition = keyword ? { $or:[
            { name: { $regex: keyword, $options: 'i'} },
            { email: { $regex: keyword, $options: 'i'} },
            { phone: { $regex: keyword, $options: 'i'} },
            { message: { $regex: keyword, $options: 'i'} },            
        ]} : {} 
        var filterCondition = status ? {status: status} : {}
        const messages = await Message.find(
            {
                $and: [            
                    filterCondition,
                    keywordCondition                
                ]
            }
        ).skip(page*pageSize).limit(pageSize).sort(`${sortBy}`)
        const length = await Message.find(
            {
                $and: [            
                    filterCondition,
                    keywordCondition                
                ]
            }
        ).count()
        if (messages)
            return sendSuccess(res, 'get message information successfully.', {length, messages})
        return sendError(res, 'message information is not found.')
    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})

/**
 * @route GET /api/message/:messageId
 * @description get a message by id
 * @access 
 */
contactMsgAdminRoute.get('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const message = await Message.findById(id)
        if (message)
            return sendSuccess(res, 'get message information successfully.', message)
        return sendError(res, 'message information is not found.')
    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})

/**
 * @route PUT /api/admin/message/:id
 * @description admin update status of a message
 * @access private
 */
contactMsgAdminRoute.put('/:id',
    async (req, res) => {
        try{
            const {id} = req.params
            const {status} = req.body            
            const isExist = await Message.exists({_id: id})
            if (! isExist) return sendError(res, "This message is not existed.")
            await Message.findByIdAndUpdate(id, {status})
            return sendSuccess(res, "Update message successfully",  {status})            
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }             
    }
)

/**
 * @route DELETE /api/admin/message/:id
 * @description delete a existing message
 * @access private
 */
contactMsgAdminRoute.delete('/:id',
    async (req, res) => {
        try {
            const {id} = req.params;    
            const isExist = await Message.exists({_id: id})
            if (!isExist) return sendError(res, "Message does not exist.")            
            await Message.findByIdAndRemove(id)
            return sendSuccess(res, "Delete message successfully.") 
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
)

export default contactMsgAdminRoute