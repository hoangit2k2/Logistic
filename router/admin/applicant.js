import express from "express";
import {
  sendError,
  sendServerError,
  sendSuccess,
} from "../../helper/client.js";
import { updateStatusValidate } from "../../validation/applicant.js";
import Applicant from "../../model/Applicant.js";
import Department from "../../model/Department.js";
import Career from "../../model/Career.js";

const applicantAdminRoute = express.Router();

/**
 * @route GET /api/admin/applicant/:id
 * @description admin get applicant status information
 * @access private
 */
applicantAdminRoute.get("/:id", async (req, res) => {
  const { id } = req.params;   
  if (!id.match(/^[0-9a-fA-F]{24}$/))
    return sendError(res, "Applicant does not exist.")
  try {
    const applicant = await Applicant.findById({ _id: id });
    if (!applicant) return sendError(res, "Applicant does not exist.");
    if (applicant)
      return sendSuccess(
        res,
        "get applicant information successfully.",
        applicant
      );
    return sendError(res, "applicant information is not found.");
  } catch (error) {
    console.log(error);
    return sendServerError(res);
  }
});

/**
 * @route PUT /api/admin/applicant/:id
 * @description update status of an existing applicant
 * @access private
 */
applicantAdminRoute.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const errors = updateStatusValidate(req.body);
  if (errors) return sendError(res, errors);  
  if (!id.match(/^[0-9a-fA-F]{24}$/))
  return sendError(res, "Applicant does not exist.")
  try {
    const applicant = await Applicant.findById(id);
    if (applicant) {
      await Applicant.findByIdAndUpdate(id, { status: status });
      return sendSuccess(res, "Update applicant successfully.", {
        status: status,
      });
    }
    return sendError(res, "Applicant does not exist.");
  } catch (error) {
    return sendServerError(res);
  }
});

/**
 * @route GET /api/admin/applicant
 * @description get applicant information
 * @access private
 */
applicantAdminRoute.get("/", async (req, res) => {
  try {
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 0;
    const page = req.query.page ? parseInt(req.query.page) : 0;
    const { keyword, sortBy, department, type, location, status } = req.query;
    var keywordCondition = keyword
      ? {
          $or: [
            { firstName: { $regex: keyword, $options: "i" } },
            { lastName: { $regex: keyword, $options: "i" } },
            { phoneNumber: { $regex: keyword, $options: "i" } },
            { email: { $regex: keyword, $options: "i" } },
            { source: { $regex: keyword, $options: "i" } },
            { message: { $regex: keyword, $options: "i" } },
            { status: { $regex: keyword, $options: "i" } },
          ],
        }
      : {};
    var query = {};
    var ids = [];
    if (department) {
      var departmentQuery = {};
      departmentQuery.name = department;
      const departments = await Department.find(departmentQuery);
      var idsDep = [];
      const idsMerg = [];
      for (let j = 0; j < departments.length; j++) {
        for (let i = 0; i < departments[j].careers.length; i++) {
          if (departments[j].careers.length) {
            idsDep.push(departments[j].careers[i]);
          }
        }
      }
      const careers = await Career.find({ _id: idsDep });
      const idsComp = [];
      for (let j = 0; j < careers.length; j++) {
        for (let i = 0; i < careers[j].applicants.length; i++) {
          if (careers[j].applicants.length) {
            idsComp.push(careers[j].applicants[i]);
          }
        }
      }
      if (ids.length) {
        for (let i = 0; i < idsComp.length; i++) {
          for (let j = 0; j < ids.length; j++) {
            if (ids[j].toString() == idsComp[i].toString()) {
              idsMerg.push(ids[j]);
            }
          }
        }
        idsComp = idsMerg;
      }
      ids = idsComp;
    }

    if (type) {
      var careerQuery = {};
      careerQuery.type = type;
      const careers = await Career.find(careerQuery);
      var idsComp = [];
      const idsMerg = [];
      for (let j = 0; j < careers.length; j++) {
        for (let i = 0; i < careers[j].applicants.length; i++) {
          if (careers[j].applicants.length) {
            idsComp.push(careers[j].applicants[i]);
          }
        }
      }
      if (ids.length) {
        for (let i = 0; i < idsComp.length; i++) {
          for (let j = 0; j < ids.length; j++) {
            if (ids[j].toString() == idsComp[i].toString()) {
              idsMerg.push(ids[j]);
            }
          }
        }
        idsComp = idsMerg;
      }
      ids = idsComp;
    }
    if (location) {
      var careerQuery = {};
      careerQuery.location = location;
      const careers = await Career.find(careerQuery);
      var idsComp = [];
      const idsMerg = [];
      for (let j = 0; j < careers.length; j++) {
        for (let i = 0; i < careers[j].applicants.length; i++) {
          if (careers[j].applicants.length) {
            idsComp.push(careers[j].applicants[i]);
          }
        }
      }
      if (ids.length) {
        for (let i = 0; i < idsComp.length; i++) {
          for (let j = 0; j < ids.length; j++) {
            if (ids[j].toString() == idsComp[i].toString()) {
              idsMerg.push(ids[j]);
            }
          }
        }
        idsComp = idsMerg;
      }
      ids = idsComp;
    }
    if (status) {
      query.status = status;
    }
    if (ids.length) {
      query._id = ids;
    }
    var length = await Applicant.find({
      $and: [query, keywordCondition],
    }).count();
    var totalLength = await Applicant.find({}).count();
    if (length == totalLength) {
      if (department || type || location) {
        query._id = [];
        length = await Applicant.find({
          $and: [query, keywordCondition],
        }).count();
      }
    }
    const applicant = await Applicant.find({ $and: [query, keywordCondition] })
      .limit(pageSize)
      .skip(pageSize * page)
      .sort(`${sortBy}`);
    var length = await Applicant.find({ $and: [query, keywordCondition] }).count();
    if (applicant.length == 0) return sendError(res, "Applicant information is not found.")
    if (applicant)
      return sendSuccess(res, "Get applicant information successfully.", {
        length,
        applicant,
      });     
    return sendError(res, "Applicant information is not found.");
  } catch (error) {
    console.log(error);
    return sendServerError(res);
  }
});

/**
 * @route DELETE /api/admin/applicant/:id
 * @description delete an existing applicant
 * @access private
 */
applicantAdminRoute.delete("/:id", async (req, res) => {
  const { id } = req.params;  
  if (!id.match(/^[0-9a-fA-F]{24}$/))
  return sendError(res, "Applicant does not exist.")
  try {
    const isExist = await Applicant.exists({ _id: id });
    if (!isExist) return sendError(res, "Applicant does not exist.");
    await Career.updateOne({}, { $pull: { applicants: id } });
    const applicant = await Applicant.findByIdAndRemove(id);
    return sendSuccess(res, "Delete applicant successfully.", applicant);
  } catch (error) {
    console.log(error);
    return sendServerError(res);
  }
});

export default applicantAdminRoute;
