import { Schema, model, models, Model } from "mongoose";

const UserSchema = new Schema(
  {
    uid: { type: String, required: true, unique: true, index: true }, // Firebase UID
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    name: { type: String, trim: true, maxlength: 80, default: "" },
    username: { type: String, lowercase: true, trim: true, maxlength: 30, unique: true, sparse: true },
    photoUrl: { type: String, default: "" },
    photoPublicId: { type: String, default: "" },
    phone: { type: String, trim: true, maxlength: 20, default: "" },
    // Self-declared. Google sign-in does NOT prove enrolment; admins grant the verified badge manually.
    affiliation: { type: String, enum: ["student", "staff", "alumni", "other"], default: "student" },
    department: { type: String, trim: true, maxlength: 80, default: "" },
    level: { type: String, trim: true, maxlength: 20, default: "" },
    verified: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    suspended: { type: Boolean, default: false },
    suspendedReason: { type: String, default: "" },
    isSeller: { type: Boolean, default: false },
    onboarded: { type: Boolean, default: false },
    lastSeenAt: { type: Date, default: null },
  },
  { timestamps: true }
);
UserSchema.index({ name: 1 });

export const User: Model<any> = models.User || model("User", UserSchema);

/** Fields safe to show to other users. */
export const PUBLIC_USER_FIELDS = "name username photoUrl verified isSeller affiliation department";
