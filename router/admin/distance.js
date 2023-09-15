import express from "express";
import {
  sendError,
  sendServerError,
  sendSuccess,
} from "../../helper/client.js";
import Distance from "../../model/Distance.js";
import DeliveryService from "../../model/DeliveryService.js";
import { createDistanceValidate } from "../../validation/distance.js";

const distanceAdminRoute = express.Router();

/**
 * @route POST /api/admin/distance/create/:serviceId
 * @description create delivery road for delivery service
 * @access private
 */
distanceAdminRoute.post("/create/:serviceId", async (req, res) => {
  const errors = createDistanceValidate(req.body);
  if (errors) return sendError(res, errors);
  const {serviceId} = req.params;
  const { fromProvince, toProvince, zonecode, dist } = req.body;
  if (!serviceId.match(/^[0-9a-fA-F]{24}$/))
    return sendError(res, "Distance information is not found.")
   try {
    const service = await DeliveryService.findById(req.params.serviceId)
    .populate("distances");
    if (service) {
      const distances = service.distances
      for (let i = 0; i < distances.length; i++) {
        if (service.distances[i].fromProvince === fromProvince && service.distances[i].toProvince === toProvince) {
          return sendError(res, "Distance already exists.");
        }
      }
      const distance = await Distance.create({
        fromProvince,
        toProvince,
        zonecode,
        distance: dist,
      });

      await DeliveryService.findOneAndUpdate(
        { _id: service._id },
        { $push: { distances: distance } }
      );
      return sendSuccess(res, "Create distance successfully.");
    }
    return sendError(res, "Create distance Failed.");
  } catch (error) {
    return sendServerError(res);
  }
});

/**
 * @route PUT /api/admin/distance/:id
 * @description update details of an existing distance
 * @access private
 */
distanceAdminRoute.put("/:id", async (req, res) => {
  const { id } = req.params;
  const errors = createDistanceValidate(req.body);
  if (errors) return sendError(res, errors);
  let { fromProvince, toProvince, zonecode, dist } = req.body;
  if(!id.match(/^[0-9a-fA-F]{24}$/)) return sendError(res, "Distance does not exist.")
  try {
    const distance = await Distance.findById(id);
    if (distance) {
      await Distance.findByIdAndUpdate(id, {
        fromProvince: fromProvince,
        toProvince: toProvince,
        zonecode: zonecode,
        distance: dist,
      });
      return sendSuccess(res, "Update distance successfully.", {
        fromProvince: fromProvince,
        toProvince: toProvince,
        zonecode: zonecode,
        distance: dist,
      });
    }
    return sendError(res, "Distance does not exist.");
  } catch (error) {
    return sendServerError(res);
  }
});

/**
 * @route DELETE /api/admin/distance/:id
 * @description delete an existing distance
 * @access private
 */
distanceAdminRoute.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) return sendError(res, "Distance does not exist.")    
    if (!id.match(/^[0-9a-fA-F]{24}$/))
    return sendError(res, "Distance information is not found.")
    const isExist = await Distance.exists({ _id: id });
    if (!isExist) return sendError(res, "Distance does not exist.");
    await DeliveryService.findOneAndUpdate({distances: id}, { $pull: { distances: id } });
    const distance = await Distance.findByIdAndRemove(id);
    return sendSuccess(res, "Delete distance successfully.", distance);
  } catch (error) {
    return sendServerError(res);
  }
});

export default distanceAdminRoute;
