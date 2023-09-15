import mongoose from "mongoose"
import { TURNOVER, PAYMENT_METHOD } from "../constant.js"
const { Schema } = mongoose

const TurnoverSchema = new Schema(
    {
        total: {
            type: Number,
            required: true
        },
        payment_method: {
            type: String,
            enum: Object.values(PAYMENT_METHOD),
            required: true
        },
        paid: {
            type: Number,
            required: true,
            default: 0
        },
        type_of_turnover: {
            type: String,
            enum: Object.values(TURNOVER),
            required: true
        },
        refund: {
            type: Number,
            default: 0
        },
        bill: {
            type: Schema.Types.ObjectId,
            ref: 'bills'
        },
        order: {
            type: Schema.Types.ObjectId,
            ref: 'orders'
        },
        message: String
    },
    { timestamps: true }
)

export default mongoose.model('turnovers', TurnoverSchema)