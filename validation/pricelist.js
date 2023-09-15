import Error from "../helper/error.js"


export const uploadPricelistValidate = data => {
    const error = new Error()

    error.isRequired(data.province, 'province')
    
    return error.get()
}
