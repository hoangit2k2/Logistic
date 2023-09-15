import mongoose from "mongoose"
import { POSITION } from "../constant.js"
const { Schema } = mongoose

const CareerSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: Object.values(POSITION),
            default: null
        },
        
        description: {
            type: String,
            default: null
        },
        location: {
            type: String,
            default: null
        },
        state: {
            type: String,
            default: null
        },
        bonus: {
            type: String,
            default: null
        },
        deadline: {
            type: Date,
            default: null
        },
        applicants: [
            {
                type: Schema.Types.ObjectId,
                ref: 'applicants'
            }
        ],
    },
    { timestamps: true }
)

export default mongoose.model('careers', CareerSchema)