import { Schema, model, models, Model } from "mongoose";

const MessageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, maxlength: 2000, default: "" },
    image: { type: new Schema({ url: String, publicId: String }, { _id: false }), default: null },
    product: { type: new Schema({ id: Schema.Types.ObjectId, title: String, price: Number, image: String }, { _id: false }), default: null },
    clientId: { type: String, maxlength: 64 }, // idempotency key from the sender's device
    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);
MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ conversation: 1, clientId: 1 }, { unique: true, partialFilterExpression: { clientId: { $type: "string" } } });

export const Message: Model<any> = models.Message || model("Message", MessageSchema);
