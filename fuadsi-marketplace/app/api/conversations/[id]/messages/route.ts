export const dynamic = "force-dynamic";
import { ApiError, handle, isObjectId, json, oid, parseBody } from "@/lib/api";
import { requireOnboarded } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { messageSchema } from "@/lib/validators";
import { Message } from "@/models/Message";
import { Conversation } from "@/models/Conversation";
import { Product } from "@/models/Product";
import { loadConversationFor, messageDto } from "@/lib/chat";
import { isOwnedImage } from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit";
import { publish } from "@/lib/realtime";
import { notifyMessage } from "@/lib/notify";

type Ctx = { params: { id: string } };

export const GET = handle(async (req, { params }: Ctx) => {
  const user = await requireOnboarded(req);
  const id = oid(params.id, "conversation id");
  await connectDB();
  const uid = String(user._id);
  const { otherId } = await loadConversationFor(uid, id);
  const url = new URL(req.url);
  const before = url.searchParams.get("before");
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "30", 10) || 30));
  const filter: any = { conversation: id };
  if (before && isObjectId(before)) filter._id = { $lt: before };
  const rows: any[] = await Message.find(filter).sort({ _id: -1 }).limit(limit + 1).lean();
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit).reverse();

  // Anything the other person sent that we are now fetching counts as delivered.
  const undelivered = page.filter((m) => String(m.sender) === otherId && m.status === "sent").map((m) => m._id);
  if (undelivered.length) {
    await Message.updateMany({ _id: { $in: undelivered }, status: "sent" }, { $set: { status: "delivered", deliveredAt: new Date() } });
    await publish(otherId, "message:status", { conversationId: id, ids: undelivered.map(String), status: "delivered" });
    page.forEach((m) => undelivered.some((u: any) => String(u) === String(m._id)) && (m.status = "delivered"));
  }
  return json({ items: page.map(messageDto), hasMore });
});

export const POST = handle(async (req, { params }: Ctx) => {
  const user = await requireOnboarded(req);
  const id = oid(params.id, "conversation id");
  const uid = String(user._id);
  await rateLimit(`msg:${uid}`, 40, 60);
  const body = await parseBody(req, messageSchema);
  await connectDB();
  const { conversation, otherId } = await loadConversationFor(uid, id);

  if (body.clientId) {
    const dup = await Message.findOne({ conversation: id, clientId: body.clientId }).lean();
    if (dup) return json({ message: messageDto(dup) });
  }
  if (body.image && !isOwnedImage({ url: body.image.url, publicId: body.image.publicId }, String(user.uid), "chat")) {
    throw new ApiError(400, "Invalid image.");
  }
  let productAttachment: any = null;
  if (body.productId) {
    const p: any = await Product.findOne({ _id: body.productId, status: { $in: ["APPROVED", "SOLD_OUT"] } }).lean();
    if (!p) throw new ApiError(400, "That product is not available to share.");
    productAttachment = { id: p._id, title: p.title, price: p.price, image: p.images?.[0]?.url || "" };
  }

  const msg = await Message.create({
    conversation: id,
    sender: user._id,
    text: body.text,
    image: body.image || null,
    product: productAttachment,
    clientId: body.clientId,
  });
  const preview = body.text || (body.image ? "Sent a photo" : "Shared a product");
  await Conversation.updateOne(
    { _id: id },
    { $set: { lastMessage: { text: preview, hasImage: !!body.image, sender: user._id, at: msg.createdAt }, lastMessageAt: msg.createdAt }, $inc: { [`unread.${otherId}`]: 1 } }
  );
  const dto = messageDto(msg);
  await publish(otherId, "message", dto);
  await notifyMessage(otherId, id, user.name || "Someone", preview);
  void conversation;
  return json({ message: dto }, { status: 201 });
});
