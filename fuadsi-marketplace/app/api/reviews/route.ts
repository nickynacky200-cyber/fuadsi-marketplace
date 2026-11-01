export const dynamic = "force-dynamic";
import { ApiError, handle, json, pageParams, pageResult, parseBody } from "@/lib/api";
import { requireOnboarded } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { reviewSchema } from "@/lib/validators";
import { Order } from "@/models/Order";
import { Review } from "@/models/Review";
import { Store } from "@/models/Store";
import { notify } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";

export const GET = handle(async (req) => {
  await connectDB();
  const url = new URL(req.url);
  const slug = (url.searchParams.get("store") || "").toLowerCase();
  const store: any = await Store.findOne({ slug }).select("_id").lean();
  if (!store) return json(pageResult([], 0, 1, 10));
  const { page, limit, skip } = pageParams(url, 10);
  const [rows, total] = await Promise.all([
    Review.find({ store: store._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("reviewer", "name photoUrl").lean(),
    Review.countDocuments({ store: store._id }),
  ]);
  const items = rows.map((r: any) => ({ id: String(r._id), rating: r.rating, comment: r.comment, createdAt: r.createdAt, reviewer: { name: r.reviewer?.name || "Buyer", photoUrl: r.reviewer?.photoUrl || "" } }));
  return json(pageResult(items, total, page, limit));
});

export const POST = handle(async (req) => {
  const user = await requireOnboarded(req);
  await rateLimit(`review:${user._id}`, 20, 3600);
  const body = await parseBody(req, reviewSchema);
  await connectDB();
  const order = await Order.findById(body.orderId);
  if (!order || String(order.buyer) !== String(user._id)) throw new ApiError(404, "Order not found.");
  if (order.status !== "completed") throw new ApiError(400, "You can review an order once the seller marks it completed.");
  if (order.reviewed) throw new ApiError(409, "You have already reviewed this order.");

  await Review.create({ order: order._id, reviewer: user._id, seller: order.seller, store: order.store, rating: body.rating, comment: body.comment });
  order.reviewed = true;
  await order.save();

  const agg = await Review.aggregate([{ $match: { store: order.store } }, { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } }]);
  if (agg[0]) await Store.updateOne({ _id: order.store }, { $set: { ratingAvg: Math.round(agg[0].avg * 10) / 10, ratingCount: agg[0].n } });

  await notify({ user: String(order.seller), type: "review", title: `New ${body.rating}-star review`, body: body.comment || `${user.name} rated your store`, link: "/dashboard/seller", refId: String(order._id) });
  return json({ ok: true }, { status: 201 });
});
