export const dynamic = "force-dynamic";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireOnboarded } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { startConversationSchema } from "@/lib/validators";
import { Conversation } from "@/models/Conversation";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import { onlineMap } from "@/lib/realtime";
import { pairKey } from "@/lib/chat";
import { rateLimit } from "@/lib/rate-limit";

const OTHER_FIELDS = "name username photoUrl verified lastSeenAt";

export const GET = handle(async (req) => {
  const user = await requireOnboarded(req);
  await connectDB();
  const uid = String(user._id);
  const rows: any[] = await Conversation.find({ participants: user._id }).sort({ lastMessageAt: -1 }).limit(100).populate("participants", OTHER_FIELDS).lean();
  const others = rows.map((c) => c.participants.find((p: any) => String(p._id) !== uid)).filter(Boolean);
  const online = await onlineMap(others.map((o: any) => String(o._id)));
  const items = rows.map((c) => {
    const o = c.participants.find((p: any) => String(p._id) !== uid) || {};
    return {
      id: String(c._id),
      other: { id: String(o._id), name: o.name, username: o.username, photoUrl: o.photoUrl, verified: !!o.verified, online: !!online[String(o._id)], lastSeenAt: o.lastSeenAt },
      lastMessage: c.lastMessage ? { text: c.lastMessage.text, hasImage: !!c.lastMessage.hasImage, mine: String(c.lastMessage.sender) === uid, at: c.lastMessage.at } : null,
      lastMessageAt: c.lastMessageAt,
      unread: Number((c.unread || {})[uid] || 0),
      product: c.productSnapshot && c.product ? { id: String(c.product), ...c.productSnapshot } : null,
    };
  });
  return json({ items });
});

/** Start (or reopen) the single thread between two users, optionally tied to a product. */
export const POST = handle(async (req) => {
  const user = await requireOnboarded(req);
  await rateLimit(`convo-start:${user._id}`, 30, 3600);
  const body = await parseBody(req, startConversationSchema);
  await connectDB();
  const uid = String(user._id);
  if (body.userId === uid) throw new ApiError(400, "You can't message yourself.");
  const target: any = await User.findById(body.userId).select("suspended onboarded").lean();
  if (!target || target.suspended || !target.onboarded) throw new ApiError(404, "That user can't be messaged.");

  let productFields: any = {};
  if (body.productId) {
    const p: any = await Product.findOne({ _id: body.productId, status: { $in: ["APPROVED", "SOLD_OUT"] } }).lean();
    if (!p || String(p.seller) !== body.userId) throw new ApiError(400, "That product doesn't belong to this seller.");
    productFields = { product: p._id, productSnapshot: { title: p.title, price: p.price, image: p.images?.[0]?.url || "" } };
  }
  const key = pairKey(uid, body.userId);
  const make = () =>
    Conversation.findOneAndUpdate(
      { pairKey: key },
      { ...(body.productId ? { $set: productFields } : {}), $setOnInsert: { participants: [uid, body.userId], unread: {} } },
      { upsert: true, new: true }
    );
  let convo;
  try {
    convo = await make();
  } catch (e: any) {
    if (e?.code !== 11000) throw e;
    convo = await make();
  }
  return json({ id: String(convo!._id) });
});
