import express from "express"
import { sendError, sendServerError, sendSuccess } from "../../helper/client.js"
import Commitment from "../../model/Commitment.js"
import {createLogoDir} from "../../middleware/index.js"
import { handleFilePath, uploadResources } from '../../constant.js'
import {createCommitmentValidate} from "../../validation/commitment.js"
import { unlinkSync } from 'fs'

const commitmentAdminRoute = express.Router()

/**
 * @route POST /api/admin/commitment
 * @description create a new commitment
 * @access private
 */
commitmentAdminRoute.post('/', 
    createLogoDir,
    uploadResources.single('logo'),   
    async (req, res) => {    
        const error = createCommitmentValidate(req.body)
        if (error) return sendError(res, error)      
        try {            
            const logo = handleFilePath(req.file) 
            const {heading, detail} = req.body;
            const isExist = await Commitment.exists({heading})
            if (isExist) {
                return sendError(res, "Heading is already existed.")
            }              
                          
            await Commitment.create({heading: heading, logo: logo , detail: detail});
            return sendSuccess(res, 'Create commitment successfully.', {heading, logo, detail})
            
        } catch (error) {
            console.log(error)
            if (req.logo) unlinkSync(req.logo.path)
            return sendServerError(res)
        }
    }
)


/**
 * @route PUT /api/admin/commitment/:id
 * @description update detail/logo of a existing commitment
 * @access private
 */
//heading, detail, logo
commitmentAdminRoute.put('/:id',
    createLogoDir,
    uploadResources.single('logo'),
    async (req, res) => {
        const {id} = req.params;
        const logo = handleFilePath(req.file)
        const {heading, detail} = req.body;
        try {
            //Check commitment exists or not
            const commit = await Commitment.findById(id);
            if (commit){
                if (heading && heading !== commit.heading) {
                    const isExistHeading = await Commitment.exists({heading})
                    if (isExistHeading) return sendError(res, "New heading is existed.")
                    // updateInfo.heading = heading               
                }
                await Commitment.findByIdAndUpdate(id, {heading: heading, logo:logo, detail: detail})
                return sendSuccess(res, "Update commitment successfully.", {heading: heading, logo:logo, detail: detail})
            }        
            return sendError(res, "Commitment not exists.")

        } catch (error) {
            console.log(error)
            if (req.logo) unlinkSync(req.logo.path)
            return sendServerError(res, error)
        }
    }
)

/**
 * @route DELETE /api/admin/commitment/:id
 * @description delete a existing commitment
 * @access private
 */
commitmentAdminRoute.delete('/:id',
    async (req, res) => {
        const {id} = req.params;    
        try {
            const isExist = await Commitment.exists({_id: id})
            if (!isExist) return sendError(res, "Commitment not exists.")
            
            const commit = await Commitment.findByIdAndRemove(id)
            if (commit) {
                return sendSuccess(res, "Delete commitment successfully.", commit)
            }
            return sendError(res, err)
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
)



export default commitmentAdminRoute