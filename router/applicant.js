import express from "express";
import {
  sendError,
  sendServerError,
  sendAutoMail,
  sendSuccess,
} from "../helper/client.js";
import { APPLICANT_STATUS } from "../constant.js";
import path from "path";
import { submitApplicantValidate } from "../validation/applicant.js";
import Applicant from "../model/Applicant.js";
import Contact from "../model/Contact.js";
import Career from "../model/Career.js";

import multer from "multer";
const uploadHandle = multer();

const applicantRoute = express.Router();

/**
 * @route POST /api/applicant
 * @description applicant submit
 * @access public
 */
applicantRoute.post(
  "/:careerId",
  uploadHandle.single("file"),
  async (req, res) => {
    const errors = submitApplicantValidate(req.body);
    if (errors) return sendError(res, errors);
    let { firstName, lastName, phoneNumber, email, source, message } = req.body;
    const cv = req.file;
    const extension = path.extname(cv.originalname);
    const status = APPLICANT_STATUS.PENDING;    
    const careerId = req.params.careerId;
    if (!careerId.match(/^[0-9a-fA-F]{24}$/))
    return sendError(res, " Create department failed.")
    const isexistcareer = await Career.exists({_id:careerId})
    if (!isexistcareer) return sendError(res, "Added applicant does not exist")
    try {
      const applicant = new Applicant({
        firstName,
        lastName,
        phoneNumber,  
        email,
        source,
        message,
        status,
      });
      const contact = await Contact.findOne({});
      const options = {
        from: applicant.email,
        to: contact.hr_mailbox,
        subject: applicant.lastName + "_CV",
        html: `<p>Job application CV</p>`,

        attachments: [
          {
            filename:
              applicant.firstName + applicant.lastName + "_CV" + extension,
            content: cv.buffer,
          },
        ],
      };
      const sendMailSuccess = await sendAutoMail(options);

      if (!sendMailSuccess) return sendError(res, "send CV failed.");
      const confirmation = {
        from: contact.hr_mailbox,
        to: applicant.email,
        subject: "[Logistic-Webapp] Application",
        html: `<p>Submission successful.</p>`,
      };
      const sendConfirmationSuccess = await sendAutoMail(confirmation);
      if (!sendConfirmationSuccess) return sendError(res, "Confirmation cannot be sent to applicant email.");
      const ret = await applicant.save();
      const career = await Career.findByIdAndUpdate(
        { _id: careerId },
        {
          $push: { applicants: applicant },
        }
      );
      if (career)
        return sendSuccess(res, "Added applicant in career successfully.");
    } catch (error) {
      console.log(error);
      return sendServerError(res);
    }
  }
);

export default applicantRoute;
