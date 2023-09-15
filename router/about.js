import express from "express"
import { sendError, sendServerError, sendSuccess } from "../helper/client.js"
import About from "../model/About.js"

const aboutRoute = express.Router()

/**
 * @route GET /api/about
 * @description get about information
 * @access public
 */
aboutRoute.get('/',
    async (req, res) => {
        try {
            const about = await About.findOne({})
            if (about)
                return sendSuccess(res, 'get about information successfully.', about)
            return sendError(res, 'about information is not found.')
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    })


export default aboutRoute

