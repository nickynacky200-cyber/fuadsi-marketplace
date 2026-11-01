import { handle, json, oid } from "@/lib/api";
import { requireOnboarded } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { loadConversationFor } from "@/lib/chat";
import { publish } from "@/lib/realtime";
import { rateLimit } from "@/lib/rate-limit";

export const POST = handle(async (req, { params }: { params: { id: string } }) => {
  const user = await requireOnboarded(req);
  const id = oid(params.id, "conversation id");
  await rateLimit(`typing:${user._id}`, 60, 60);
  await connectDB();
  const { otherId } = await loadConversationFor(String(user._id), id);
  await publish(otherId, "typing", { conversationId: id, userId: String(user._id) });
  return json({ ok: true });
});
