import express from "express";
import { sendError, sendServerError, sendSuccess } from "../helper/client.js";
import Department from "../model/Department.js";

const departmentRoute = express.Router();

/**
 * @route GET /api/department/:id
 * @description get a single department information
 * @access public
 */

departmentRoute.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findById({ _id: id });
    if (!department) return sendError(res, "Department does not exist.");

    if (department)
      return sendSuccess(
        res,
        "Get department information successfully.",
        department
      );
    return sendError(res, "Department information is not found.");
  } catch (error) {
    return sendServerError(res);
  }
});

/**
 * @route GET /api/department
 * @description get department information
 * @access public
 */

departmentRoute.get("/", async (req, res) => {
  try {
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 0;
    const page = req.query.page ? parseInt(req.query.page) : 0;
    const { keyword, sortBy } = req.query;
    var keywordCondition = keyword
      ? {
          $or: [
            { name: { $regex: keyword, $options: "i" } },
            { description: { $regex: keyword, $options: "i" } },
            { location: { $regex: keyword, $options: "i" } },
          ],
        }
      : {};
    const department = await Department.find(keywordCondition)
      .limit(pageSize)
      .skip(pageSize * page)
      .sort(`${sortBy}`);
    var length = await Department.find(keywordCondition).count();
    if (department)
      return sendSuccess(res, "Get department information successfully.", {
        length,
        department,
      });
    return sendError(res, "Department information is not found.");
  } catch (error) {
    return sendServerError(res);
  }
});

export default departmentRoute;
