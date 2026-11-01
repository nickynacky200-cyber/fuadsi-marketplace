export const dynamic = "force-dynamic";
import { handle, json } from "@/lib/api";
import { requireUser, touchLastSeen } from "@/lib/auth";
import { Notification } from "@/models/Notification";
import { Conversation } from "@/models/Conversation";

export const GET = handle(async (req) => {
  const user = await requireUser(req);
  const uid = String(user._id);
  const [notifications, convos] = await Promise.all([
    Notification.countDocuments({ user: user._id, read: false }),
    Conversation.find({ participants: user._id, [`unread.${uid}`]: { $gt: 0 } }).select("unread").lean(),
  ]);
  const messages = convos.reduce((sum: number, c: any) => sum + Number((c.unread || {})[uid] || 0), 0);
  touchLastSeen(uid).catch(() => {});
  return json({ notifications, messages });
});
