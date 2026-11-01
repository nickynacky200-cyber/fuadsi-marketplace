"use client";
import Link from "next/link";
import { useState } from "react";
import { CheckCheck } from "lucide-react";
import clsx from "clsx";
import { Protected } from "@/components/ui/Protected";
import { useApi } from "@/lib/hooks";
import { api } from "@/lib/api-client";
import { timeAgo } from "@/lib/format";
import { EmptyState, ErrorState, Pagination, Skeleton } from "@/components/ui/primitives";
import { useRealtime } from "@/components/providers/RealtimeProvider";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<{ items: any[]; pages: number; unread: number }>(`/notifications?page=${page}&limit=20`);
  const { refreshCounts } = useRealtime();
  const router = useRouter();
  const markAll = async () => { await api("/notifications", { method: "PATCH", body: { all: true } }); reload(); refreshCounts(); };
  const open = async (n: any) => {
    if (!n.read) await api(`/notifications/${n.id}`, { method: "PATCH" }).catch(() => {});
    refreshCounts();
    if (n.link) router.push(n.link); else reload();
  };
  return (
    <Protected>
      <div className="container-x max-w-2xl py-5 md:py-8">
        <div className="mb-4 flex items-center justify-between"><h1 className="text-2xl font-extrabold">Notifications</h1><button onClick={markAll} disabled={!data?.unread} className="btn btn-soft btn-sm"><CheckCheck className="h-4 w-4" />Mark all as read</button></div>
        {loading ? <div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div> : error ? <ErrorState message={error} onRetry={reload} /> : !data?.items.length ? <EmptyState title="No notifications yet" text="Messages, orders and listing updates will show up here." action={<Link href="/shop" className="btn btn-primary btn-sm">Browse products</Link>} /> : (
          <>
            <ul className="card divide-y divide-brand-100 overflow-hidden">
              {data.items.map((n) => (
                <li key={n.id}>
                  <button onClick={() => open(n)} className={clsx("flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-lav", !n.read && "bg-brand-50/60")}>
                    <span className={clsx("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-brand-600")} />
                    <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{n.title}</span>{n.body && <span className="mt-0.5 block text-sm text-ink-soft">{n.body}</span>}<span className="mt-1 block text-xs text-ink-mute">{timeAgo(n.createdAt)}</span></span>
                  </button>
                </li>
              ))}
            </ul>
            <Pagination page={page} pages={data.pages} onPage={setPage} />
          </>
        )}
      </div>
    </Protected>
  );
}
