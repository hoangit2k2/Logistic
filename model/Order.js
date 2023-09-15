import mongoose from "mongoose"
import { ORDER_STATUS, PICK_UP_AT } from "../constant.js"
const { Schema } = mongoose

const OrderSchema = new Schema(
    {
        orderId: {
            type: String,
            unique: true,
            required: true
        },
        service: {
            type: Schema.Types.ObjectId,
            ref: 'delivery_services',
            required: true
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: 'customers',
            required: true
        },
        // staffconfirm: {
        //     type: Schema.Types.ObjectId,
        //     ref: 'users',
        //     default: null
        // },
        sender: {
            type: {
                name: {
                    type: String,
                    required: true
                },
                phone: {
                    type: String,
                    required: true
                }
            },
            required: true
        },
        receiver: {
            type: {
                name: {
                    type: String,
                    required: true
                },
                phone: {
                    type: String,
                    required: true
                }
            },
            required: true
        },
        origin: {
            type: {
                loading: {
                    type: String,
                    enum: Object.values(PICK_UP_AT),
                    default: PICK_UP_AT.ON_SITE,
                    required: true
                },
                address: {
                    type: Schema.Types.Mixed,
                    required: true
                }
            },
            require: true
        },
        destination: {
            type: {
                unloading: {
                    type: String,
                    enum: Object.values(PICK_UP_AT),
                    default: PICK_UP_AT.ON_SITE,
                    required: true
                },
                address: {
                    type: Schema.Types.Mixed,
                    required: true
                }
            },
            require: true
        },
        total_price: Number,
        status: {
            type: String,
            enum: Object.values(ORDER_STATUS),
            default: ORDER_STATUS.waiting,
            required: true
        },
        route: [
            {
                type: Schema.Types.ObjectId,
                ref: 'warehouses'
            }
        ],
        feedback: [
            {
                user: {
                    type: String,
                    required: true
                },
                content: {
                    type: String,
                    required: true
                }
            },
            { timestamps: true }
        ]
    },
    { timestamps: true }
)

export default mongoose.model('orders', OrderSchema)