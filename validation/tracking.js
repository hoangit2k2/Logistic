import { PRODUCT_UNIT } from "../constant.js"
import Error from "../helper/error.js"

export const lookupPostageValidate = data => {
    const error = new Error()

    error.isRequired(data.fromProvince, 'fromProvince')
    // .isRequired(data.fromDistrict, 'fromDistrict')
    // .isRequired(data.fromWard, 'fromWard')
    .isRequired(data.toProvince, 'toProvince')
    // .isRequired(data.toDistrict, 'toDistrict')
    // .isRequired(data.toWard, 'toWard')
    .isRequired(data.unit, 'unit')
    .isInRange(data.unit, PRODUCT_UNIT)
    .isRequired(data.quantity, 'quantity')
    .isOnlyRequiredOneOf([{field: data.serviceId, name:'serviceId'}, {field: data.serviceName,name:'serviceName'}])
    
    return error.get()
}