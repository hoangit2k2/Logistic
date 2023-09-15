import mongoose from "mongoose"
const { Schema } = mongoose

const ContactSchema = new Schema(
    {
        address: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        facebook: {
            type: String
        },
        instagram: {
            type: String,
        },
        tiktok: {
            type: String,
        },
        youtube: {
            type: String,
        },
        hr_mailbox: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
)

export default mongoose.model('contactus', ContactSchema)