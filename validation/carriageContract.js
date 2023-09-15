import Error from "../helper/error.js";
export const carriageContractValidate = (data) => {
    const error = new Error()
    error
    .isRequired(data.car_maintenance, "car_maintenance")
    .isRequired(data.type_fee, "type_fee")
    .isRequired(data.leases, "leases")

    return error.get();

}