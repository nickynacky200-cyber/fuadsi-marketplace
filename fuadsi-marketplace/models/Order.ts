import { Schema, model, models, Model } from "mongoose";
import { ORDER_STATUSES } from "@/lib/order-flow";

const ItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: String,
    price: Number, // snapshot taken server-side at order time
    quantity: { type: Number, min: 1, max: 1000 },
    image: String,
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    store: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    items: { type: [ItemSchema], required: true },
    total: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
    deliveryMethod: { type: String, enum: ["meetup", "campus_delivery"], required: true },
    meetingLocation: { type: String, trim: true, maxlength: 200, default: "" },
    buyerNote: { type: String, trim: true, maxlength: 500, default: "" },
    stockReserved: { type: Boolean, default: false },
    reviewed: { type: Boolean, default: false },
    history: {
      type: [new Schema({ status: String, by: Schema.Types.ObjectId, at: { type: Date, default: Date.now }, note: String }, { _id: false })],
      default: [],
    },
  },
  { timestamps: true }
);
OrderSchema.index({ buyer: 1, createdAt: -1 });
OrderSchema.index({ seller: 1, status: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });

export const Order: Model<any> = models.Order || model("Order", OrderSchema);
