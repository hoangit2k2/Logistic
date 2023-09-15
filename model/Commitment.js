import mongoose from "mongoose"
const { Schema } = mongoose

const CommitmentSchema = new Schema(
    {
        heading: {
            type: String,
            required: true,
            unique: true
        },
        logo: {
            type: String,
            default: null
        },
        detail: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
)

export default mongoose.model('commitments', CommitmentSchema)