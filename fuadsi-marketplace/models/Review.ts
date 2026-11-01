import { Schema, model, models, Model } from "mongoose";

const ReviewSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true }, // one review per order
    reviewer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    store: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 600, default: "" },
  },
  { timestamps: true }
);
ReviewSchema.index({ store: 1, createdAt: -1 });

export const Review: Model<any> = models.Review || model("Review", ReviewSchema);
