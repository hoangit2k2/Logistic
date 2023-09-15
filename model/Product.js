import mongoose from "mongoose";
import { PRODUCT_STATUS, PRODUCT_UNIT } from "../constant.js";
const { Schema } = mongoose;

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: Object.values(PRODUCT_UNIT),
      required: true
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'orders',
      required: true
    },
    note:{
      type: String,
      default: null
    } ,
    product_shipments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'product_shipments'
      }
    ],
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      required: true,
      default: PRODUCT_STATUS.pending
    }
  },
  { timestamps: true }
);

export default mongoose.model("products", ProductSchema);
