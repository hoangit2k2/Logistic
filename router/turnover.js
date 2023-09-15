import express from "express";
import { sendError, sendServerError, sendSuccess } from "../helper/client.js";
import Turnover from "../model/Turnover.js";
import { verifyToken, verifyCustomer } from "../middleware/index.js";
import { turnoverValidate } from "../validation/turnover.js";
import Order from "../model/Order.js";
import Product from "../model/Product.js";
import DeliveryService from "../model/DeliveryService.js";

const turnoverRoute = express.Router();

/**
 * @route POST /api/turnover/
 * @description register new turnover for user
 * @access private
 */
 turnoverRoute.post("/", verifyToken, verifyCustomer, async (req, res) => {
  const errors = turnoverValidate(req.body);
  if (errors) return sendError(res, errors);

  let { total, payment_method, type_of_turnover, message } = req.body;

  try {
    const turnover = await Turnover.create({
      total,
      payment_method,
      type_of_turnover,
      message,
    });
  } catch (error) {
    console.log(error);
    return sendServerError(res);
  }
  return sendSuccess(res, "turnover registered successfully.");
});

/**
 * @route PUT /api/turnover/:id
 * @description update details of an existing turnover
 * @access private
 */
turnoverRoute.put("/:id", verifyToken, verifyCustomer, async (req, res) => {
  const { id } = req.params;
  const errors = turnoverValidate(req.body);
  if (errors) return sendError(res, errors);
  let { total, payment_method, type_of_turnover, message } = req.body;
  try {
    const turnover = await Turnover.findById(id);
    if (turnover) {
      await Turnover.findByIdAndUpdate(id, {
        total,
        payment_method,
        type_of_turnover,
        message,
      });
      return sendSuccess(res, "Update turnover successfully.", {
        total: total,
        payment_method: payment_method,
        type_of_turnover: type_of_turnover,
        message: message,
      });
    }
    return sendError(res, "Turnover does not exist.");
  } catch (error) {
    console.log(error);
    return sendError(res);
  }
});
/**
 * @route GET /api/turnover/
 * @description get turnover customer
 * @access private
 */
turnoverRoute.get("/", verifyToken, verifyCustomer, async(req, res) => {
  try {

    const customerid = req.user.role._id
    const order = await Order.find({customer: customerid})
    let services = []
    let orderids = []
    for(let i = 0; i < order.length; i++){
      const service = order[i]
      const orderid = order[i]._id 
        services.push(service)
        orderids.push(orderid)
    }  
    const products = await Product.find({order: orderids})
    return sendSuccess(res, "Get Turnover successfully", 
    {
      "ListOrder": order,
      "List Service": services,
      "List Product": products
    }
    )
        
  } catch (error) {
    console.log(error)
    sendServerError(res)
  }
})
export default turnoverRoute;
