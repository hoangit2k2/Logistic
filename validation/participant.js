import Error from "../helper/error.js"

export const createParticipantValidate = data => {
    const error = new Error()

    error.isRequired(data.name, 'name')
    .isRequired(data.description, 'description')
    
    return error.get()
}