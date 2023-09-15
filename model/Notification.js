import mongoose from "mongoose";
const { Schema } = mongoose;
const NotificationSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
    },
  },
  { timestamps: true }
);
export default mongoose.model("notifications", NotificationSchema);

