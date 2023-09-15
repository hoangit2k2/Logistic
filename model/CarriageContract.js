import {mongoose} from "mongoose";
import { CAR_TYPE, LEASES, TYPE_FEE } from "../constant.js";
const { Schema } = mongoose

const carriageContractSchema = new Schema(
    {
        car_maintenance: {
        type: String,
        enum: Object.values(CAR_TYPE),
        default: CAR_TYPE.TON_8,       
        require: true
    },
        type_fee: [{    
                type:{ type: String,
                    enum: Object.values(TYPE_FEE),
                    default: TYPE_FEE.FEE,
                    require: false      
            },
            price: {
                    type: Number,
                    require: true,
            } ,  
            _id: false                 
    },
],
        leases: {
            leases_type: {
                    type: String,
                    enum: Object.values(LEASES),
                    default: LEASES.WATER,
                    require: true
            },
            partners: {
                    type: Schema.Types.ObjectId,
                    ref: 'partners',
                    require: true
            },
            code_orders: {
                    type: String,
                    require: true
            },
            file: {
                    type: String,
                    require: true,
            },
    }

},
    { timestamps: true }
)
export default mongoose.model("carriageContract", carriageContractSchema);