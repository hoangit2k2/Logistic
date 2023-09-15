import mongoose from "mongoose"
const { Schema } = mongoose

const RoadSchema = new Schema(
    {
        origin: {
            type: Schema.Types.ObjectId,
            ref: 'warehouses',
            required: true
        },
        destination: {
            type: Schema.Types.ObjectId,
            ref: 'warehouses',
            required: true
        },
        distance: {
            type: Number,
            required: true
        }
    },
    { timestamps: true }
)

export default mongoose.model('roads', RoadSchema)