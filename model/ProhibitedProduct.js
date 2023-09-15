import mongoose from "mongoose"
const { Schema } = mongoose

const ProhibitedProductSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true
        },
        images: {
            type: String,
            required: false,
            default: null
        },
        detail: {
            type: String,
            default: null
        }
       
    },
    { timestamps: true }
)

export default mongoose.model('prohibited_products', ProhibitedProductSchema)