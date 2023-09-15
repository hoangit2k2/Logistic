import Error from "../helper/error.js"

export const createMessageValidate = data => {
    const error = new Error()

    error.isRequired(data.name, 'name')
    .isRequired(data.email, 'email')
    .isRequired(data.phone, 'phone')
    .isRequired(data.message, 'message')

    return error.get()
}