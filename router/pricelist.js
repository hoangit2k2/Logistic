import express from "express";
import { sendError, sendServerError, sendSuccess } from "../helper/client.js";
import DeliveryService from "../model/DeliveryService.js";

const priceListRoute = express.Router();

/**
 * @route GET /api/pricelist
 * @description get pricelist information
 * @access public
 */
priceListRoute.get("/", async (req, res) => {
  try {
    const { province } = req.query;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 0;
    const page = req.query.page ? parseInt(req.query.page) : 0;
    const isExist = await DeliveryService.find(
      { "price_files.province": province },
      { price_files: true }
    )
      .limit(pageSize)
      .skip(pageSize * page);
    const files = [];
    for (let j = 0; j < isExist.length; j++) {
      for (let i = 0; i < isExist[j].price_files.length; i++) {
        if (isExist[j].price_files[i].province === province) {
          files.push(isExist[j].price_files[i]);
        }
      }
    }
    var length = files.length;
    if (length) {
      return sendSuccess(res, "Get pricelist information successfully.", {
        length,
        files,
      });
    }
    return sendError(res, "Price list information is not found.");
  } catch (error) {
    return sendServerError(res);
  }
});

export default priceListRoute;
