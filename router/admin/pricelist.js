import express from "express";
import { unlinkSync } from "fs";
import {
  handleFilePath,
  upload,
} from "../../constant.js";
import {
  sendError,
  sendServerError,
  sendSuccess,
} from "../../helper/client.js";
import { createUploadDir } from "../../middleware/index.js";
import DeliveryService from "../../model/DeliveryService.js";
import { uploadPricelistValidate } from "../../validation/pricelist.js";

const priceListAdminRoute = express.Router();

/**
 * @route POST /api/admin/pricelist/:serviceId
 * @description upload price files for service
 * @access private
 */
priceListAdminRoute.post(
  "/:serviceId",
  createUploadDir,
  upload.single("file"),
  async (req, res) => {
    const errors = uploadPricelistValidate(req.body);
    if (errors) {
      return sendError(res, errors);
    }
    const file = handleFilePath(req.file);
    const { province } = req.body;
    const serviceId = req.params.serviceId;
    if (!serviceId.match(/^[0-9a-fA-F]{24}$/))
    return sendError(res, "Upload priceList failed.")
    const service = await DeliveryService.exists({_id: serviceId})
    if (!service) return sendError(res, "Upload priceList failed.")
    try {
      const isExist = await DeliveryService.exists({
        _id: serviceId,
      })
      const provinceExist = await DeliveryService.exists({
        _id: serviceId,
        "price_files.province": province
      })
      if (provinceExist) {
        return sendError(res, 'The pricelist\'s province is already used.')  
      }
      if (isExist) {
        await DeliveryService.updateOne(
          {
            _id: isExist._id,
          },
          {
            $push: { price_files: { province, file } },
          }
        );
        return sendSuccess(res, "Upload pricelist file successfully.");
      
      }
      return sendError(res, "Upload price list failed.");
    } catch (error) {
      if (req.file) unlinkSync(req.file.path);
      return sendServerError(res);
    }
  }
);

/**
 * @route PUT /api/admin/pricelist/:serviceId
 * @description update details of an existing pricelist
 * @access private
 */
priceListAdminRoute.put(
  "/:serviceId",
  createUploadDir,
  upload.single("file"),
  async (req, res) => {
    const { serviceId } = req.params;
    const { province } = req.query;
    const file = handleFilePath(req.file);
    if (!serviceId.match(/^[0-9a-fA-F]{24}$/))
    return sendError(res, "Service does not exist.")
    const service = await DeliveryService.exists({_id : serviceId})
    if (!service) return sendError(res, "Service does not exist.");
    try {
      const isExist = await DeliveryService.findById(serviceId);
      if (isExist) {
        await DeliveryService.updateOne(
          { _id: isExist._id },
          {
            $set:  { price_files: { province, file } },
          }
        );
        return sendSuccess(res, "Update pricelist file successfully.",{
          province: province,
          file: file
        });
      }
      return sendError(res, "Service does not exist.");
    } catch (error) {
      return sendServerError(res);
    }
  }
);

/**
 * @route DELETE /api/admin/pricelists/:serviceId
 * @description delete an existing pricelist
 * @access private
 */
priceListAdminRoute.delete("/:serviceId", async (req, res) => {
  const { serviceId } = req.params;
  const { province } = req.query; 
  if (!serviceId.match(/^[0-9a-fA-F]{24}$/))
  return sendError(res, "priceList does not exist.");
  const isExist = await DeliveryService.exists({
    _id: req.params.serviceId,
    "price_files.province": province
  })
    if (!isExist) return sendError(res, "Pricelist does not exist.");
  try {
    await DeliveryService.updateOne(
      { _id: serviceId },
      { $pull: { price_files: { province: province } } }
    );
    return sendSuccess(res, "Delete price list successfully.");
  } catch (error) {
    return sendServerError(res, "Delete price list failed");
  }
});

export default priceListAdminRoute;
