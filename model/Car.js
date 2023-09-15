import mongoose from "mongoose"
import { CAR_TYPE } from "../constant.js"
const { Schema } = mongoose

const CarSchema = new Schema(
    {
        plate: {
            type: String,
            required: true,
            unique: true
        },
        car_type: {
            type: String,
            enum: Object.values(CAR_TYPE),
            default: CAR_TYPE.TON_8,
            required: true
        },
        volumn: {
            type: Number,
            required: true
        },
        tonnage: {
            type: Number,
            required: true
        },
        car_fleet: {
            type: Schema.Types.ObjectId,
            ref: 'car_fleets',
            required: true
        },
        insurance: {
            seri: {
                type: String,
                required: true
            },
            expired: {
                type: Date,
                required: true
            }
        }
    },
    { timestamps: true }
)

export default mongoose.model('cars', CarSchema)