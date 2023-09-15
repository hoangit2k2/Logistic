import Error from "../helper/error.js"

export const createConsultancyValidate = data => {
    const error = new Error()

    error.isRequired(data.name, 'name')
    .isRequired(data.email, 'email')
    .isRequired(data.phone, 'phone')
    .isRequired(data.service, 'service')
    return error.get()
}