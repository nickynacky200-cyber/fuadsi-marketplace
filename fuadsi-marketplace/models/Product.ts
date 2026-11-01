import { Schema, model, models, Model } from "mongoose";
import { PRODUCT_STATUSES } from "@/lib/constants";

const ImageSchema = new Schema(
  { url: { type: String, required: true }, publicId: { type: String, required: true }, width: Number, height: Number },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    price: { type: Number, required: true, min: 0, max: 1e9 }, // NGN
    originalPrice: { type: Number, min: 0, max: 1e9, default: null },
    discountPercent: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 0, max: 100000, default: 1 },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    condition: { type: String, enum: ["new", "used"], default: "new" },
    images: { type: [ImageSchema], validate: [(v: any[]) => v.length >= 1 && v.length <= 6, "1 to 6 images required"] },
    location: { type: String, trim: true, maxlength: 100, default: "FUADSI campus" },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    store: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    status: { type: String, enum: PRODUCT_STATUSES, default: "PENDING_APPROVAL" },
    rejectionReason: { type: String, default: "" },
    isAvailable: { type: Boolean, default: true }, // seller can hide without losing approval
    searchTokens: { type: [String], default: [] },
    viewCount: { type: Number, default: 0 },
    favouriteCount: { type: Number, default: 0 },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Public listing queries
ProductSchema.index({ status: 1, isAvailable: 1, createdAt: -1 });
ProductSchema.index({ status: 1, isAvailable: 1, category: 1, createdAt: -1 });
ProductSchema.index({ status: 1, isAvailable: 1, discountPercent: -1 });
ProductSchema.index({ status: 1, isAvailable: 1, favouriteCount: -1, viewCount: -1 });
ProductSchema.index({ status: 1, isAvailable: 1, price: 1 });
ProductSchema.index({ searchTokens: 1, status: 1 });
// Seller and admin queries
ProductSchema.index({ seller: 1, createdAt: -1 });
ProductSchema.index({ store: 1, status: 1, createdAt: -1 });
ProductSchema.index({ status: 1, createdAt: 1 });

export const Product: Model<any> = models.Product || model("Product", ProductSchema);

export const publicProductFilter = { status: "APPROVED", isAvailable: true } as const;
