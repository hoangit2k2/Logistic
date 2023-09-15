import Error from "../helper/error.js"
import {
    RETURN_ZONE,
  } from "../constant.js";

export const createDistanceValidate = data => {
    const error = new Error()

    error.isRequired(data.fromProvince, 'fromProvince')
    .isRequired(data.toProvince, 'toProvince')
    .isRequired(data.zonecode, 'zonecode')
    .isInRange(data.zonecode, RETURN_ZONE)
    .isRequired(data.dist, 'distance')
    
    return error.get()
}
export const zoneCodeValidate = data => {
    const error = new Error()

    error.isRequired(data.zonecode, 'zonecode')
    .isInRange(data.zonecode, RETURN_ZONE)
    
    return error.get()
}
