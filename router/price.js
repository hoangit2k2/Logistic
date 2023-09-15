import express from "express";
import { sendError, sendServerError, sendSuccess } from "../helper/client.js";
import Price from "../model/Price.js";
import DeliveryService from "../model/DeliveryService.js";

const priceRoute = express.Router();

/**
 * @route GET /api/price/:id
 * @description get price by id
 * @access public
 */
priceRoute.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/))
    return sendError(res, "Price information is not found.")  
    const price = await Price.findById(id);
    if (price) return sendSuccess(res, "Get price information successfully.", price);
    return sendError(res, "Price information not found.");
  } catch (error) {
    return sendServerError(res);
  }
});

/**
 * @route GET /api/price/service/:serviceId
 * @description get price information for a given service id
 * @access public
 */

priceRoute.get("/service/:serviceId", async (req, res) => {
  try {
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 0;
    const page = req.query.page ? parseInt(req.query.page) : 0;
    const { serviceId } = req.params;
    if (!serviceId.match(/^[0-9a-fA-F]{24}$/))
    return sendError(res, "Price information is not found.")  
    const service = await DeliveryService.findById({ _id: serviceId });
    if (!service) return sendError(res, "Service does not exist.");
    if (service) {
      const id = service.price;
      const price = await Price.find({ _id: id })
        .limit(pageSize)
        .skip(pageSize * page);
      var length = await Price.find({ _id: id }).count();
      return sendSuccess(res, "Get price information successfully.", {
        length,
        price,
      });
    }
    return sendError(res, "Price information is not found.");
  } catch (error) {
    return sendServerError(res);
  }
});

export default priceRoute;
