import Error from "../helper/error.js"

export const createBillValidate = data => {
    const error = new Error()

    error.isRequired(data.service, 'service')
    .isRequired(data.road, 'road')
    .isRequired(data.car, 'car')
    .isRequired(data.driver, 'driver')
    .isRequired(data.status, 'status')
    
    return error.get()
}