export const dynamic = "force-dynamic";
import { handle, json } from "@/lib/api";
import { requireOnboarded } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";

export const GET = handle(async (req) => {
  const user = await requireOnboarded(req);
  await connectDB();
  const [byStatus, orderAgg] = await Promise.all([
    Product.aggregate([{ $match: { seller: user._id } }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { seller: user._id } }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);
  const p: Record<string, number> = {};
  byStatus.forEach((r: any) => (p[r._id] = r.n));
  const o: Record<string, number> = {};
  orderAgg.forEach((r: any) => (o[r._id] = r.n));
  const sum = (m: Record<string, number>) => Object.values(m).reduce((a, b) => a + b, 0);
  return json({
    totalProducts: sum(p),
    activeListings: p.APPROVED || 0,
    pendingApproval: p.PENDING_APPROVAL || 0,
    rejected: p.REJECTED || 0,
    totalOrders: sum(o),
    pendingOrders: o.pending || 0,
    completedOrders: o.completed || 0,
  });
});
