import mongoose from "mongoose"
import { RETURN_ZONE } from "../constant.js"
const { Schema } = mongoose

const DistanceSchema = new Schema(
    {
        fromProvince: {
            type: String,
            required: true
        },
        toProvince: {
            type: String,
            required: true
        },
        zonecode: {
            type: String,
            enum: Object.keys(RETURN_ZONE),
            required: true
        },
        distance: {
            type: Number
        }
    },
    { timestamps: true }
)

export default mongoose.model('distances', DistanceSchema)