import { OTP_EXPIRED } from "../constant.js"

export const genarateOTP = () => {
    return {
        value: Math.floor(100000 + Math.random() * 900000).toString(),
        expired: Date.now() + OTP_EXPIRED
    }
}