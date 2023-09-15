import Error from "../helper/error.js"

export const createCarValidate = data => {
    const error = new Error()

    error.isRequired(data.plate, 'plate')
    .isRequired(data.car_type, 'car_type')
    .isRequired(data.volumn, 'volumn')
    .isRequired(data.tonnage, 'tonnage')
    
    return error.get()
}