export const dynamic = "force-dynamic";
import { ApiError, handle, json, oid, parseBody } from "@/lib/api";
import { requireOnboarded } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { orderPatchSchema } from "@/lib/validators";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { canTransition, isActive, ORDER_LABELS, reservesStock, OrderStatus } from "@/lib/order-flow";
import { notify } from "@/lib/notify";
import { orderDto, ORDER_POPULATE } from "@/lib/orders";
import { rateLimit } from "@/lib/rate-limit";

type Ctx = { params: { id: string } };

export const GET = handle(async (req, { params }: Ctx) => {
  const user = await requireOnboarded(req);
  const id = oid(params.id, "order id");
  await connectDB();
  const o: any = await Order.findById(id).populate(ORDER_POPULATE).lean();
  const isParty = o && [String(o.buyer?._id), String(o.seller?._id)].includes(String(user._id));
  if (!o || (!isParty && user.role !== "admin")) throw new ApiError(404, "Order not found.");
  return json({ order: orderDto(o, String(user._id)) });
});

async function reserveStock(order: any) {
  const done: any[] = [];
  for (const it of order.items) {
    const res = await Product.updateOne({ _id: it.product, quantity: { $gte: it.quantity } }, { $inc: { quantity: -it.quantity } });
    if (!res.modifiedCount) {
      // roll back what was reserved so far
      await Promise.all(done.map((d) => Product.updateOne({ _id: d.product }, { $inc: { quantity: d.quantity } })));
      throw new ApiError(409, `Not enough stock left for "${it.title}".`);
    }
    done.push(it);
    await Product.updateOne({ _id: it.product, quantity: 0, status: "APPROVED" }, { $set: { status: "SOLD_OUT" } });
  }
}

async function releaseStock(order: any) {
  for (const it of order.items) {
    await Product.updateOne({ _id: it.product }, { $inc: { quantity: it.quantity } });
    await Product.updateOne({ _id: it.product, status: "SOLD_OUT", quantity: { $gt: 0 } }, { $set: { status: "APPROVED" } });
  }
}

export const PATCH = handle(async (req, { params }: Ctx) => {
  const user = await requireOnboarded(req);
  const id = oid(params.id, "order id");
  await rateLimit(`order-patch:${user._id}`, 60, 3600);
  const body = await parseBody(req, orderPatchSchema);
  await connectDB();
  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, "Order not found.");
  const uid = String(user._id);
  const role = String(order.buyer) === uid ? "buyer" : String(order.seller) === uid ? "seller" : null;
  if (!role) throw new ApiError(404, "Order not found.");
  const other = role === "buyer" ? String(order.seller) : String(order.buyer);

  if (body.meetingLocation !== undefined) {
    if (!isActive(order.status)) throw new ApiError(400, "This order is closed.");
    order.meetingLocation = body.meetingLocation;
    await notify({ user: other, type: "order_update", title: "Meeting place updated", body: body.meetingLocation || "Meeting place cleared", link: role === "buyer" ? "/dashboard/seller?tab=orders" : "/dashboard/buyer?tab=orders", refId: id });
  }

  if (body.status) {
    const from = order.status as OrderStatus;
    const to = body.status as OrderStatus;
    if (!canTransition(role, from, to, order.deliveryMethod)) {
      throw new ApiError(400, `You can't change an order from ${ORDER_LABELS[from]} to ${ORDER_LABELS[to]}.`);
    }
    if (to === "accepted" && !order.stockReserved) {
      await reserveStock(order);
      order.stockReserved = true;
    }
    if (to === "cancelled" && order.stockReserved && reservesStock(from)) {
      await releaseStock(order);
      order.stockReserved = false;
    }
    order.status = to;
    order.history.push({ status: to, by: user._id, note: body.note || "" });

    const link = role === "seller" ? "/dashboard/buyer?tab=orders" : "/dashboard/seller?tab=orders";
    const typeMap: Record<string, string> = { accepted: "order_accepted", rejected: "order_rejected", completed: "order_completed" };
    await notify({
      user: other,
      type: typeMap[to] || "order_update",
      title: `Order ${order.orderNumber}: ${ORDER_LABELS[to]}`,
      body: to === "completed" && role === "seller" ? "Your order is complete. You can now leave a review." : body.note || "",
      link,
      refId: id,
    });
  }
  await order.save();
  const fresh: any = await Order.findById(id).populate(ORDER_POPULATE).lean();
  return json({ order: orderDto(fresh, uid) });
});
