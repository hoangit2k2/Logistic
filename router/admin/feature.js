import express from "express"
import { unlinkSync } from "fs"
import { handleFilePath, uploadResources } from "../../constant.js"
import { sendError, sendServerError, sendSuccess } from "../../helper/client.js"
import { createLogoDir } from "../../middleware/index.js"
import Feature from "../../model/Feature.js"
import { createFeatureValidate } from "../../validation/feature.js"
import DeliveryService from "../../model/DeliveryService.js"

const featureAdminRoute = express.Router();

/**
 * @route POST /api/admin/feature/:serviceId
 * @description create new delivery feature
 * @access private
 */
featureAdminRoute.post("/:serviceId", createLogoDir, uploadResources.single("logo"),
  async (req, res) => {
    const errors = createFeatureValidate(req.body)
    if (errors) return sendError(res, errors)
    try {
      const { name, detail } = req.body
      const file = handleFilePath(req.file)
      const serviceId = req.params.serviceId

      if (!serviceId.match(/^[0-9a-fA-F]{24}$/)) return sendError(res, "Create new feature fail.")

      const isExist = await Feature.exists({ name })
      if (isExist) {
        return sendError(res, "Name already exists.")
      }
      
      const service = await DeliveryService.exists({ _id: serviceId })
      if (service) {
        const feature = await Feature.create({
          name: name,
          logo: file,
          detail: detail
        })
        await DeliveryService.updateOne(
          {
            _id: serviceId
          },
          {
            $push: { features: feature }
          }
        )
        return sendSuccess(res, "Create new feature successfully.")
      }
      return sendError(res, "Create new feature fail.")
    } catch (error) {
      if (req.files) req.files.map((file) => unlinkSync(file.path))
      return sendServerError(res)
    }
  }
);

/**
 * @route PUT /api/admin/feature/:id
 * @description update details of an existing feature
 * @access private
 */
featureAdminRoute.put("/:id", createLogoDir, uploadResources.single("logo"),
  async (req, res) => {
    const { id } = req.params
    const { name, detail } = req.body
    const logo = handleFilePath(req.file)
    try {
      if (!id.match(/^[0-9a-fA-F]{24}$/)) return sendError(res, "Feature does not exist.")
      const feature = await Feature.findById(id)
      if (feature) {
        await Feature.findByIdAndUpdate(id, {
          name: name,
          detail: detail,
          logo: logo
        })
        return sendSuccess(res, "Update feature successfully.", {
          name: name,
          detail: detail,
          logo: logo
        })
      }
      return sendError(res, "Feature does not exist.")
    } catch (error) {
      if (req.files) req.files.map((file) => unlinkSync(file.path))
      return sendServerError(res)
    }
  }
);

/**
 * @route DELETE /api/admin/feature/:id
 * @description delete an existing feature
 * @access private
 */
featureAdminRoute.delete("/:id", async (req, res) => {
  const { id } = req.params
  try {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return sendError(res, "Feature does not exist.")
    const isExist = await Feature.exists({ _id: id })
    if (!isExist) return sendError(res, "Feature does not exist.")
    await DeliveryService.findOneAndUpdate({ features: id }, { $pull: { features: id } })
    const feature = await Feature.findByIdAndRemove(id)
    return sendSuccess(res, "Delete feature successfully.", feature)
  } catch (error) {
    return sendServerError(res)
  }
});

export default featureAdminRoute
