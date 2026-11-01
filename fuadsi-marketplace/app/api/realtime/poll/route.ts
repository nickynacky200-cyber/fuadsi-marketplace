export const dynamic = "force-dynamic";
import { handle, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { currentSeq, eventsSince, markOnline } from "@/lib/realtime";

/** Fallback transport (plain HTTP polling) used when the streaming connection can't be kept open. */
export const GET = handle(async (req) => {
  const user = await requireUser(req);
  const uid = String(user._id);
  const afterParam = new URL(req.url).searchParams.get("after");
  await markOnline(uid);
  if (afterParam === null) return json({ events: [], seq: await currentSeq(uid) });
  const after = Math.max(0, parseInt(afterParam, 10) || 0);
  const events = await eventsSince(uid, after);
  return json({ events, seq: events.length ? events[events.length - 1].id : after });
});
