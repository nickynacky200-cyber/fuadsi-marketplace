import { ApiError, handle, json, oid, parseBody } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { adminReportSchema } from "@/lib/validators";
import { Report } from "@/models/Report";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";

export const PATCH = handle(async (req, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin(req);
  const id = oid(params.id, "report id");
  const body = await parseBody(req, adminReportSchema);
  await connectDB();
  const r = await Report.findById(id);
  if (!r) throw new ApiError(404, "Report not found.");

  if (body.action === "suspend_product") {
    if (r.targetType !== "product") throw new ApiError(400, "This report isn't about a product.");
    const p = await Product.findById(r.target);
    if (p) {
      p.status = "SUSPENDED";
      p.rejectionReason = body.resolution || "Suspended after a report";
      await p.save();
      await notify({ user: String(p.seller), type: "product_suspended", title: "Listing suspended", body: `${p.title}: ${p.rejectionReason}`, link: "/dashboard/seller?tab=products" });
    }
  } else if (body.action === "suspend_user") {
    const userId = r.targetType === "user" ? String(r.target) : null;
    if (!userId) throw new ApiError(400, "This report isn't about a user.");
    const u = await User.findById(userId);
    if (u) {
      if (u.role === "admin") throw new ApiError(400, "Remove admin role first.");
      u.suspended = true;
      u.suspendedReason = body.resolution || "Suspended after a report";
      await u.save();
      await Product.updateMany({ seller: u._id, status: "APPROVED" }, { $set: { isAvailable: false } });
    }
  }
  r.status = body.status;
  r.resolution = body.resolution;
  r.handledBy = admin._id;
  await r.save();
  await audit(String(admin._id), `report.${body.status}`, "report", id, { action: body.action, resolution: body.resolution, targetType: r.targetType, target: String(r.target) });
  return json({ ok: true });
});
