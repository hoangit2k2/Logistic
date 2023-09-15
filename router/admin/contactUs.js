import express from 'express'
import { sendError, sendServerError, sendSuccess } from '../../helper/client.js'
import Contact from '../../model/Contact.js'
import { createOrUpdateContactUsValidate } from '../../validation/contactUs.js'

const contactUsAdminRoute = express.Router()

/**
 * @route POST /api/admin/contactus
 * @description create/update contactus info
 * @access private
 */
contactUsAdminRoute.post('/',
    async (req, res) => {
        const error = createOrUpdateContactUsValidate(req.body)
        if (error)
            return sendError(res, error)

        const { address, phone, email, facebook, instagram, tiktok, youtube, hr_mailbox } = req.body
        try {
            const isExist = await Contact.exists({})
            if (isExist) {
                await Contact.findOneAndUpdate({}, { address, phone, email, facebook, instagram, tiktok, youtube, hr_mailbox })
            }
            else await Contact.create({ address, phone, email, facebook, instagram, tiktok, youtube, hr_mailbox })
            return sendSuccess(res, 'set contact-us information successfully.')
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
)

export default contactUsAdminRoute