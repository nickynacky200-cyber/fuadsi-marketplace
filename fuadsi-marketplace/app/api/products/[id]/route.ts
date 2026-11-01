export const dynamic = "force-dynamic";
import { ApiError, handle, json, oid, parseBody } from "@/lib/api";
import { optionalUser, requireOnboarded } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { productPatchSchema } from "@/lib/validators";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Favourite } from "@/models/Favourite";
import { Order } from "@/models/Order";
import { destroyImages, isOwnedImage } from "@/lib/cloudinary";
import { buildSearchTokens } from "@/lib/search";
import { discountPercent } from "@/lib/format";
import { PRODUCT_POPULATE, toPublicProduct } from "@/lib/products";
import { rateLimit } from "@/lib/rate-limit";

type Ctx = { params: { id: string } };

export const GET = handle(async (req, { params }: Ctx) => {
  const id = oid(params.id, "product id");
  await connectDB();
  const viewer = await optionalUser(req);
  const p: any = await Product.findById(id).populate(PRODUCT_POPULATE).lean();
  if (!p) throw new ApiError(404, "Product not found.");
  const isOwner = viewer && String(p.seller) === String(viewer._id);
  const isAdmin = viewer?.role === "admin";
  const publiclyVisible = ["APPROVED", "SOLD_OUT"].includes(p.status) && p.isAvailable;
  if (!publiclyVisible && !isOwner && !isAdmin) throw new ApiError(404, "Product not found.");
  if (publiclyVisible && !isOwner) Product.updateOne({ _id: id }, { $inc: { viewCount: 1 } }).exec().catch(() => {});
  let favourited = false;
  if (viewer) favourited = !!(await Favourite.exists({ user: viewer._id, product: id }));
  return json({ product: toPublicProduct(p, { detail: true }), favourited, isOwner: !!isOwner });
});

export const PATCH = handle(async (req, { params }: Ctx) => {
  const user = await requireOnboarded(req);
  const id = oid(params.id, "product id");
  await rateLimit(`product-edit:${user._id}`, 60, 3600);
  const body = await parseBody(req, productPatchSchema);
  await connectDB();
  const p = await Product.findById(id);
  if (!p || String(p.seller) !== String(user._id)) throw new ApiError(404, "Product not found.");
  if (p.status === "SUSPENDED") throw new ApiError(403, "This listing is suspended by an administrator and can't be edited.");

  let needsReview = false;
  const removed: string[] = [];

  if (body.title !== undefined && body.title !== p.title) { p.title = body.title; needsReview = true; }
  if (body.description !== undefined && body.description !== p.description) { p.description = body.description; needsReview = true; }
  if (body.condition !== undefined && body.condition !== p.condition) { p.condition = body.condition; needsReview = true; }
  if (body.category !== undefined && String(body.category) !== String(p.category)) {
    const c = await Category.findOne({ _id: body.category, active: true }).lean();
    if (!c) throw new ApiError(400, "Choose a valid category.");
    p.category = body.category;
    needsReview = true;
  }
  if (body.images) {
    for (const img of body.images) {
      if (!isOwnedImage(img, String(user.uid), "products")) throw new ApiError(400, "One of the images was not uploaded through the marketplace.");
    }
    const keep = new Set(body.images.map((i) => i.publicId));
    p.images.forEach((i: any) => !keep.has(i.publicId) && removed.push(i.publicId));
    const before = p.images.map((i: any) => i.publicId).join("|");
    p.images = body.images;
    if (before !== body.images.map((i) => i.publicId).join("|")) needsReview = true;
  }
  if (body.location !== undefined) p.location = body.location || "FUADSI campus";
  if (body.price !== undefined) p.price = body.price;
  if (body.originalPrice !== undefined) p.originalPrice = body.originalPrice || null;
  if (body.quantity !== undefined) p.quantity = body.quantity;
  if (body.isAvailable !== undefined) p.isAvailable = body.isAvailable;
  if (p.originalPrice && p.originalPrice <= p.price) throw new ApiError(400, "Original price must be higher than the selling price.");
  p.discountPercent = discountPercent(p.price, p.originalPrice);

  // Content changes go back through moderation so an approved listing can't be swapped for something else.
  if (needsReview && ["APPROVED", "REJECTED", "SOLD_OUT"].includes(p.status)) {
    p.status = "PENDING_APPROVAL";
    p.rejectionReason = "";
  } else if (p.status === "APPROVED" && p.quantity === 0) p.status = "SOLD_OUT";
  else if (p.status === "SOLD_OUT" && p.quantity > 0) p.status = "APPROVED";

  if (needsReview) {
    const cat: any = await Category.findById(p.category).select("name").lean();
    p.searchTokens = buildSearchTokens(p.title, cat?.name || "");
  }
  await p.save();
  if (removed.length) destroyImages(removed).catch(() => {});
  return json({ id: String(p._id), status: p.status, resubmitted: needsReview });
});

export const DELETE = handle(async (req, { params }: Ctx) => {
  const user = await requireOnboarded(req);
  const id = oid(params.id, "product id");
  await connectDB();
  const p = await Product.findById(id);
  if (!p || String(p.seller) !== String(user._id)) throw new ApiError(404, "Product not found.");
  const open = await Order.exists({ "items.product": p._id, status: { $in: ["pending", "accepted", "ready_for_pickup", "out_for_delivery"] } });
  if (open) throw new ApiError(409, "This product has open orders. Finish or reject them first, or mark it unavailable instead.");
  await Promise.all([Product.deleteOne({ _id: p._id }), Favourite.deleteMany({ product: p._id })]);
  destroyImages(p.images.map((i: any) => i.publicId)).catch(() => {});
  return json({ ok: true });
});
