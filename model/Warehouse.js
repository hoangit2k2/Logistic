import mongoose from "mongoose"
import { SHIPMENT_MANAGER } from "../constant.js"
const { Schema } = mongoose

const WarehouseSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true
        },
        phone: {
            type: String,
            required: true
        },
        street: {
            type: String,
            required: true
        },
        ward: {
            type: String,
            required: true
        },
        district: {
            type: String,
            required: true
        },
        province: {
            type: String,
            required: true
        },
        lon: {
            type: Number,
        },
        lat: {
            type: Number,
        },
        storekeeper: {
            type: Schema.Types.ObjectId,
            ref: 'staffs',
            required: true
        },
        turnover: {
            type: Number,
            default: 0,
        },
        inventory_product_shipments: [
            {
                shipment: {
                    type: Schema.Types.ObjectId,
                    ref: 'product_shipments'
                },
                turnover: {
                    type: Number,
                    required: true
                },
                status: {
                    type: String,
                    enum: Object.values(SHIPMENT_MANAGER),
                    default: SHIPMENT_MANAGER.import,
                    required: true
                }
            },
            { timestamps: true }
        ]
    },
{ timestamps: true }
)

export default mongoose.model('warehouses', WarehouseSchema)