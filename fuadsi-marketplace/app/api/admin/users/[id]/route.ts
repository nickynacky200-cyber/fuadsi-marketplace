import { ApiError, handle, json, oid, parseBody } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { adminUserActionSchema } from "@/lib/validators";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";

export const PATCH = handle(async (req, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin(req);
  const id = oid(params.id, "user id");
  const { action, reason } = await parseBody(req, adminUserActionSchema);
  await connectDB();
  const target = await User.findById(id);
  if (!target) throw new ApiError(404, "User not found.");
  const self = String(target._id) === String(admin._id);

  switch (action) {
    case "suspend":
      if (self) throw new ApiError(400, "You can't suspend your own account.");
      if (target.role === "admin") throw new ApiError(400, "Remove this person's admin role before suspending them.");
      target.suspended = true;
      target.suspendedReason = reason || "";
      await Product.updateMany({ seller: target._id, status: "APPROVED" }, { $set: { isAvailable: false } }); // hide listings while suspended
      break;
    case "restore":
      target.suspended = false;
      target.suspendedReason = "";
      await Product.updateMany({ seller: target._id, status: "APPROVED" }, { $set: { isAvailable: true } });
      break;
    case "verify":
      target.verified = true;
      await notify({ user: id, type: "system", title: "You're now a verified FUADSI member", body: "A verified badge now shows on your profile and store.", link: "/dashboard/buyer" });
      break;
    case "unverify":
      target.verified = false;
      break;
    case "make_admin":
      target.role = "admin";
      break;
    case "remove_admin":
      if (self) throw new ApiError(400, "You can't remove your own admin role.");
      target.role = "user";
      break;
  }
  await target.save();
  await audit(String(admin._id), `user.${action}`, "user", id, { reason: reason || "", email: target.email });
  return json({ ok: true, verified: target.verified, suspended: target.suspended, role: target.role });
});
