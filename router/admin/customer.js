import express from "express"
import Customer from "../../model/Customer.js"
import { sendError, sendServerError, sendSuccess } from "../../helper/client.js"
import {CUSTOMER} from "../../constant.js"
import User from "../../model/User.js"
import bodyParser from "body-parser"

const customerAdminRoute = express.Router();

/**
 * @route PUT /api/customer/:id
 * @description Update a customer
 * @access public
 */
customerAdminRoute.put('/:id', async (req, res) => {
    let id = req.params.id;
    const isExist = await Customer.exists({_id: id})
    if (!isExist) {return sendError(res,'Customer does not exist.')}
    const {name, address, description, customer_type, rank_passers, companyTaxcode_business, accepted_business} = req.body;
    // res.send(req.body)
    if (customer_type == '') {return sendError(res,'Invalid customer type.')}
    else if (customer_type && !(customer_type == CUSTOMER.BUSINESS || customer_type == CUSTOMER.PASSERS || customer_type == CUSTOMER.INTERMEDIARY)) {
        return sendError(res,'Invalid customer type.')
    }
    try {
        await Customer.findByIdAndUpdate(id, {name: name, address: address, description: description, customer_type: customer_type, rank_passers: rank_passers, companyTaxcode_business: companyTaxcode_business, accepted_business: accepted_business})
        return sendSuccess(res, 'Customer updated successfully.')
    }
    catch (err) {
        return sendServerError(res);
    }
})
/**
 * @route DELETE /api/customer/:id
 * @description delete a customer
 * @access public
 */
 customerAdminRoute.delete('/:id', async (req, res) => {
    let id = req.params.id;
    const isExist = await Customer.exists({_id: id})
    if (!isExist) {return sendError(res,'Customer does not exist.')}

    try {
        await Customer.findByIdAndRemove(id)
        const userfind = await User.find({role: id})
        await User.findByIdAndRemove(userfind[0]._id)
        .then(() => {
            return sendSuccess(res, "Delete customer user successfully.")
        })
    }
    catch (err) {
        sendServerError(res)
    }
})
export default customerAdminRoute;