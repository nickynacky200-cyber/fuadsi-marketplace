import { ApiError, handle, json, oid, parseBody } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { adminProductActionSchema } from "@/lib/validators";
import { Product } from "@/models/Product";
import { Favourite } from "@/models/Favourite";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { destroyImages } from "@/lib/cloudinary";

type Ctx = { params: { id: string } };

export const PATCH = handle(async (req, { params }: Ctx) => {
  const admin = await requireAdmin(req);
  const id = oid(params.id, "product id");
  const { action, reason } = await parseBody(req, adminProductActionSchema);
  await connectDB();
  const p = await Product.findById(id);
  if (!p) throw new ApiError(404, "Product not found.");
  const seller = String(p.seller);
  const link = "/dashboard/seller?tab=products";

  if (action === "approve") {
    if (!["PENDING_APPROVAL", "REJECTED"].includes(p.status)) throw new ApiError(400, "Only pending or rejected listings can be approved.");
    if (seller === String(admin._id) && (await User.countDocuments({ role: "admin", suspended: false })) > 1) {
      throw new ApiError(403, "You can't approve your own listing. Ask another administrator.");
    }
    p.status = p.quantity > 0 ? "APPROVED" : "SOLD_OUT";
    p.rejectionReason = "";
    await notify({ user: seller, type: "product_approved", title: "Your listing is live", body: p.title, link });
  } else if (action === "reject") {
    if (!reason) throw new ApiError(400, "Give a reason so the seller knows what to fix.");
    p.status = "REJECTED";
    p.rejectionReason = reason;
    await notify({ user: seller, type: "product_rejected", title: "Listing rejected", body: `${p.title}: ${reason}`, link });
  } else if (action === "suspend") {
    if (!reason) throw new ApiError(400, "Give a reason for the suspension.");
    p.status = "SUSPENDED";
    p.rejectionReason = reason;
    await notify({ user: seller, type: "product_suspended", title: "Listing suspended", body: `${p.title}: ${reason}`, link });
  } else {
    if (p.status !== "SUSPENDED") throw new ApiError(400, "Only suspended listings can be restored.");
    p.status = p.quantity > 0 ? "APPROVED" : "SOLD_OUT";
    p.rejectionReason = "";
  }
  p.reviewedBy = admin._id;
  p.reviewedAt = new Date();
  await p.save();
  await audit(String(admin._id), `product.${action}`, "product", id, { title: p.title, reason: reason || "" });
  return json({ ok: true, status: p.status });
});

/** Permanent removal of an inappropriate listing. */
export const DELETE = handle(async (req, { params }: Ctx) => {
  const admin = await requireAdmin(req);
  const id = oid(params.id, "product id");
  await connectDB();
  const p = await Product.findById(id);
  if (!p) throw new ApiError(404, "Product not found.");
  const open = await Order.exists({ "items.product": p._id, status: { $in: ["accepted", "ready_for_pickup", "out_for_delivery"] } });
  if (open) throw new ApiError(409, "This listing has accepted orders in progress. Suspend it instead.");
  await Promise.all([Product.deleteOne({ _id: p._id }), Favourite.deleteMany({ product: p._id })]);
  destroyImages(p.images.map((i: any) => i.publicId)).catch(() => {});
  await notify({ user: String(p.seller), type: "product_suspended", title: "Listing removed", body: `${p.title} was removed by a moderator.`, link: "/dashboard/seller?tab=products" });
  await audit(String(admin._id), "product.remove", "product", id, { title: p.title });
  return json({ ok: true });
});
