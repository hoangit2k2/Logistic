import Error from "../helper/error.js"

export const createUserValidate = data => {
    const error = new Error()

    error.isRequired(data.password, 'password')
        .isRequired(data.email, 'email@gmail.com')

    return error.get()
}
export const updateUserValidate = data => {
    const error = new Error()

    error.isRequired(data.name, 'name')
        .isRequired(data.email, 'email@gmail.com')
        .isRequired(data.phone, "phone")

    return error.get()
}