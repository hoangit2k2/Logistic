import mongoose from "mongoose"
const { Schema } = mongoose

const QuoteSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        quote: {
            type: String,
            required: true
        },
        avatar: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
)

export default mongoose.model('quotes', QuoteSchema)