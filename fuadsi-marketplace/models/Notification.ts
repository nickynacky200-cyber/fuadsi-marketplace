import { Schema, model, models, Model } from "mongoose";

const NotificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["message", "order_new", "order_accepted", "order_rejected", "order_update", "order_completed", "product_approved", "product_rejected", "product_suspended", "review", "system"],
      required: true,
    },
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, default: "", maxlength: 300 },
    link: { type: String, default: "" },
    refId: { type: String, default: "" }, // e.g. conversation id for grouping message notifications
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);
NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, type: 1, refId: 1, read: 1 });

export const Notification: Model<any> = models.Notification || model("Notification", NotificationSchema);
