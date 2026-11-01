"use client";
import Link from "next/link";
import { useEffect } from "react";
import clsx from "clsx";
import { Image as ImageIcon, MessageCircle } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { useRealtime } from "@/components/providers/RealtimeProvider";
import { Avatar, EmptyState, ErrorState, Skeleton, VerifiedBadge } from "@/components/ui/primitives";
import { timeAgo } from "@/lib/format";

export function ConversationList({ activeId }: { activeId?: string }) {
  const { data, loading, error, reload } = useApi<{ items: any[] }>("/conversations");
  const { subscribe, connected } = useRealtime();

  useEffect(() => {
    const offs = [subscribe("message", reload), subscribe("message:status", reload)];
    const t = setInterval(() => !document.hidden && reload(), connected ? 45000 : 15000); // slow safety refresh
    return () => { offs.forEach((o) => o()); clearInterval(t); };
  }, [subscribe, reload, connected]);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-brand-100 px-4 py-3.5"><h1 className="text-xl font-extrabold">Messages</h1></div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && !data ? <div className="space-y-2 p-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          : error && !data ? <div className="p-4"><ErrorState message={error} onRetry={reload} /></div>
          : !data?.items.length ? <div className="p-4"><EmptyState image="chat" title="No conversations yet" text="Tap Chat Seller on any product to start talking to a seller." action={<Link href="/shop" className="btn btn-primary btn-sm">Browse products</Link>} /></div>
          : data.items.map((c) => (
            <Link key={c.id} href={`/messages/${c.id}`} className={clsx("flex items-center gap-3 border-b border-brand-50 px-4 py-3 transition hover:bg-lav", activeId === c.id && "bg-brand-50")}>
              <div className="relative">
                <Avatar src={c.other.photoUrl} name={c.other.name} size={48} />
                {c.other.online && <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-leaf-500" aria-label="Online" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2"><p className="flex min-w-0 items-center gap-1 truncate text-sm font-bold">{c.other.name}{c.other.verified && <VerifiedBadge className="h-3.5 w-3.5" />}</p><span className="shrink-0 text-[11px] text-ink-mute">{c.lastMessage ? timeAgo(c.lastMessageAt) : ""}</span></div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className={clsx("flex min-w-0 items-center gap-1 truncate text-xs", c.unread ? "font-semibold text-ink" : "text-ink-soft")}>
                    {c.lastMessage ? <>{c.lastMessage.mine && "You: "}{c.lastMessage.hasImage && <ImageIcon className="h-3.5 w-3.5 shrink-0" />}<span className="truncate">{c.lastMessage.text}</span></> : <span className="italic text-ink-mute">No messages yet</span>}
                  </p>
                  {c.unread > 0 && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}
                </div>
                {c.product && <p className="mt-0.5 truncate text-[11px] text-brand-600">About: {c.product.title}</p>}
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}

export function EmptyPane() {
  return (
    <div className="hidden h-full flex-col items-center justify-center bg-lav/50 p-8 text-center md:flex">
      <MessageCircle className="mb-3 h-10 w-10 text-brand-300" />
      <p className="font-bold">Select a conversation</p>
      <p className="mt-1 max-w-xs text-sm text-ink-soft">Messages are delivered in real time. Keep conversations on FUADSI Marketplace and pay only when you have seen the item.</p>
    </div>
  );
}
