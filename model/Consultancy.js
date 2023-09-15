import mongoose from "mongoose"
const { Schema } = mongoose

const ConsultancySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            default: null
        },
        phone: {
            type: String,
            required: true
        },
        service: {
            type: String,
            required: true
        },
        province: {
            type: String,
            default: null
        },
        ward: {
            type: String,
            default: null
        },
        district: {
            type: String,
            default: null
        },
        parcel: {
            type: String,
            default: null
        },
        quantity: {
            type: Number,
            default: null
        },
        solved_status: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
)

export default mongoose.model('consultancy', ConsultancySchema)