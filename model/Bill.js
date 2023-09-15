import mongoose from "mongoose"
import { BILL_STATUS } from "../constant.js"
const { Schema } = mongoose

const BillSchema = new Schema(
    {
        service: {
            type: Schema.Types.ObjectId,
            ref: 'delivery_services',
            required: true
        },
        road: {
            type: Schema.Types.ObjectId,
            ref: 'roads',
            required: true
        },
        car: {
            type: Schema.Types.ObjectId,
            ref: 'cars',
            required: true
        },
        driver: {
            type: Schema.Types.ObjectId,
            ref: 'staffs',
            required: true
        },
        product_shipments: [
            {
                shipment: {
                    type: Schema.Types.ObjectId,
                    ref: 'product_shipments',
                    required: true
                },
                turnover: {
                    type: Number,
                    required: true
                }
            }
        ],
        status: {
            type: String,
            enum: Object.values(BILL_STATUS),
            default: BILL_STATUS.waiting,
            required: true
        },
        actual_fuel: {
            type: Number
        },
        theoretical_fuel: {
            type: Number
        }
    },
    { timestamps: true }
)

export default mongoose.model('bills', BillSchema)