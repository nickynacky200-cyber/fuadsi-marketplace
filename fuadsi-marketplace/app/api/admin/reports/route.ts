export const dynamic = "force-dynamic";
import { handle, json, pageParams, pageResult } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Report } from "@/models/Report";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { Order } from "@/models/Order";

export const GET = handle(async (req) => {
  await requireAdmin(req);
  await connectDB();
  const url = new URL(req.url);
  const { page, limit, skip } = pageParams(url, 20);
  const filter: any = {};
  const status = url.searchParams.get("status");
  if (status && ["open", "reviewing", "resolved", "dismissed"].includes(status)) filter.status = status;
  const [rows, total] = await Promise.all([
    Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("reporter", "name email").lean(),
    Report.countDocuments(filter),
  ]);
  const ids = (t: string) => rows.filter((r: any) => r.targetType === t).map((r: any) => r.target);
  const [products, users, orders] = await Promise.all([
    Product.find({ _id: { $in: ids("product") } }).select("title status seller").lean(),
    User.find({ _id: { $in: ids("user") } }).select("name email suspended").lean(),
    Order.find({ _id: { $in: ids("order") } }).select("orderNumber status").lean(),
  ]);
  const label = new Map<string, any>();
  products.forEach((p: any) => label.set(String(p._id), { label: p.title, state: p.status }));
  users.forEach((u: any) => label.set(String(u._id), { label: u.name || u.email, state: u.suspended ? "suspended" : "active" }));
  orders.forEach((o: any) => label.set(String(o._id), { label: o.orderNumber, state: o.status }));
  const items = rows.map((r: any) => ({
    id: String(r._id), targetType: r.targetType, target: String(r.target), reason: r.reason, details: r.details, status: r.status,
    resolution: r.resolution, createdAt: r.createdAt, reporter: r.reporter && { name: r.reporter.name, email: r.reporter.email },
    targetInfo: label.get(String(r.target)) || { label: "(deleted)", state: "" },
  }));
  return json(pageResult(items, total, page, limit));
});
