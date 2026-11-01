import { Notification } from "@/models/Notification";
import { publish } from "./realtime";

type Input = { user: string; type: string; title: string; body?: string; link?: string; refId?: string };

export async function notify(n: Input) {
  try {
    const doc = await Notification.create({ ...n, body: (n.body || "").slice(0, 300) });
    await publish(n.user, "notification", { id: String(doc._id), type: n.type, title: n.title, body: doc.body, link: n.link || "" });
    return doc;
  } catch (e) {
    console.error("[notify] failed", (e as Error).message);
  }
}

/** One rolling unread notification per conversation, so chatty threads don't flood the bell. */
export async function notifyMessage(user: string, conversationId: string, fromName: string, preview: string) {
  try {
    const existing = await Notification.findOneAndUpdate(
      { user, type: "message", refId: conversationId, read: false },
      { $set: { title: `New message from ${fromName}`, body: preview.slice(0, 120), updatedAt: new Date() } },
      { new: true }
    );
    if (existing) {
      await publish(user, "notification", { id: String(existing._id), type: "message", title: existing.title, body: existing.body, link: existing.link, silent: true });
      return;
    }
    await notify({ user, type: "message", title: `New message from ${fromName}`, body: preview, link: `/messages/${conversationId}`, refId: conversationId });
  } catch (e) {
    console.error("[notify] message failed", (e as Error).message);
  }
}
