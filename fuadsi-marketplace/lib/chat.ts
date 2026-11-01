import { ApiError } from "./api";
import { Conversation } from "@/models/Conversation";

export const pairKey = (a: string, b: string) => [a, b].sort().join("_");

/** Authorisation gate for every conversation endpoint: the caller must be one of the two participants. */
export async function loadConversationFor(userId: string, conversationId: string) {
  const c = await Conversation.findById(conversationId);
  if (!c || !c.participants.some((p: any) => String(p) === userId)) throw new ApiError(404, "Conversation not found.");
  const otherId = String(c.participants.find((p: any) => String(p) !== userId));
  return { conversation: c, otherId };
}

export function messageDto(m: any) {
  return {
    id: String(m._id),
    conversation: String(m.conversation),
    sender: String(m.sender),
    text: m.text,
    image: m.image?.url ? { url: m.image.url } : null,
    product: m.product?.id ? { id: String(m.product.id), title: m.product.title, price: m.product.price, image: m.product.image } : null,
    status: m.status,
    createdAt: m.createdAt,
    clientId: m.clientId || null,
  };
}
