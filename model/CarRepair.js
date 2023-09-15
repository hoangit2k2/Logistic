import mongoose from "mongoose"
import { REPAIR_TYPE } from "../constant.js";
import { DEVICE_TYPE } from "../constant.js";
const { Schema } = mongoose

const CarRepairSchema = new Schema(
    {
        car:{
            type: Schema.Types.ObjectId,
            ref: 'cars',
            required: true
        },
        repairCar_type: {
            type: String,
            enum: Object.values(REPAIR_TYPE),
            default: REPAIR_TYPE.REPAIR,
            required: true
        },
        device: {
            type: String,
            enum: Object.values(DEVICE_TYPE),
            default: DEVICE_TYPE.TIRE,
            required: true
        },
        price: {
            type: Number,
            required: true       
        },

        note: {
            type: String,
            default: null
        }
    },
    { timestamps: true}
)
export default mongoose.model('carrepairs', CarRepairSchema)