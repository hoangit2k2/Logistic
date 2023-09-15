import express from "express"
import { sendError, sendServerError,sendAutoMail, sendSuccess } from "../helper/client.js"
import { createMessageValidate} from "../validation/message.js"
import Message from "../model/Message.js"

const contactMsgRoute = express.Router()

/**
 * @route POST /api/message
 * @description Anyone can send message
 * @access public
 */
contactMsgRoute.post('/',
    async(req, res) => {
        const err = createMessageValidate(req.body)
        if(err) return sendError(res, err)
        try{
            const {name, email, phone, message} = req.body
            const optionsToCS = {
                from: process.env.MAIL_HOST,
                to: process.env.MAIL_HOST,
                subject: "Tin nhắn liên hệ từ Logistics-Webapp",
                html: `<p>Họ và tên: <b>${name}</b></p>
                <p>Email: ${email}</p>
                <p>Số điện thoại: ${phone}</p>
                <p>Nội dung: ${message}</p>`
            }
            const data = await sendAutoMail(optionsToCS)
            if(data) {
                await Message.create({name, email, phone, message})
                return sendSuccess(res, "Send message successfully.")
            }
            return sendError(res, "Create message failed.")
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
)

export default contactMsgRoute