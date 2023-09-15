import Error from "../helper/error.js"

export const createCarRepairValidate = data =>{
    const error = new Error()

    error.isRequired(data.repairCar_type,'repairCar_type')
    .isRequired(data.device,'device')
    .isRequired(data.price,'price')
    .isRequired(data.note,'note')

    return error.get()
}