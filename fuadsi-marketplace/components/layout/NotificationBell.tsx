"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { api } from "@/lib/api-client";
import { timeAgo } from "@/lib/format";
import { useRealtime } from "@/components/providers/RealtimeProvider";
import { Spinner } from "@/components/ui/primitives";
import clsx from "clsx";

type N = { id: string; title: string; body: string; link: string; read: boolean; createdAt: string };

export function NotificationBell({ label = true }: { label?: boolean }) {
  const { counts, refreshCounts } = useRealtime();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<N[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    setItems(null);
    api<{ items: N[] }>("/notifications?limit=8").then((r) => setItems(r.items)).catch(() => setItems([]));
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const markAll = async () => {
    await api("/notifications", { method: "PATCH", body: { all: true } });
    setItems((s) => s && s.map((n) => ({ ...n, read: true })));
    refreshCounts();
  };
  const openItem = async (n: N) => {
    setOpen(false);
    if (!n.read) api(`/notifications/${n.id}`, { method: "PATCH" }).then(refreshCounts).catch(() => {});
    if (n.link) router.push(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm font-medium hover:bg-brand-50" aria-label={`Notifications${counts.notifications ? `, ${counts.notifications} unread` : ""}`} aria-expanded={open}>
        <Bell className="h-5 w-5" />
        {label && <span className="hidden xl:inline">Notifications</span>}
        {counts.notifications > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{counts.notifications > 99 ? "99+" : counts.notifications}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,360px)] animate-pop overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-pop">
          <div className="flex items-center justify-between border-b border-brand-100 px-4 py-3">
            <h3 className="text-sm font-bold">Notifications</h3>
            <button onClick={markAll} disabled={!counts.notifications} className="flex items-center gap-1 text-xs font-semibold text-brand-600 disabled:opacity-40"><CheckCheck className="h-3.5 w-3.5" />Mark all as read</button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items === null ? <div className="flex justify-center py-8"><Spinner /></div> : items.length === 0 ? <p className="px-4 py-8 text-center text-sm text-ink-soft">You're all caught up.</p> : items.map((n) => (
              <button key={n.id} onClick={() => openItem(n)} className={clsx("block w-full border-b border-brand-50 px-4 py-3 text-left hover:bg-lav", !n.read && "bg-brand-50/50")}>
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{n.title}</p>{n.body && <p className="line-clamp-2 text-xs text-ink-soft">{n.body}</p>}<p className="mt-0.5 text-[11px] text-ink-mute">{timeAgo(n.createdAt)}</p></div>
                </div>
              </button>
            ))}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className="block border-t border-brand-100 px-4 py-2.5 text-center text-sm font-semibold text-brand-600 hover:bg-lav">View all notifications</Link>
        </div>
      )}
    </div>
  );
}
