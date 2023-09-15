import express from "express"
import { sendError, sendServerError, sendSuccess } from "../../helper/client.js"
import ProhibitedProduct from "../../model/ProhibitedProduct.js"
import { handleFilePath, uploadResources } from '../../constant.js'
import { createImageDir, createLogoDir, createUploadDir } from "../../middleware/index.js"
import {addProhibitedProductValidate} from "../../validation/prohibitedProduct.js"

const prohibitedProductAdminRoute = express.Router()

/**
 * @route POST /api/admin/prohibited-product/create
 * @description create new prohibited product
 * @access private
 */
 prohibitedProductAdminRoute.post('/create', createImageDir,
    uploadResources.single('image'),   
    async (req, res) => {    

        try {      
            const error = addProhibitedProductValidate(req.body)
            if (error) return sendError(res, error)      
            const images = handleFilePath(req.file) 
            const {name, detail} = req.body;
            const isExist = await ProhibitedProduct.exists({name})
            if (isExist) {
                return sendError(res, "Name is already existed.")
            }              
            await ProhibitedProduct.create({name: name, images: images, detail: detail})
            return sendSuccess(res, 'Create prohibied product successfully.', {name, images, detail})
            
        } catch (error) {
            console.log(error)
            if (req.image) unlinkSync(req.image.path)
            return sendServerError(res)
        }
 })


/**
 * @route PUT /api/admin/prohibited-product/:id
 * @description update infomation of a existing prohibited product
 * @access private
 */
 prohibitedProductAdminRoute.put('/:id',createImageDir,
    uploadResources.single('image'),
    async (req, res) => {
        const {id} = req.params;
        const image = handleFilePath(req.file) 
        const {name, detail} = req.body;
        try {
            const isExist = await ProhibitedProduct.findById(id);
            if (isExist)
            {
                const isExistName = await ProhibitedProduct.exists({name})
                if (isExistName) 
                    return sendError(res, "Name is existed.")
                
                await ProhibitedProduct.findByIdAndUpdate(id, {name: name, images:image, detail: detail})
                return sendSuccess(res, "Update prohibited product successfully.", {name: name, image:image, detail: detail})
            }        
            return sendError(res, "Prohibited product not exists.")

        } catch (error) {
            console.log(error)
            if (req.image) unlinkSync(req.image.path)
            return sendServerError(res, error)
        }
    }
)

/**
 * @route DELETE /api/admin/prohibited-product/:id
 * @description delete a existing prohibited product
 * @access private
 */
 prohibitedProductAdminRoute.delete('/:id',
    async (req, res) => {
        const {id} = req.params;    
        try {
            const isExist = await ProhibitedProduct.exists({_id: id})
            if (!isExist) 
                return sendError(res, "Prohibited product not exists.")
            
            const data = await ProhibitedProduct.findByIdAndRemove(id)
            return sendSuccess(res, "Delete prohibited product successfully.", data)
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    })

export default prohibitedProductAdminRoute