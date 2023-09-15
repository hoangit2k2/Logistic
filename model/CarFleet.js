import mongoose from "mongoose"
const { Schema } = mongoose

const CarFleetSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true
        },
        director: {
            type: Schema.Types.ObjectId,
            ref: 'staffs',
            required: true
        },
        bills: [
            {
                type: Schema.Types.ObjectId,
                ref: 'bills',
                required: true
            }
        ]
    },
    { timestamps: true }
)

export default mongoose.model('car_fleets', CarFleetSchema)
