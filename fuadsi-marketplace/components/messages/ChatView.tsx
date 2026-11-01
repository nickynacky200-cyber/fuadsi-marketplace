"use client";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CheckCheck, ImagePlus, Loader2, RotateCcw, Send, Store } from "lucide-react";
import clsx from "clsx";
import { api, errorMessage } from "@/lib/api-client";
import { useApi } from "@/lib/hooks";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRealtime } from "@/components/providers/RealtimeProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Avatar, ErrorState, Spinner, VerifiedBadge } from "@/components/ui/primitives";
import { formatClock, formatNaira, lastSeenText } from "@/lib/format";
import { LIMITS } from "@/lib/constants";
import { cdn, uploadImage, validateImage } from "@/lib/upload";
import { ReportButton } from "@/components/ReportButton";

type Msg = {
  id: string; conversation: string; sender: string; text: string; image: { url: string } | null;
  product: { id: string; title: string; price: number; image: string } | null; status: "sent" | "delivered" | "read"; createdAt: string; clientId: string | null;
  pending?: boolean; failed?: boolean;
};

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}-xxxxxxxx`);

function merge(prev: Msg[], incoming: Msg[]): Msg[] {
  const map = new Map<string, Msg>();
  prev.forEach((m) => map.set(m.clientId || m.id, m));
  incoming.forEach((m) => map.set(m.clientId || m.id, { ...map.get(m.clientId || m.id), ...m, pending: false, failed: false }));
  return Array.from(map.values()).sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
}

function Ticks({ status }: { status: Msg["status"] }) {
  if (status === "sent") return <Check className="h-3.5 w-3.5" aria-label="Sent" />;
  return <CheckCheck className={clsx("h-3.5 w-3.5", status === "read" && "text-leaf-400")} aria-label={status === "read" ? "Read" : "Delivered"} />;
}

export function ChatView({ id }: { id: string }) {
  const { me } = useAuth();
  const { subscribe, refreshCounts, connected } = useRealtime();
  const { toast } = useToast();
  const router = useRouter();
  const info = useApi<any>(`/conversations/${id}`);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [presence, setPresence] = useState<{ online: boolean; lastSeen: string | null } | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastTypingSent = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const otherId: string | undefined = info.data?.other?.id;

  const markRead = useCallback(() => {
    if (document.hidden) return;
    api(`/conversations/${id}/read`, { method: "POST" }).then(refreshCounts).catch(() => {});
  }, [id, refreshCounts]);

  const loadLatest = useCallback(async () => {
    try {
      const r = await api<{ items: Msg[]; hasMore: boolean }>(`/conversations/${id}/messages?limit=30`);
      setMsgs((p) => merge(p, r.items));
      setHasMore((h) => h || r.hasMore);
      setLoadError("");
      markRead();
    } catch (e) {
      setLoadError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id, markRead]);

  useEffect(() => { setMsgs([]); setLoading(true); stick.current = true; loadLatest(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // missed events after a reconnect: refetch the newest page
  const wasConnected = useRef(connected);
  useEffect(() => { if (connected && !wasConnected.current) loadLatest(); wasConnected.current = connected; }, [connected, loadLatest]);

  useEffect(() => {
    const offMsg = subscribe("message", (m: Msg) => {
      if (m.conversation !== id) return;
      stick.current = true;
      setMsgs((p) => merge(p, [m]));
      setTyping(false);
      markRead();
    });
    const offStatus = subscribe("message:status", (d: any) => {
      if (d.conversationId !== id) return;
      setMsgs((p) => p.map((m) => {
        if (m.sender !== me?.id) return m;
        if (d.status === "read" && (!d.upTo || +new Date(m.createdAt) <= +new Date(d.upTo))) return { ...m, status: "read" };
        if (d.status === "delivered" && d.ids?.includes(m.id) && m.status === "sent") return { ...m, status: "delivered" };
        return m;
      }));
    });
    const offTyping = subscribe("typing", (d: any) => {
      if (d.conversationId !== id) return;
      setTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 4000);
    });
    const onVis = () => !document.hidden && markRead();
    document.addEventListener("visibilitychange", onVis);
    return () => { offMsg(); offStatus(); offTyping(); document.removeEventListener("visibilitychange", onVis); clearTimeout(typingTimer.current); };
  }, [subscribe, id, me?.id, markRead]);

  // presence (online / last seen) refreshed while the chat is open
  useEffect(() => {
    if (!otherId) return;
    let stop = false;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const r = await api<{ online: Record<string, boolean>; lastSeen: Record<string, string> }>(`/presence?ids=${otherId}`);
        if (!stop) setPresence({ online: !!r.online[otherId], lastSeen: r.lastSeen[otherId] || null });
      } catch { /* ignore */ }
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => { stop = true; clearInterval(t); };
  }, [otherId]);

  useLayoutEffect(() => { if (stick.current) bottom.current?.scrollIntoView({ block: "end" }); }, [msgs.length, typing]);

  const loadEarlier = async () => {
    const first = msgs.find((m) => !m.pending);
    if (!first) return;
    stick.current = false;
    try {
      const r = await api<{ items: Msg[]; hasMore: boolean }>(`/conversations/${id}/messages?limit=30&before=${first.id}`);
      setMsgs((p) => merge(p, r.items));
      setHasMore(r.hasMore);
    } catch (e) { toast("error", errorMessage(e)); }
  };

  const post = async (draft: Msg, payload: any) => {
    try {
      const r = await api<{ message: Msg }>(`/conversations/${id}/messages`, { method: "POST", body: payload });
      setMsgs((p) => merge(p, [r.message]));
    } catch (e) {
      setMsgs((p) => p.map((m) => (m.clientId === draft.clientId ? { ...m, pending: false, failed: true } : m)));
      toast("error", errorMessage(e));
    }
  };

  const send = async (extra: { image?: { url: string; publicId: string }; productId?: string; text?: string } = {}) => {
    const body = (extra.text ?? text).trim();
    if (!body && !extra.image && !extra.productId) return;
    const clientId = uid();
    const draft: Msg = { id: `tmp-${clientId}`, clientId, conversation: id, sender: me!.id, text: body, image: extra.image ? { url: extra.image.url } : null, product: null, status: "sent", createdAt: new Date().toISOString(), pending: true };
    stick.current = true;
    setMsgs((p) => merge(p, [draft]));
    if (extra.text === undefined) setText("");
    await post(draft, { text: body, image: extra.image, productId: extra.productId, clientId });
  };

  const retry = (m: Msg) => {
    setMsgs((p) => p.map((x) => (x.clientId === m.clientId ? { ...x, pending: true, failed: false } : x)));
    post(m, { text: m.text, clientId: m.clientId });
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    const bad = validateImage(f);
    if (bad) return toast("error", bad);
    setUploading(true);
    try {
      const img = await uploadImage(f, "chat");
      await send({ image: { url: img.url, publicId: img.publicId }, text: "" });
    } catch (e) { toast("error", errorMessage(e)); } finally { setUploading(false); if (fileInput.current) fileInput.current.value = ""; }
  };

  const onType = (v: string) => {
    setText(v);
    if (v && Date.now() - lastTypingSent.current > 2500) {
      lastTypingSent.current = Date.now();
      api(`/conversations/${id}/typing`, { method: "POST" }).catch(() => {});
    }
  };

  if (info.error) return <div className="p-6"><ErrorState message={info.error === "Conversation not found." ? "That conversation doesn't exist or you don't have access to it." : info.error} onRetry={() => router.push("/messages")} /></div>;
  const other = info.data?.other;
  const product = info.data?.product;
  const status = typing ? "typing..." : lastSeenText(presence?.lastSeen ?? other?.lastSeenAt, presence?.online ?? other?.online);
  const online = typing || presence?.online || other?.online;

  return (
    <section className="flex h-[100dvh] flex-col bg-white max-md:fixed max-md:inset-0 max-md:z-[60] md:h-full" aria-label="Conversation">
      <header className="flex items-center gap-3 border-b border-brand-100 bg-white px-3 py-2.5">
        <Link href="/messages" className="rounded-full p-2 hover:bg-brand-50 md:hidden" aria-label="Back to conversations"><ArrowLeft className="h-5 w-5" /></Link>
        {other ? (
          <>
            <div className="relative"><Avatar src={other.photoUrl} name={other.name} size={42} />{online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-leaf-500" />}</div>
            <div className="min-w-0 flex-1"><p className="flex items-center gap-1 truncate text-sm font-bold">{other.name}{other.verified && <VerifiedBadge className="h-3.5 w-3.5" />}</p><p className={clsx("truncate text-xs", online ? "font-semibold text-leaf-700" : "text-ink-mute")} aria-live="polite">{status}</p></div>
            {other.isSeller && other.username && <Link href={`/store/${other.username}`} className="btn btn-soft btn-sm"><Store className="h-3.5 w-3.5" /><span className="max-sm:hidden">Store</span></Link>}
            <ReportButton targetType="user" target={other.id} className="rounded-full p-2 text-xs text-ink-mute hover:bg-brand-50" />
          </>
        ) : <div className="skeleton h-10 flex-1" />}
      </header>

      {product && (
        <div className="flex items-center gap-3 border-b border-brand-100 bg-lav/70 px-3 py-2">
          <Link href={`/product/${product.id}`} className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white">{product.image && <img src={cdn(product.image, 120)} alt="" className="h-full w-full object-cover" />}</Link>
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{product.title}</p><p className="text-xs font-extrabold text-brand-700">{formatNaira(product.price)}</p></div>
          <button className="btn btn-outline btn-sm" onClick={() => send({ productId: product.id, text: "" })}>Share in chat</button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto bg-lav/40 px-3 py-4" onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120; }}>
        {hasMore && <div className="mb-3 text-center"><button onClick={loadEarlier} className="btn btn-soft btn-sm">Load earlier messages</button></div>}
        {loading ? <div className="flex justify-center py-10"><Spinner /></div> : loadError && !msgs.length ? <ErrorState message={loadError} onRetry={loadLatest} /> : msgs.length === 0 ? (
          <p className="mx-auto mt-10 max-w-xs rounded-2xl bg-white p-4 text-center text-sm text-ink-soft shadow-card">Say hello to {other?.name?.split(" ")[0] || "the seller"}. Ask about condition, price or where to meet. Pay only after you&apos;ve seen the item.</p>
        ) : (
          <ul className="space-y-1.5">
            {msgs.map((m, i) => {
              const mine = m.sender === me?.id;
              const prev = msgs[i - 1];
              const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
              return (
                <li key={m.clientId || m.id}>
                  {newDay && <p className="my-3 text-center text-[11px] font-semibold text-ink-mute">{new Date(m.createdAt).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })}</p>}
                  <div className={clsx("flex", mine ? "justify-end" : "justify-start")}>
                    <div className={clsx("max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm md:max-w-[70%]", mine ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-white text-ink", m.failed && "opacity-70 ring-2 ring-red-400")}>
                      {m.product && <Link href={`/product/${m.product.id}`} className={clsx("mb-1.5 flex items-center gap-2 rounded-xl p-1.5", mine ? "bg-white/15" : "bg-lav")}><span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white">{m.product.image && <img src={cdn(m.product.image, 120)} alt="" className="h-full w-full object-cover" />}</span><span className="min-w-0"><span className="block truncate text-xs font-bold">{m.product.title}</span><span className="block text-xs font-extrabold">{formatNaira(m.product.price)}</span></span></Link>}
                      {m.image && <a href={m.image.url} target="_blank" rel="noopener noreferrer"><img src={cdn(m.image.url, 480)} alt="Shared photo" className="mb-1 max-h-72 rounded-xl object-cover" loading="lazy" /></a>}
                      {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                      <p className={clsx("mt-0.5 flex items-center justify-end gap-1 text-[10px]", mine ? "text-white/75" : "text-ink-mute")}>
                        {formatClock(m.createdAt)}
                        {mine && (m.pending ? <Loader2 className="h-3 w-3 animate-spin" aria-label="Sending" /> : m.failed ? null : <Ticks status={m.status} />)}
                      </p>
                      {m.failed && <button onClick={() => retry(m)} className="mt-1 flex items-center gap-1 text-[11px] font-bold text-red-100 underline"><RotateCcw className="h-3 w-3" />Not sent. Tap to retry</button>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {typing && <p className="mt-2 text-xs italic text-ink-mute">{other?.name?.split(" ")[0]} is typing...</p>}
        <div ref={bottom} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="pb-safe flex items-end gap-2 border-t border-brand-100 bg-white p-2.5">
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className="rounded-full p-2.5 text-brand-600 hover:bg-brand-50" aria-label="Send a photo">{uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}</button>
        <textarea value={text} onChange={(e) => onType(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(min-width: 768px)").matches) { e.preventDefault(); send(); } }} rows={1} maxLength={LIMITS.maxMessageLength} placeholder="Type a message" aria-label="Message" className="max-h-32 min-h-[42px] flex-1 resize-none rounded-2xl border border-brand-100 bg-lav/60 px-3.5 py-2.5 text-sm outline-none focus:border-brand-600 focus:bg-white" />
        <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40" disabled={!text.trim()} aria-label="Send"><Send className="h-4.5 w-4.5" /></button>
      </form>
    </section>
  );
}
