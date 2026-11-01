import { requireUser } from "@/lib/auth";
import { currentSeq, eventsSince, markOnline, publish } from "@/lib/realtime";
import { Message } from "@/models/Message";
import { handle } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TICK_MS = 2500; // Upstash is REST based, so we poll its sequence counter (1 command per tick)
const LIFETIME_MS = 50_000; // reconnect before the function limit; the client reopens instantly with ?after=

/**
 * Server-Sent Events stream. Vercel Functions can't host a WebSocket server, so realtime delivery uses a
 * long-lived streaming HTTP response + Upstash Redis as the cross-instance event bus. Authenticated with a
 * Firebase ID token in the Authorization header (the client uses fetch streaming, not EventSource).
 */
export const GET = handle(async (req) => {
  const user = await requireUser(req);
  const uid = String(user._id);
  const afterParam = new URL(req.url).searchParams.get("after");
  let lastSeq = afterParam === null ? await currentSeq(uid) : Math.max(0, parseInt(afterParam, 10) || 0);

  const enc = new TextEncoder();
  const started = Date.now();
  let closed = false;
  req.signal.addEventListener("abort", () => (closed = true));

  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(enc.encode(chunk));
        } catch {
          closed = true;
        }
      };
      send(`retry: 1000\n: connected\n\n`);
      send(`event: hello\ndata: ${JSON.stringify({ seq: lastSeq })}\n\n`);
      let lastBeat = 0;
      try {
        while (!closed && Date.now() - started < LIFETIME_MS) {
          const now = Date.now();
          if (now - lastBeat > 15_000) {
            await markOnline(uid);
            send(`: keepalive ${now}\n\n`);
            lastBeat = now;
          }
          const seq = await currentSeq(uid);
          if (seq > lastSeq) {
            const events = await eventsSince(uid, lastSeq);
            for (const ev of events) {
              send(`id: ${ev.id}\nevent: ${ev.type}\ndata: ${JSON.stringify(ev.data)}\n\n`);
              lastSeq = Math.max(lastSeq, ev.id);
              if (ev.type === "message" && ev.data?.id) {
                // Recipient's device has it: mark delivered and tell the sender.
                const res = await Message.updateOne({ _id: ev.data.id, status: "sent" }, { $set: { status: "delivered", deliveredAt: new Date() } });
                if (res.modifiedCount) await publish(ev.data.sender, "message:status", { conversationId: ev.data.conversation, ids: [ev.data.id], status: "delivered" });
              }
            }
            lastSeq = Math.max(lastSeq, seq);
          }
          await new Promise((r) => setTimeout(r, TICK_MS));
        }
      } catch (e) {
        console.error("[stream]", (e as Error).message);
      } finally {
        send(`event: reconnect\ndata: ${JSON.stringify({ after: lastSeq })}\n\n`);
        try {
          controller.close();
        } catch {}
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
});
