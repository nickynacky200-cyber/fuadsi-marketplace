export const dynamic = "force-dynamic";
import { escapeRegex, handle, json, pageParams, pageResult } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { PRODUCT_STATUSES } from "@/lib/constants";

export const GET = handle(async (req) => {
  await requireAdmin(req);
  await connectDB();
  const url = new URL(req.url);
  const { page, limit, skip } = pageParams(url, 20);
  const filter: any = {};
  const status = url.searchParams.get("status");
  if (status && (PRODUCT_STATUSES as readonly string[]).includes(status)) filter.status = status;
  const q = (url.searchParams.get("q") || "").trim().slice(0, 60);
  if (q) filter.title = new RegExp(escapeRegex(q), "i");
  const oldestFirst = status === "PENDING_APPROVAL";
  const [rows, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: oldestFirst ? 1 : -1 }).skip(skip).limit(limit)
      .populate("seller", "name email username").populate("store", "name slug").populate("category", "name").lean(),
    Product.countDocuments(filter),
  ]);
  const items = rows.map((p: any) => ({
    id: String(p._id), title: p.title, description: p.description, price: p.price, quantity: p.quantity, condition: p.condition,
    status: p.status, rejectionReason: p.rejectionReason, images: (p.images || []).map((i: any) => i.url), createdAt: p.createdAt,
    seller: p.seller && { id: String(p.seller._id), name: p.seller.name, email: p.seller.email, username: p.seller.username },
    store: p.store && { name: p.store.name, slug: p.store.slug }, category: p.category?.name || "",
  }));
  return json(pageResult(items, total, page, limit));
});
