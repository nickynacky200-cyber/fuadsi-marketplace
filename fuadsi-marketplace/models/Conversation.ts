import { Schema, model, models, Model } from "mongoose";

const ConversationSchema = new Schema(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      validate: [(v: any[]) => v.length === 2, "A conversation has exactly two participants"],
      index: true,
    },
    pairKey: { type: String, required: true, unique: true }, // sorted "idA_idB" -> one thread per pair
    product: { type: Schema.Types.ObjectId, ref: "Product", default: null }, // latest product context
    productSnapshot: { type: new Schema({ title: String, price: Number, image: String }, { _id: false }), default: null },
    lastMessage: {
      type: new Schema({ text: String, hasImage: Boolean, sender: Schema.Types.ObjectId, at: Date }, { _id: false }),
      default: null,
    },
    lastMessageAt: { type: Date, default: Date.now },
    unread: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);
ConversationSchema.index({ participants: 1, lastMessageAt: -1 });

export const Conversation: Model<any> = models.Conversation || model("Conversation", ConversationSchema);
