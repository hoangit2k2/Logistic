import Error from "../helper/error.js"

export const createFeatureValidate = data => {
    const error = new Error()

    error.isRequired(data.name, 'name')
    .isRequired(data.detail, 'detail')
    
    return error.get()
}