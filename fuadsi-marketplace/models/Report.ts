import { Schema, model, models, Model } from "mongoose";

const ReportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["product", "user", "order"], required: true },
    target: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, enum: ["scam", "prohibited", "inappropriate", "fake", "harassment", "other"], required: true },
    details: { type: String, trim: true, maxlength: 800, default: "" },
    status: { type: String, enum: ["open", "reviewing", "resolved", "dismissed"], default: "open" },
    resolution: { type: String, default: "" },
    handledBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ targetType: 1, target: 1 });
ReportSchema.index({ reporter: 1, targetType: 1, target: 1 });

export const Report: Model<any> = models.Report || model("Report", ReportSchema);
