import express from "express"
import { sendError, sendServerError, sendSuccess } from "../helper/client.js"
import Commitment from "../model/Commitment.js"

const commitmentRoute = express.Router()

/**
 * @route GET /api/commitment
 * @description get all commitments
 * @access public
 */
commitmentRoute.get('/',
    async(req, res) => {
        try {
            const {limit, sortBy, keyword} = req.query
            var keywordCondition = keyword ? { $or:[
                { heading: { $regex: keyword, $options: 'i'} },
                { detail: { $regex: keyword, $options: 'i'} },
            ]} : {}            
            const length = await Commitment.find(keywordCondition).count()
            const commits = await Commitment.find(keywordCondition).limit(limit).sort(`${sortBy}`)
            if (commits) return sendSuccess(res, "Get commitment successfully.", {length, commits})
            return sendError(res, "Not information found.")
        } catch(error){
            console.log(error)
            return sendServerError(res)
        }
    }
)

/**
 * @route GET /api/commitment/:commitmentId
 * @description get a commitment by id
 * @access public
 */
commitmentRoute.get('/:commitmentId', async (req, res) => {
    try {
        const {commitmentId} = req.params;
        const commit = await Commitment.findById(commitmentId)
        if (commit)
            return sendSuccess(res, 'get commitment information successfully.', commit)
        return sendError(res, 'commitment information is not found.')
    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})

export default commitmentRoute