import Error from "../helper/error.js"

export const createQuoteValidate = data => {
    const error = new Error()

    error.isRequired(data.name, 'name')
    .isRequired(data.description, 'description')
    .isRequired(data.quote, 'quote')
    
    return error.get()
}