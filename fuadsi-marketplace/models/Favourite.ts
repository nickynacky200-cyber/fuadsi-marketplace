import { Schema, model, models, Model } from "mongoose";

const FavouriteSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: true }
);
FavouriteSchema.index({ user: 1, product: 1 }, { unique: true });
FavouriteSchema.index({ user: 1, createdAt: -1 });

export const Favourite: Model<any> = models.Favourite || model("Favourite", FavouriteSchema);
