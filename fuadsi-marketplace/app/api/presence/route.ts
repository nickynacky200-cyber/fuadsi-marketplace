export const dynamic = "force-dynamic";
import { handle, isObjectId, json } from "@/lib/api";
import { requireOnboarded } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Conversation } from "@/models/Conversation";
import { User } from "@/models/User";
import { onlineMap } from "@/lib/realtime";

/** Presence is only revealed for people you share a conversation with. */
export const GET = handle(async (req) => {
  const user = await requireOnboarded(req);
  await connectDB();
  const wanted = (new URL(req.url).searchParams.get("ids") || "").split(",").filter(isObjectId).slice(0, 50);
  if (!wanted.length) return json({ online: {}, lastSeen: {} });
  const convos: any[] = await Conversation.find({ participants: user._id }).select("participants").limit(200).lean();
  const allowed = new Set<string>();
  convos.forEach((c) => c.participants.forEach((p: any) => String(p) !== String(user._id) && allowed.add(String(p))));
  const ids = wanted.filter((i) => allowed.has(i));
  const [online, users] = await Promise.all([onlineMap(ids), User.find({ _id: { $in: ids } }).select("lastSeenAt").lean()]);
  const lastSeen: Record<string, any> = {};
  users.forEach((u: any) => (lastSeen[String(u._id)] = u.lastSeenAt));
  return json({ online, lastSeen });
});
