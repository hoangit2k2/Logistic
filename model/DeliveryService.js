import mongoose from "mongoose"
const { Schema } = mongoose
import Price from './Price.js'

const DeliveryServiceSchema = new Schema(
    {    
        name: {
            type: String,
            required: true,
            unique: true
        },
        sub_detail: {
            type: String,
            required: true
        },
        
        target: {
            type: String,
            required: true
        },
        tip: {
            type: String,
            default: null
        },
        quotes: [{
            type: Schema.Types.ObjectId,
            ref: 'quotes'
        }],
        logo: {
            type: String,
            default: null
        },
        banner: {
            type: String,
            default: null
        },
        features: [
            {
                type: Schema.Types.ObjectId,
                ref: 'features'
            }
        ],
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: 'participants'
            }
        ],
        price: {
            type: Schema.Types.ObjectId,
            ref: 'prices',
        },
        distances: [
            {
                type: Schema.Types.ObjectId,
                ref: 'distances'
            }
        ],
        price_files: [
            {
                province: {
                    type: String,
                    required: true,
                    unique: false
                },
                file: String,
            }
        ]
    },
    { timestamps: true }
)

DeliveryServiceSchema.pre('deleteOne', (next)=>{
    Price.remove({_id: this.price}).exec()
    next()
})

export default mongoose.model('delivery_services', DeliveryServiceSchema)