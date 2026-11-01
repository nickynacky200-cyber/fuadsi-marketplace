export const dynamic = "force-dynamic";
import { z } from "zod";
import { ApiError, handle, isObjectId, json, pageParams, pageResult, parseBody } from "@/lib/api";
import { requireOnboarded, requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Favourite } from "@/models/Favourite";
import { Product } from "@/models/Product";
import { PRODUCT_POPULATE, toPublicProduct } from "@/lib/products";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i) });

export const GET = handle(async (req) => {
  const user = await requireUser(req);
  await connectDB();
  const url = new URL(req.url);
  if (url.searchParams.get("ids")) {
    const rows = await Favourite.find({ user: user._id }).sort({ createdAt: -1 }).limit(500).select("product").lean();
    return json({ ids: rows.map((r: any) => String(r.product)) });
  }
  const { page, limit, skip } = pageParams(url);
  const [favs, total] = await Promise.all([
    Favourite.find({ user: user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Favourite.countDocuments({ user: user._id }),
  ]);
  const products = await Product.find({ _id: { $in: favs.map((f: any) => f.product) }, status: { $in: ["APPROVED", "SOLD_OUT"] }, isAvailable: true }).populate(PRODUCT_POPULATE).lean();
  const map = new Map(products.map((p: any) => [String(p._id), p]));
  const items = favs.map((f: any) => map.get(String(f.product))).filter(Boolean).map((p: any) => toPublicProduct(p));
  return json(pageResult(items, total, page, limit));
});

export const POST = handle(async (req) => {
  const user = await requireOnboarded(req);
  await rateLimit(`fav:${user._id}`, 120, 3600);
  const { productId } = await parseBody(req, schema);
  await connectDB();
  const p = await Product.findOne({ _id: productId, status: { $in: ["APPROVED", "SOLD_OUT"] } }).select("_id").lean();
  if (!p) throw new ApiError(404, "Product not found.");
  const res = await Favourite.updateOne({ user: user._id, product: productId }, { $setOnInsert: { user: user._id, product: productId } }, { upsert: true });
  if (res.upsertedCount) await Product.updateOne({ _id: productId }, { $inc: { favouriteCount: 1 } });
  return json({ ok: true });
});

export const DELETE = handle(async (req) => {
  const user = await requireUser(req);
  const productId = new URL(req.url).searchParams.get("productId");
  if (!isObjectId(productId)) throw new ApiError(400, "Invalid product id.");
  await connectDB();
  const res = await Favourite.deleteOne({ user: user._id, product: productId });
  if (res.deletedCount) await Product.updateOne({ _id: productId, favouriteCount: { $gt: 0 } }, { $inc: { favouriteCount: -1 } });
  return json({ ok: true });
});
