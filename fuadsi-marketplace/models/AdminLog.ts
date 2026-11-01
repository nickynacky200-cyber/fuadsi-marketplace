import { Schema, model, models, Model } from "mongoose";

const AdminLogSchema = new Schema(
  {
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "admin_logs" }
);
AdminLogSchema.index({ createdAt: -1 });
AdminLogSchema.index({ admin: 1, createdAt: -1 });

export const AdminLog: Model<any> = models.AdminLog || model("AdminLog", AdminLogSchema);
