import { Schema, model, models, Model } from "mongoose";

const StoreSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true }, // = owner's username
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 600, default: "" },
    avatarUrl: { type: String, default: "" },
    avatarPublicId: { type: String, default: "" },
    whatsapp: { type: String, trim: true, maxlength: 20, default: "" }, // optional, seller-provided
    available: { type: Boolean, default: true }, // store availability toggle
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);
StoreSchema.index({ ratingCount: -1, ratingAvg: -1 });

export const Store: Model<any> = models.Store || model("Store", StoreSchema);
