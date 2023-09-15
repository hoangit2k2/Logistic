import express from "express"
import Customer from "../model/Customer.js"
import { sendError, sendServerError, sendSuccess } from "../helper/client.js"
import {CUSTOMER} from "../constant.js"


const customerRoute = express.Router();
/**
 * @route GET /api/customer/
 * @description get all customers, get a customer by id, sort by name and search by keyword
 * @access public
 */
customerRoute.get('/', async (req, res) => {
    const id = req.query.id ? req.query.id : null;
    const keyword = req.query.keyword ? req.query.keyword : null;
    const sort = req.query.sort || 1;
    const filter = req.query.filter
    let query = {};
    if (id) {
        query = {_id: id}
    }
    else if (keyword) {
        query = { $or: [{
            name: {$regex: keyword, $options: '$i'}
        },{
            address: {$regex: keyword, $options:'$i'}
        },{
            description: {$regex: keyword, $options:'$i'}
        },{
            customer_type: {$regex: keyword, $options:'$i'}
        },{
            companyTaxcode_business: {$regex: keyword, $options:'$i'}
        }]}
    } else if (filter) {
        query = { customer_type: filter}
    }
    try {
        const result = await Customer.find(query).sort({name: sort})
        if (result) return sendSuccess(res, "Get customers successfully.", result)
        return sendError(res, "No information found.")
    }
    catch (err) {
        sendServerError(res);
    }
})

export default customerRoute