import Error from "../helper/error.js"

export const createOrUpdateContactUsValidate = data => {
    const error = new Error()

    error.isRequired(data.address, 'address')
    .isRequired(data.email, 'email')
    .isRequired(data.phone, 'phone')
    .isRequired(data.hr_mailbox, 'HR\'s mailbox')
    
    return error.get()
}