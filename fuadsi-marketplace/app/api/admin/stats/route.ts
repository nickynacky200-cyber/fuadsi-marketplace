export const dynamic = "force-dynamic";
import { handle, json } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { Report } from "@/models/Report";
import { AdminLog } from "@/models/AdminLog";

export const GET = handle(async (req) => {
  await requireAdmin(req);
  await connectDB();
  const [users, sellers, products, pendingProducts, orders, completedOrders, openReports, logs, newUsers, newOrders] = await Promise.all([
    User.estimatedDocumentCount(),
    User.countDocuments({ isSeller: true }),
    Product.estimatedDocumentCount(),
    Product.countDocuments({ status: "PENDING_APPROVAL" }),
    Order.estimatedDocumentCount(),
    Order.countDocuments({ status: "completed" }),
    Report.countDocuments({ status: { $in: ["open", "reviewing"] } }),
    AdminLog.find().sort({ createdAt: -1 }).limit(10).populate("admin", "name").lean(),
    User.find().sort({ createdAt: -1 }).limit(5).select("name email createdAt").lean(),
    Order.find().sort({ createdAt: -1 }).limit(5).select("orderNumber status total createdAt").lean(),
  ]);
  return json({
    users, sellers, products, pendingProducts, orders, completedOrders, openReports,
    recent: {
      actions: logs.map((l: any) => ({ id: String(l._id), admin: l.admin?.name || "Admin", action: l.action, targetType: l.targetType, at: l.createdAt })),
      users: newUsers.map((u: any) => ({ id: String(u._id), name: u.name || u.email, at: u.createdAt })),
      orders: newOrders.map((o: any) => ({ id: String(o._id), orderNumber: o.orderNumber, status: o.status, total: o.total, at: o.createdAt })),
    },
  });
});
