import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const chatSchema = new Schema(
  {
    content: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    sendId: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "Sender ID is required"],
    },
    receivedId: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "Receiver ID is required"],
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.index({ sendId: 1 });
chatSchema.index({ receivedId: 1 });

export const Chat = mongoose.model("Chat", chatSchema);
