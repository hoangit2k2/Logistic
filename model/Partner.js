import mongoose from "mongoose"
const { Schema } = mongoose

const PartnerSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        logo: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
)

export default mongoose.model('partners', PartnerSchema)