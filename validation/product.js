import { PRODUCT_UNIT,PRODUCT_STATUS } from "../constant.js"
import Error from "../helper/error.js"

export const addProductValidate = data => {
    const error = new Error()

    error.isRequired(data.name, 'name')
    .isRequired(data.quantity, 'quantity')
    .isRequired(data.unit, 'unit')
    .isInRange(data.unit, PRODUCT_UNIT)
    .isInRange(data.status,PRODUCT_STATUS)
    .isRequiredAndInRangeOfNumber(data.quantity, 'quantity')

    return error.get()
}