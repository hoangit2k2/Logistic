import express from "express"
import Partner from "../model/Partner.js"
import { sendError, sendServerError, sendSuccess } from "../helper/client.js"

const partnerRoute = express.Router()

/**
 * @route GET /api/partner/
 * @description get all logo partner or limit
 * @access public
 */
partnerRoute.get('/',
    async(req, res) => {
        try {
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 0
            const page = req.query.page ? parseInt(req.query.page) : 0
            const {keyword, sortBy, status} = req.query
            var keywordCondition = keyword ? { $or:[
                { name: { $regex: keyword, $options: 'i'} },                           
            ]} : {} 
            const partners = await Partner.find(                
                keywordCondition              
            ).skip(page*pageSize).limit(pageSize).sort(`${sortBy}`)
            const length = await Partner.find( keywordCondition ).count()
            if (partners) return sendSuccess(res, "Get partner successful.", {length,partners})
            return sendError(res, "Not information found.")
        } catch(error){
            console.log(error)
            return sendServerError(res)
        }
    }
)

/**
 * @route GET /api/partner/:id
 * @description get logo partner by id
 * @access public
 */
partnerRoute.get('/:id',
    async(req, res) => {
        try {
            const {id} = req.params
            const partner = await Partner.findById(id)
            if (partner) return sendSuccess(res, "get partner successful.", partner)
            return sendError(res, "not information found.")
        } catch(error){
            console.log(error)
            return sendServerError(res)
        }
    }
)

export default partnerRoute