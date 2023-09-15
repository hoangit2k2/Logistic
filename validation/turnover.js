import Error from "../helper/error.js";
import { PAYMENT_METHOD, TURNOVER } from "../constant.js";

export const turnoverValidate = (data) => {
  const error = new Error()

    .isRequired(data.total, "total")
    .isRequired(data.payment_method, "payment method")
    .isInRange(data.payment_method, PAYMENT_METHOD)
    .isRequired(data.type_of_turnover, "type of turnover")
    .isInRange(data.type_of_turnover, TURNOVER);
  
    return error.get();
};

export const paidValidate = (data) => {
  const error = new Error()

    .isRequired(data.paid, "paid");
  
    return error.get();
};

