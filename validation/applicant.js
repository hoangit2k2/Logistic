import Error from "../helper/error.js";
import {
  MAX_LENGTH,
  MIN_LENGTH,
  APPLICANT_STATUS,
  INTEREST_SOURCE,
} from "../constant.js";

export const submitApplicantValidate = (data) => {
  const error = new Error()

    .isRequired(data.firstName, "first name")
    .isRequired(data.lastName, "last name")
    .isRequired(data.phoneNumber, "phone number")
    .isRequired(data.email, "email")
    .isRequired(data.source, "source")
    .isInRange(data.source, INTEREST_SOURCE)
    .isRequired(data.message, "message")
    .isValidLength(data.message, "message", MIN_LENGTH, MAX_LENGTH);

  return error.get();
};

export const updateStatusValidate = (data) => {
  const error = new Error()

    .isRequired(data.status, "status")
    .isInRange(data.status, APPLICANT_STATUS);

  if (error.get()) return error.errors;

  return error.get();
};
