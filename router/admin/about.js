import express from 'express'
import { unlinkSync } from 'fs'
import { handleFilePath, uploadResources } from '../../constant.js'
import { sendError, sendServerError, sendSuccess } from '../../helper/client.js'
import { createAssetsDir, createLogoDir } from '../../middleware/index.js'
import About from '../../model/About.js'

const aboutAdminRoute = express.Router()


/**
 * @route POST /api/admin/about/banners
 * @description create/update aboutus banners
 * @access private
 */
aboutAdminRoute.post('/banners',
    createAssetsDir,
    uploadResources.array('banners'),
    async (req, res) => {
        const files = req.files.map(file => handleFilePath(file))
        try {
            const isExist = await About.exists({})
            if (isExist) {
                await About.findOneAndUpdate({}, { banners: files })
            }
            else await About.create({ banners: files })
            return sendSuccess(res, 'upload banners successfully.')
        } catch (error) {
            if (req.files)
                req.files.map(file => unlinkSync(file.path))
            return sendServerError(res)
        }
    }
)

/**
* @route POST /api/admin/about/logo
* @description create/update aboutus logo
* @access private
*/
aboutAdminRoute.post('/logo',
    createLogoDir,
    uploadResources.single('logo'),
    async (req, res) => {
        const file = handleFilePath(req.file)
        try {
            const isExist = await About.exists({})
            if (isExist) {
                await About.findOneAndUpdate({}, { logo: file })
            }
            else await About.create({ logo: file })
            return sendSuccess(res, 'upload logo successfully.')
        } catch (error) {
            if (req.file) unlinkSync(req.file.path)
            return sendServerError(res)
        }
    }
)

/**
* @route POST /api/admin/about
* @description create/update aboutus info
* @access private
*/
aboutAdminRoute.post('/',
    async (req, res) => {
        const { description, vision, values } = req.body
        try {
            const isExist = await About.exists({})
            if (isExist) {
                await About.findOneAndUpdate({}, { description, vision, values })
            }
            else await About.create({ description, vision, values })
            return sendSuccess(res, 'set about-us information successfully.')
        } catch (error) {
            return sendServerError(res)
        }
    }
)

export default aboutAdminRoute