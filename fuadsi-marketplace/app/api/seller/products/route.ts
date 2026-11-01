export const dynamic = "force-dynamic";
import { handle, json, pageParams, pageResult } from "@/lib/api";
import { requireOnboarded } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { PRODUCT_POPULATE, toPublicProduct } from "@/lib/products";

export const GET = handle(async (req) => {
  const user = await requireOnboarded(req);
  await connectDB();
  const url = new URL(req.url);
  const { page, limit, skip } = pageParams(url, 20);
  const filter: any = { seller: user._id };
  const status = url.searchParams.get("status");
  if (status && ["PENDING_APPROVAL", "APPROVED", "REJECTED", "SUSPENDED", "SOLD_OUT"].includes(status)) filter.status = status;
  const [rows, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(PRODUCT_POPULATE).lean(),
    Product.countDocuments(filter),
  ]);
  return json(pageResult(rows.map((r: any) => ({ ...toPublicProduct(r, { detail: true }) })), total, page, limit));
});
