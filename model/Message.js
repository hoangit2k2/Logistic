import mongoose from "mongoose"
import { MESSAGE_STATUS } from "../constant.js"
const { Schema } = mongoose

const MessageSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type :String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: Object.values(MESSAGE_STATUS),
            default: MESSAGE_STATUS.unseen,
        }
    },
    { timestamps: true }
)

export default mongoose.model('messages', MessageSchema)