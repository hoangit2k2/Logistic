import Error from "../helper/error.js"

export const createServiceValidate = data => {
    const error = new Error()

    error.isRequired(data.name, 'name')
    .isRequired(data.sub_detail, 'sub_detail')
    .isRequired(data.target, 'target')
    
    return error.get()
}
