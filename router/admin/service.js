import express from "express";
import { unlinkSync } from "fs";
import { handleFilePath, uploadResources } from "../../constant.js";
import {
  sendError,
  sendServerError,
  sendSuccess,
} from "../../helper/client.js";
import { createAssetsDir, createLogoDir } from "../../middleware/index.js";
import DeliveryService from "../../model/DeliveryService.js";
import { createServiceValidate } from "../../validation/service.js";

const serviceAdminRoute = express.Router();

/**
 * @route POST /api/admin/service/
 * @description create new delivery service
 * @access private
 */
serviceAdminRoute.post("/", async (req, res) => {
  const errors = createServiceValidate(req.body);
  if (errors) return sendError(res, errors);
  let { name, sub_detail, target, tip } = req.body;

  try {
    const isExist = await DeliveryService.exists({ name });
    if (isExist) {
      return sendError(res, "This service is already existed.");
    }
    const service = await DeliveryService.create({
      name,
      sub_detail,
      target,
      tip,
    });
    return sendSuccess(res, "Create new service successfully.", service);
  } catch (error) {
    return sendServerError(res);
  }
});

/**
 * @route POST /api/admin/service/banner/serviceId
 * @description create/update service banner
 * @access private
 */
serviceAdminRoute.post(
  "/banner/:serviceId",
  createAssetsDir,
  uploadResources.single("banner"),
  async (req, res) => {
    const file = handleFilePath(req.file);
    const id = req.params.serviceId;
    try {
      const isExist = await DeliveryService.exists({ id });
      if (isExist) {
        await DeliveryService.findOneAndUpdate({ _id: id }, { banner: file });
      } else await DeliveryService.create({ banner: file });
      return sendSuccess(res, "Upload banner successfully.");
    } catch (error) {
      if (req.file) unlinkSync(req.file.path);
      return sendServerError(res);
    }
  }
);

/**
 * @route POST /api/admin/service/logo/:servcieId
 * @description create/update service logo
 * @access private
 */
serviceAdminRoute.post(
  "/logo/:serviceId",
  createLogoDir,
  uploadResources.single("logo"),
  async (req, res) => {
    const file = handleFilePath(req.file);
    const id = req.params.serviceId;
    try {
      const isExist = await DeliveryService.exists({ id });
      if (isExist) {
        await DeliveryService.findOneAndUpdate({ _id: id }, { logo: file });
      } else await DeliveryService.create({ logo: file });
      return sendSuccess(res, "Upload logo successfully.");
    } catch (error) {
      if (req.file) unlinkSync(req.file.path);
      return sendServerError(res);
    }
  }
);

/**
 * @route PUT /api/admin/service/:id
 * @description update content of service by serviceId
 * @access private
 */
serviceAdminRoute.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const isExist = await DeliveryService.exists({ _id: id });
    if (!isExist) return sendError(res, "Service does not exist.");

    const { name, sub_detail, target, tip } = req.body;

    await DeliveryService.findByIdAndUpdate(id, {
      name: name,
      sub_detail: sub_detail,
      target: target,
      tip: tip,
    })
      .then(() => {
        return sendSuccess(res, "Update service successfully.", {
          name: name,
          sub_detail: sub_detail,
          target: target,
          tip: tip,
        });
      })
      .catch((err) => {
        return sendError(res, err);
      });
  } catch (error) {
    return sendServerError(res);
  }
});

/**
 * @route DELETE /api/admin/service/:id
 * @description delete a existing service
 * @access private
 */
serviceAdminRoute.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id.match(/^[0-9a-fA-F]{24}$/))
    return sendError(res, "Service does not exist.");
  try {
    const isExist = await DeliveryService.exists({ _id: id });
    if (!isExist) return sendError(res, "Service does not exist.");

    const service = await DeliveryService.findByIdAndRemove(id)
    return sendSuccess(res, "Delete service successfully.", service);
  } catch (error) {
    return sendServerError(res);
  }
});

export default serviceAdminRoute;
