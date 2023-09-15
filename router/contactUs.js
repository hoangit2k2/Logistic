import express from "express"
import { sendError, sendServerError, sendSuccess } from "../helper/client.js"
import Contact from "../model/Contact.js"

const contactUsRoute = express.Router()

/**
 * @route GET /api/contactus
 * @description get contact info
 * @access public
 */
contactUsRoute.get('',
    async (req, res) => {
        try {
            const contact = await Contact.findOne({})
            if (contact)
                return sendSuccess(res, 'get contact information successfully.', contact)
            return sendError(res, 'contact information is not found.')
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    })


export default contactUsRoute