import mongoose from "mongoose"
const { Schema } = mongoose

const AboutSchema = new Schema(
    {
        description: {
            type: String
        },
        vision: {
            type: String
        },
        values: {
            type: String
        },
        logo: {
            type: String,
            default: null
        },
        banners: [String]
    },
    { timestamps: true }
)

export default mongoose.model('aboutus', AboutSchema)