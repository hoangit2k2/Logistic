import express from "express";
import {
  sendError,
  sendServerError,
  sendSuccess,
} from "../../helper/client.js";
import Department from "../../model/Department.js";
import { departmentRegisterValidate } from "../../validation/department.js";
import Staff from "../../model/Staff.js";

const departmentAdminRoute = express.Router();

/**
 * @route POST /api/admin/department/
 * @description register new department
 * @access private
 */
departmentAdminRoute.post("/", async (req, res) => {
  const errors = departmentRegisterValidate(req.body);
  if (errors) return sendError(res, errors);
  let { name, description, location, director, scale } = req.body;
  try {
    const isExist = await Staff.exists({ _id: director });
    if (!isExist) return sendError(res, "The director staff does not exist.");
    await Department.create({
      name,
      description,
      location,
      director,
      scale,
    });
  } catch (error) {
    return sendServerError(res);
  }
  return sendSuccess(res, "Department registered successfully.");
});

/**
 * @route PUT /api/admin/department/:id
 * @description update details of an existing department
 * @access private
 */
departmentAdminRoute.put("/:id", async (req, res) => {
  const { id } = req.params;
  let { name, description, location, director, scale } = req.body;
  try {
    const department = await Department.findById(id);
    if (department) {
      const isExist = await Staff.exists({ _id: director });
      if (!isExist) return sendError(res, "The director staff does not exist.");
      await Department.findByIdAndUpdate(id, {
        name: name,
        description: description,
        location: location,
        director: director,
        scale: scale,
      });
      return sendSuccess(res, "Update department successfully.", {
        name: name,
        description: description,
        location: location,
        director: director,
        scale: scale,
      });
    }
    return sendError(res, "Department does not exist.");
  } catch (error) {
    return sendServerError(res);
  }
});

/**
 * @route DELETE /api/admin/department/:id
 * @description delete an existing department
 * @access private
 */
departmentAdminRoute.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const isExist = await Department.exists({ _id: id });
    if (!isExist) return sendError(res, "Department does not exist.");

    const department = await Department.findByIdAndRemove(id)
    return sendSuccess(res, "Delete department successfully.", department);
  } catch (error) {
    return sendServerError(res);
  }
});

export default departmentAdminRoute;
