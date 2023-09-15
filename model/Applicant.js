import mongoose from "mongoose"
import { APPLICANT_STATUS, INTEREST_SOURCE } from "../constant.js"
const { Schema } = mongoose

const ApplicantSchema = new Schema(
    {
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        phoneNumber: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        source: {
            type: String,
            required: true,
            enum: Object.values(INTEREST_SOURCE),
        },
        message: {
            type: String,
        },
        status: {
            type: String,
            type: String,
            enum: Object.values(APPLICANT_STATUS),
        },
    },
    { timestamps: true }
)

export default mongoose.model('applicants', ApplicantSchema)