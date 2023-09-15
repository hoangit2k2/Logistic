import express from "express";
import { RETURN_ZONE } from "../../constant.js";
import {
  sendError,
  sendServerError,
  sendSuccess,
} from "../../helper/client.js";
import Price from "../../model/Price.js";
import DeliveryService from "../../model/DeliveryService.js";
import { createPriceValidate } from "../../validation/price.js";

const priceAdminRoute = express.Router();

/**
 * @route POST /api/admin/price/create/:ServiceId
 * @description create price table for delivery price
 * @access private
 */
priceAdminRoute.post("/create/:serviceId", async (req, res) => {
  const errors = createPriceValidate(req.body);
  if (errors) return sendError(res, errors);

  const validateTypesOfData = Object.values(req.body).every((value) => {
    return (
      Array.isArray(value) &&
      value.every((v) => {
        return (
          v.hasOwnProperty("next") &&
          v.hasOwnProperty("sidestep") &&
          v.hasOwnProperty("prices") &&
          Array.isArray(v.prices) &&
          v.prices.length === Object.keys(RETURN_ZONE).length
        );
      })
    );
  });
  if (!validateTypesOfData)
    return sendError(res, "Request's body is incorrect.");

  const { kg, ton, m3 } = req.body;
  const serviceId = req.params.serviceId;
  if (!serviceId.match(/^[0-9a-fA-F]{24}$/))
    return sendError(res, "Service information is not found.")
  try {
    const service = await DeliveryService.exists({ _id: serviceId });
    if (!service) return sendError(res, "Request's body is incorrect")
    if (service) {
      const price = await Price.create({
        uKG: kg,
        uM3: m3,
        uTON: ton,
      });

      await DeliveryService.findOneAndUpdate(
        { _id: service._id },
        { price: price._id }
      );
      return sendSuccess(res, "Create price table successfully.");
    } 
      return sendError(res, "Create price table failed.");
   
  } catch (error) {

    return sendServerError(res);
  }
});

/**
 * @route PUT /api/admin/price/:id
 * @description update details of an existing price
 * @access private
 */
priceAdminRoute.put("/:id", async (req, res) => {
  const { id } = req.params;
  const errors = createPriceValidate(req.body);
  if (errors) return sendError(res, errors);
  let { kg, ton, m3 } = req.body;
  if (!id.match(/^[0-9a-fA-F]{24}$/))
  return sendError(res, "Price information is not found.")
  try {
    const price = await Price.findById(id);
    if (price) {
      await Price.findByIdAndUpdate(id, { 
        uKG: kg, 
        uTON: ton, 
        uM3: m3 });
      return sendSuccess(res, "Update price successfully.", {
        uKG: kg, 
        uTON: ton, 
        uM3: m3,
      });
    }
    return sendError(res, "Price does not exist.");
  } catch (error) {
    console.log(error);
    return sendServerError(res);
  }
});

/**
 * @route DELETE /api/admin/price/:id
 * @description delete an existing price
 * @access private
 */
priceAdminRoute.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id.match(/^[0-9a-fA-F]{24}$/))
    return sendError(res, "Price does not exist.")
  try {
    const isExist = await Price.exists({ _id: id });
    if (!isExist) return sendError(res, "Price does not exist.");
    await DeliveryService.findOneAndUpdate({ price: id }, { $unset: { price: id } });
    const price = await Price.findByIdAndRemove(id)
    return sendSuccess(res, "Delete price successfully.", price);
  } catch (error) {
    return sendServerError(res);
  }
});

export default priceAdminRoute;
