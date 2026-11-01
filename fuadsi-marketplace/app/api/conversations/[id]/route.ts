export const dynamic = "force-dynamic";
import { handle, json, oid } from "@/lib/api";
import { requireOnboarded } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { loadConversationFor } from "@/lib/chat";
import { User } from "@/models/User";
import { onlineMap } from "@/lib/realtime";

export const GET = handle(async (req, { params }: { params: { id: string } }) => {
  const user = await requireOnboarded(req);
  const id = oid(params.id, "conversation id");
  await connectDB();
  const { conversation, otherId } = await loadConversationFor(String(user._id), id);
  const o: any = await User.findById(otherId).select("name username photoUrl verified lastSeenAt isSeller").lean();
  const online = await onlineMap([otherId]);
  return json({
    id: String(conversation._id),
    other: { id: otherId, name: o?.name, username: o?.username, photoUrl: o?.photoUrl, verified: !!o?.verified, isSeller: !!o?.isSeller, online: !!online[otherId], lastSeenAt: o?.lastSeenAt || null },
    product: conversation.product && conversation.productSnapshot ? { id: String(conversation.product), ...conversation.productSnapshot.toObject?.() ?? conversation.productSnapshot } : null,
  });
});
