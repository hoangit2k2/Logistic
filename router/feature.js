import express from "express";
import { sendError, sendServerError, sendSuccess } from "../helper/client.js";
import DeliveryService from "../model/DeliveryService.js";
import Feature from "../model/Feature.js";

const featureRoute = express.Router();

/**
 * @route GET /api/feature/:id
 * @description get a single feature information
 * @access public
 */

featureRoute.get("/:id", async (req, res) => {
  try {
    const { id } = req.params
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return sendError(res, "Feature does not exist.")

    const feature = await Feature.findById({ _id: id });
    if (!feature) return sendError(res, "Feature does not exist.");

    if (feature)
      return sendSuccess(res, "Get feature information successfully.", feature);
    return sendError(res, "Feature information is not found.");
  } catch (error) {
    return sendServerError(res)
  }
});

/**
 * @route GET /api/feature/service/:serviceId
 * @description get feature information for a given service id
 * @access public
 */

featureRoute.get("/service/:serviceId", async (req, res) => {
  try {
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 0
    const page = req.query.page ? parseInt(req.query.page) : 0
    const { serviceId } = req.params
    if (!serviceId.match(/^[0-9a-fA-F]{24}$/)) return sendError(res, "Service does not exist.")

    const service = await DeliveryService.findById({ _id: serviceId })
    if (!service) return sendError(res, "Service does not exist.")

    if (service.features.length > 0) {
      const ids = [];
      for (let i = 0; i < service.features.length; i++) {
        if (service.features.length) {
          ids.push(service.features[i])
        }
      }
      const feature = await Feature.find({ _id: ids })
        .limit(pageSize)
        .skip(pageSize * page)
      var length = await Feature.find({ _id: ids }).count()
      return sendSuccess(res, "Get feature information successfully.", {
        length,
        feature,
      })
    }
    return sendError(res, "Feature information is not found.")
  } catch (error) {
    return sendServerError(res)
  }
});

/**
 * @route GET /api/feature
 * @description get feature information
 * @access public
 */

featureRoute.get("/", async (req, res) => {
  try {
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 0
    const page = req.query.page ? parseInt(req.query.page) : 0
    const { keyword, sortBy, name, detail } = req.query
    var query = {}
    var keywordCondition = keyword
      ? {
          $or: [
            { name: { $regex: keyword, $options: "i" } },
            { detail: { $regex: keyword, $options: "i" } }
          ],
        }
      : {};
    if (name) {
      query.name = name
    }
    if (detail) {
      query.detail = detail
    }
    const feature = await Feature.find({ $and: [query, keywordCondition] })
      .limit(pageSize)
      .skip(pageSize * page)
      .sort(`${sortBy}`)
    var length = await Feature.find({ $and: [query, keywordCondition] }).count()
    if (feature)
      return sendSuccess(res, "Get feature information successfully.", {
        length,
        feature
      })
    return sendError(res, "Feature information is not found.")
  } catch (error) {
    return sendServerError(res)
  }
});

export default featureRoute
