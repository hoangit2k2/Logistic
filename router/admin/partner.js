import express from "express"
import Partner from "../../model/Partner.js"
import {createLogoDir} from "../../middleware/index.js"
import {handleFilePath, uploadResources } from "../../constant.js"
import { sendError, sendServerError, sendSuccess } from "../../helper/client.js"
import { unlinkSync } from "fs"

const partnerAdminRoute = express.Router()

/**
 * @route POST /api/admin/partner
 * @description upload a logo of partner 
 * @access private
 */
partnerAdminRoute.post('/',
    createLogoDir,
    uploadResources.single('logo'),
    async(req, res) => {
        try{
            const {name} = req.body
            const logo = handleFilePath(req.file)
            if (!name) return sendError(res, "Name is required")
            if (!logo) return sendError(res, "Logo is required")
            const isExist = await Partner.exists({name})
            if (isExist) {
                return sendError(res, "This partner name is already existed.")
            }
            await Partner.create({name: name, logo: logo})
            return sendSuccess(res, "Create partner successfully", {name, logo})
        } catch(err) {
            if (req.logo) unlinkSync(req.logo.path)
            return sendServerError(res)
        }
    }
)

/**
 * @route PUT /api/admin/partner/:id
 * @description update information of a partner
 * @access private
 */
partnerAdminRoute.put('/:id',
    createLogoDir,
    uploadResources.single('logo'),
    async (req, res) => {
        try{
            const {id} = req.params
            const logo = handleFilePath(req.file)
            const {name} = req.body            
            if (!name) return sendError(res, "Name is required")
            if (!logo) return sendError(res, "Logo is required")
            const isExist = await Partner.exists({name: name})
            if (! isExist) return sendError(res, "This partner name is not existed.")
            await Partner.findByIdAndUpdate(id, {name: name, logo: logo})
            return sendSuccess(res, "Update partner successfully", {name, logo})
            
        } catch (error) {
            console.log(error)
            if(req.logo) unlinkSync(req.logo.path)
            return sendServerError(res)
        }             
    }
)

/**
 * @route DELETE /api/admin/partner/:id
 * @description delete a existing partner
 * @access private
 */
partnerAdminRoute.delete('/:id',
    async (req, res) => {
        const {id} = req.params;    
        try {
            const isExist = await Partner.exists({_id: id});
            if (!isExist) return sendError(res, "Partner not exist");
            
            const data = await Partner.findByIdAndRemove(id)
            return sendSuccess(res, "Delete partner successfully.", data)
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
)

export default partnerAdminRoute