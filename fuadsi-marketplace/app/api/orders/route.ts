export const dynamic = "force-dynamic";
import { ApiError, handle, json, pageParams, pageResult, parseBody } from "@/lib/api";
import { requireOnboarded } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { orderCreateSchema } from "@/lib/validators";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { Store } from "@/models/Store";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notify";
import { orderDto, ORDER_POPULATE } from "@/lib/orders";
import { ORDER_STATUSES } from "@/lib/order-flow";

export const GET = handle(async (req) => {
  const user = await requireOnboarded(req);
  await connectDB();
  const url = new URL(req.url);
  const { page, limit, skip } = pageParams(url, 15);
  const role = url.searchParams.get("role") === "seller" ? "seller" : "buyer";
  const filter: any = { [role]: user._id };
  const status = url.searchParams.get("status");
  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) filter.status = status;
  const [rows, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(ORDER_POPULATE).lean(),
    Order.countDocuments(filter),
  ]);
  return json(pageResult(rows.map((o: any) => orderDto(o, String(user._id))), total, page, limit));
});

/** One order per seller. Prices, totals and availability are all taken from the database, never the browser. */
export const POST = handle(async (req) => {
  const user = await requireOnboarded(req);
  await rateLimit(`order:${user._id}`, 20, 3600);
  const body = await parseBody(req, orderCreateSchema);
  await connectDB();

  const merged = new Map<string, number>();
  body.items.forEach((i) => merged.set(i.productId, (merged.get(i.productId) || 0) + i.quantity));
  const products: any[] = await Product.find({ _id: { $in: Array.from(merged.keys()) } }).lean();
  if (products.length !== merged.size) throw new ApiError(400, "One or more products are no longer available.");

  const sellerIds = new Set(products.map((p) => String(p.seller)));
  if (sellerIds.size !== 1) throw new ApiError(400, "An order can only contain items from one seller.");
  const sellerId = Array.from(sellerIds)[0];
  if (sellerId === String(user._id)) throw new ApiError(400, "You can't order your own product.");

  const store: any = await Store.findById(products[0].store).lean();
  if (!store || !store.available) throw new ApiError(400, "This store is not taking orders right now.");

  const items = products.map((p) => {
    const qty = merged.get(String(p._id)) as number;
    if (p.status !== "APPROVED" || !p.isAvailable) throw new ApiError(400, `"${p.title}" is not available.`);
    if (qty > p.quantity) throw new ApiError(400, `Only ${p.quantity} of "${p.title}" left.`);
    return { product: p._id, title: p.title, price: p.price, quantity: qty, image: p.images?.[0]?.url || "" };
  });
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const order = await Order.create({
    orderNumber: `FM-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    buyer: user._id,
    seller: sellerId,
    store: store._id,
    items,
    total,
    deliveryMethod: body.deliveryMethod,
    meetingLocation: body.meetingLocation,
    buyerNote: body.note,
    history: [{ status: "pending", by: user._id, note: "Order placed" }],
  });
  await notify({
    user: sellerId,
    type: "order_new",
    title: "New order request",
    body: `${user.name || "A buyer"} ordered ${items.length === 1 ? items[0].title : items.length + " items"}`,
    link: "/dashboard/seller?tab=orders",
    refId: String(order._id),
  });
  return json({ id: String(order._id), orderNumber: order.orderNumber }, { status: 201 });
});
