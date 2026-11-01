export const dynamic = "force-dynamic";
import { handle, json, isObjectId } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { PRODUCT_POPULATE, toPublicProduct } from "@/lib/products";

/** Cart/favourite lookups. Only publicly visible products are returned. */
export const GET = handle(async (req) => {
  await connectDB();
  const ids = (new URL(req.url).searchParams.get("ids") || "").split(",").filter(isObjectId).slice(0, 30);
  if (!ids.length) return json({ items: [] });
  const rows = await Product.find({ _id: { $in: ids }, status: { $in: ["APPROVED", "SOLD_OUT"] } }).populate(PRODUCT_POPULATE).lean();
  return json({ items: rows.map((r: any) => toPublicProduct(r)) });
});
