import express from "express"
import { sendServerError } from "../helper/client.js"
import path from "path"
const __dirname = path.resolve(path.dirname(''))

const publicRoute = express.Router()

/**
 * @route GET /api/public/uploads/:dirName/:fileName
 * @description get an upload file
 * @access public
 */
publicRoute.get('/uploads/:dirName/:fileName',
    async (req, res) => {
        const { dirName, fileName } = req.params
        try {
            res.sendFile(path.join(__dirname, `/public/uploads/${dirName}/${fileName}`))
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    })

/**
 * @route GET /api/public/:dirName/:fileName
 * @description get a public logo and banner
 * @access public
 */
publicRoute.get('/:dirName/:fileName',
    async (req, res) => {
        const { dirName, fileName } = req.params
        try {
            res.sendFile(path.join(__dirname, `/public/${dirName}/${fileName}`))
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    })


export default publicRoute