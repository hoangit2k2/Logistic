import Error from "../helper/error.js"
import { VERIFY_OP } from "../constant.js"

export const staffRegisterValidate = data => {
    const error = new Error()

    error.isRequired(data.name, "name")
    .isRequired(data.email, "email")
    .isRequired(data.phone, 'phone')
    .isRequired(data.password, "password")

    return error.get()
}

export const customerRegisterValidate = data => {
    const error = new Error()

    error.isRequired(data.name, "name")
    .isOnlyRequiredOneOf([{field:data.email, name:'email'},{field:data.phone, name:'phone'}])
    .isRequired(data.password, "password")
    .isValidLength(data.password, 'password', 6, 24)
    .isRequired(data.verify_password, "verify_password")
    .isRequired(data.verify_op, 'verify_op')
    .isInRange(data.verify_op, VERIFY_OP)
    
    if(error.get()) return error.errors
    if(data.password != data.verify_password)
        error.appendError('confirm password does not match password.')

    return error.get()
}

export const userVerifyOTP = data => {
    const error = new Error()

    error.isRequired(data.otp, 'otp')

    return error.get()
}

export const userLoginValidate = data => {
    const error = new Error()

    error.isOnlyRequiredOneOf([{field:data.email, name:'email'},{field:data.phone, name:'phone'}])
    .isRequired(data.password, "password")
    return error.get()
}

export const userForgotPw = data => {
    const error = new Error()

    error.isOnlyRequiredOneOf([{field:data.email, name:'email'},{field:data.phone, name:'phone'}])

    return error.get()
}

export const userChangePw = data => {
    const error = new Error()

    error.isRequired(data.oldPw, 'old password')
    .isRequired(data.newPw, "new password")
    .isValidLength(data.newPw, 'new password', 6, 24)
    .isRequired(data.verify_password, "verify_password")

    if(error.get()) return error.errors
    if(data.newPw != data.verify_password)
        error.appendError('confirm password does not match password.')

    return error.get()
}