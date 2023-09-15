import express, { request } from "express";
import Staff from "../../model/Staff.js";
import User from "../../model/User.js";
import { sendError, sendServerError, sendSuccess } from "../../helper/client.js"
import { STAFF } from "../../constant.js";
const staffAdminRoute = express.Router();

/**
 * @route GET /api/admin/staff/
 * @description get all staff, get a staff by id, sort by name and search by keyword, filter by staff type
 * @access private
 */
 staffAdminRoute.get('/', async (req, res) => {
    const id = req.query.id ? req.query.id : null;
    const keyword = req.query.keyword ? req.query.keyword : null;
    const sort = req.query.sort || 1;
    const filter = req.query.filter;
    let query = {};
    if (id) {
        query = {_id: id}
    }
    else if (keyword) {
        query = { $or: [{
            name: {$regex: keyword, $options: '$i'}
        },{
            staff_type: {$regex: keyword, $options:'$i'}
        }]}
    } else if (filter) {
        query = {staff_type: filter}
    }
    try {
        const result = await Staff.find(query).sort({ name : sort})
        return sendSuccess(res, "Get staffs information successfully",result);
    }
    catch (err) {sendServerError(res)}
        
})
/**
 * @route  DELETE /api/admin/staff/:id
 * @description Delete staff by id
 * @access private
 */
staffAdminRoute.delete('/:id', async (req, res) => {
    let id = req.params.id;
    const isExist = await Staff.exists({_id: id})
    if (!isExist) {return sendError(res,'Staff does not exist.')}
    try {
        const staff = await Staff.deleteOne({_id: id})
        const userfind = await User.find({role: id})
        await User.findByIdAndRemove(userfind[0]._id)
        return sendSuccess(res, "Delete staff user successfully.")
    }
    catch (err) {sendServerError(res)};
})
/**
 * @route  PUT /api/admin/staff/:id
 * @description Update the staff by id using request body.
 * @access private
 */
 staffAdminRoute.put('/:id', async (req, res) => {
    let id = req.params.id;
    const {name, staff_type, department, car_fleet} = req.body;
    const isExist = await Staff.exists({_id: id})
    if (!isExist) {return sendError(res,'Staff does not exist.')}
    if (staff_type) {
        if (((staff_type != STAFF.ADMIN && staff_type != STAFF.DRIVER && staff_type != STAFF.SHIPPER && staff_type != STAFF.STOREKEEPER && staff_type != STAFF.STAFF))) {
            return sendError(res, "Staff-type not found.")
        }
    } else if (staff_type == '') {
        return sendError(res, "Staff-type not found.")
    }

    try {
        await Staff.findByIdAndUpdate(id, {name: name, staff_type, department: department, car_fleet : car_fleet})
        return sendSuccess(res, "Staff updated successfully.")
    }
    catch (err) {
        sendServerError(res, err.message)
    }
})

/**
 * @route GET /api/admin/staff/department/:id
 * @description Get Staff by Id Department
 * @access private
 */
 staffAdminRoute.get('/department/:id', async (req, res) => {
    try {
        const { id } = req.params
        const staffs = await Staff.find({department: id})
        if (!staffs) return sendError(res, "Departmental does not exist.");
        if(staffs) return sendSuccess(res, "Get departmental staff",staffs)
        return sendError(res, "Information not found")
    } catch (error) {
        return sendError(res, "Departmental does not exist.");
    }
})
export default staffAdminRoute;
