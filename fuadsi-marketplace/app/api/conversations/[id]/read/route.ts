import { handle, json, oid } from "@/lib/api";
import { requireOnboarded } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { loadConversationFor } from "@/lib/chat";
import { Message } from "@/models/Message";
import { Conversation } from "@/models/Conversation";
import { Notification } from "@/models/Notification";
import { publish } from "@/lib/realtime";

export const POST = handle(async (req, { params }: { params: { id: string } }) => {
  const user = await requireOnboarded(req);
  const id = oid(params.id, "conversation id");
  await connectDB();
  const uid = String(user._id);
  const { otherId } = await loadConversationFor(uid, id);
  const now = new Date();
  const res = await Message.updateMany({ conversation: id, sender: otherId, status: { $ne: "read" } }, { $set: { status: "read", readAt: now, deliveredAt: now } });
  await Promise.all([
    Conversation.updateOne({ _id: id }, { $set: { [`unread.${uid}`]: 0 } }),
    Notification.updateMany({ user: user._id, type: "message", refId: id, read: false }, { $set: { read: true } }),
  ]);
  if (res.modifiedCount) await publish(otherId, "message:status", { conversationId: id, status: "read", upTo: now.toISOString() });
  return json({ ok: true });
});
