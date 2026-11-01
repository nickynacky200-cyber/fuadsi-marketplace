export const dynamic = "force-dynamic";
import { handle, json, pageParams, pageResult } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { ORDER_STATUSES } from "@/lib/order-flow";

export const GET = handle(async (req) => {
  await requireAdmin(req);
  await connectDB();
  const url = new URL(req.url);
  const { page, limit, skip } = pageParams(url, 20);
  const filter: any = {};
  const status = url.searchParams.get("status");
  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) filter.status = status;
  const num = (url.searchParams.get("q") || "").trim().toUpperCase().slice(0, 30);
  if (num) filter.orderNumber = num;
  const [rows, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("buyer", "name email").populate("seller", "name email").lean(),
    Order.countDocuments(filter),
  ]);
  const items = rows.map((o: any) => ({
    id: String(o._id), orderNumber: o.orderNumber, status: o.status, total: o.total, deliveryMethod: o.deliveryMethod, createdAt: o.createdAt,
    items: o.items.map((i: any) => `${i.quantity} x ${i.title}`),
    buyer: o.buyer && { id: String(o.buyer._id), name: o.buyer.name, email: o.buyer.email },
    seller: o.seller && { id: String(o.seller._id), name: o.seller.name, email: o.seller.email },
    history: o.history.map((h: any) => ({ status: h.status, at: h.at, note: h.note })),
  }));
  return json(pageResult(items, total, page, limit));
});
