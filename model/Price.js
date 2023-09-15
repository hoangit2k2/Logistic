import mongoose from "mongoose"
const { Schema } = mongoose

const PriceSchema = new Schema(
    {
        uKG: {
            type: [{
                next: {
                    type: Boolean,
                    required: true
                },
                sidestep: {
                    type: Number,
                    required: true
                },
                // prices is an array include 4 elements, which is corresponding with price of each RETURN_ZONE
                prices: [{
                    type: Number,
                    required: true
                }],
                _id: false
            }
            ]
        },
        uM3: {
            type: [{
                next: {
                    type: Boolean,
                    default: false
                },
                sidestep: {
                    type: Number,
                    required: true
                },
                // prices is an array include 4 elements, which is corresponding with price of each RETURN_ZONE
                prices: [{
                    type: Number,
                    required: true
                }],
                _id: false
            }]
        },
        uTON: {
            type: [{
                next: {
                    type: Boolean,
                    default: false
                },
                sidestep: {
                    type: Number,
                    required: true
                },
                // prices is an array include 4 elements, which is corresponding with price of each RETURN_ZONE
                prices: [{
                    type: Number,
                    required: true
                }],
                _id: false
            }]
        }
    },
    { timestamps: true }
)

export default mongoose.model('prices', PriceSchema)