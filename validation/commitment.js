import Error from "../helper/error.js"

export const createCommitmentValidate = data => {
    const error = new Error()

    error.isRequired(data.heading, 'heading')

    return error.get()
}