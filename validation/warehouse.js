import Error from "../helper/error.js"

export const createWarehouseValidate = data => {
    const error = new Error()

    error.isRequired(data.name, 'name')
    .isRequired(data.phone, 'phone')
    .isRequired(data.street, 'street')
    .isRequired(data.ward, 'ward')
    .isRequired(data.district, 'district')
    .isRequired(data.province, 'province')
    .isRequired(data.storekeeper, 'storekeeper')
    
    return error.get()
}
