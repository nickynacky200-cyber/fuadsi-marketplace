"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, Ban, CheckCircle2, ShieldCheck, ShieldOff, Trash2, XCircle } from "lucide-react";
import { Protected } from "@/components/ui/Protected";
import { Tabs, StatCard } from "@/components/Tabs";
import { useApi, useDebounce } from "@/lib/hooks";
import { api, errorMessage } from "@/lib/api-client";
import { formatNaira, timeAgo } from "@/lib/format";
import { Avatar, EmptyState, ErrorState, Modal, Pagination, Skeleton, StatusChip, VerifiedBadge } from "@/components/ui/primitives";
import { useToast } from "@/components/providers/ToastProvider";
import { ORDER_LABELS, ORDER_STATUSES, OrderStatus } from "@/lib/order-flow";
import { PRODUCT_STATUS_LABEL, PRODUCT_STATUSES, ProductStatus } from "@/lib/constants";
import { CATEGORY_ICON_NAMES } from "@/components/layout/CategoryIcon";

export function AdminDashboard() {
  const sp = useSearchParams();
  const router = useRouter();
  const tab = sp.get("tab") || "overview";
  const stats = useApi<any>("/admin/stats");
  return (
    <Protected admin>
      <div className="container-x py-5 md:py-8">
        <div className="mb-4 flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-brand-600" /><h1 className="text-2xl font-extrabold">Administration</h1></div>
        <Tabs value={tab} onChange={(t) => router.replace(`/admin?tab=${t}`, { scroll: false })} tabs={[
          { id: "overview", label: "Overview" }, { id: "products", label: "Products", badge: stats.data?.pendingProducts || undefined }, { id: "users", label: "Users" },
          { id: "orders", label: "Orders" }, { id: "reports", label: "Reports", badge: stats.data?.openReports || undefined }, { id: "categories", label: "Categories" }, { id: "logs", label: "Audit log" },
        ]} />
        {tab === "overview" && <Overview stats={stats} />}
        {tab === "products" && <Products onChanged={stats.reload} />}
        {tab === "users" && <Users />}
        {tab === "orders" && <Orders />}
        {tab === "reports" && <Reports onChanged={stats.reload} />}
        {tab === "categories" && <Categories />}
        {tab === "logs" && <Logs />}
      </div>
    </Protected>
  );
}

function Overview({ stats }: { stats: ReturnType<typeof useApi<any>> }) {
  if (stats.loading) return <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  if (stats.error) return <ErrorState message={stats.error} onRetry={stats.reload} />;
  const s = stats.data;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total users" value={s.users} /><StatCard label="Total sellers" value={s.sellers} /><StatCard label="Total products" value={s.products} /><StatCard label="Pending products" value={s.pendingProducts} />
        <StatCard label="Total orders" value={s.orders} /><StatCard label="Completed orders" value={s.completedOrders} /><StatCard label="Open reports" value={s.openReports} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4"><h2 className="mb-2 font-bold">Recent admin actions</h2>{s.recent.actions.length ? <ul className="space-y-1.5 text-sm">{s.recent.actions.map((a: any) => <li key={a.id} className="flex justify-between gap-2"><span className="truncate"><b>{a.admin}</b> {a.action}</span><span className="shrink-0 text-xs text-ink-mute">{timeAgo(a.at)}</span></li>)}</ul> : <p className="text-sm text-ink-mute">No actions yet.</p>}</div>
        <div className="card p-4"><h2 className="mb-2 font-bold">Newest users</h2>{s.recent.users.length ? <ul className="space-y-1.5 text-sm">{s.recent.users.map((u: any) => <li key={u.id} className="flex justify-between gap-2"><span className="truncate">{u.name}</span><span className="shrink-0 text-xs text-ink-mute">{timeAgo(u.at)}</span></li>)}</ul> : <p className="text-sm text-ink-mute">No users yet.</p>}</div>
        <div className="card p-4"><h2 className="mb-2 font-bold">Latest orders</h2>{s.recent.orders.length ? <ul className="space-y-1.5 text-sm">{s.recent.orders.map((o: any) => <li key={o.id} className="flex justify-between gap-2"><span className="truncate">{o.orderNumber} &bull; {ORDER_LABELS[o.status as OrderStatus]}</span><span className="shrink-0 text-xs text-ink-mute">{formatNaira(o.total)}</span></li>)}</ul> : <p className="text-sm text-ink-mute">No orders yet.</p>}</div>
      </div>
    </div>
  );
}

const PTONE: Record<ProductStatus, "green" | "amber" | "red" | "gray"> = { APPROVED: "green", PENDING_APPROVAL: "amber", REJECTED: "red", SUSPENDED: "red", SOLD_OUT: "gray" };

function Products({ onChanged }: { onChanged: () => void }) {
  const [status, setStatus] = useState("PENDING_APPROVAL");
  const [q, setQ] = useState(""); const dq = useDebounce(q);
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<{ items: any[]; pages: number; total: number }>(`/admin/products?page=${page}&limit=10${status ? `&status=${status}` : ""}${dq ? `&q=${encodeURIComponent(dq)}` : ""}`);
  const { toast } = useToast();
  const [reasonFor, setReasonFor] = useState<{ p: any; action: "reject" | "suspend" } | null>(null);
  const [reason, setReason] = useState("");

  const act = async (id: string, action: string, why?: string) => {
    try { await api(`/admin/products/${id}`, { method: "PATCH", body: { action, reason: why } }); toast("success", `Listing ${action}d.`.replace("rejectd", "rejected").replace("restored", "restored")); setReasonFor(null); setReason(""); reload(); onChanged(); }
    catch (e) { toast("error", errorMessage(e)); }
  };
  const remove = async (p: any) => {
    if (!confirm(`Permanently remove "${p.title}"?`)) return;
    try { await api(`/admin/products/${p.id}`, { method: "DELETE" }); toast("success", "Listing removed."); reload(); onChanged(); } catch (e) { toast("error", errorMessage(e)); }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status"><option value="">All statuses</option>{PRODUCT_STATUSES.map((s) => <option key={s} value={s}>{PRODUCT_STATUS_LABEL[s]}</option>)}</select>
        <input className="input w-auto flex-1 sm:max-w-xs" placeholder="Search title" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search products" />
      </div>
      {loading ? <Skeleton className="h-56" /> : error ? <ErrorState message={error} onRetry={reload} /> : !data?.items.length ? <EmptyState title="Nothing here" text="No listings match this filter." /> : data.items.map((p) => (
        <article key={p.id} className="card p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex shrink-0 gap-1.5 overflow-x-auto sm:w-48 sm:flex-wrap">{p.images.slice(0, 4).map((u: string) => <a key={u} href={u} target="_blank" rel="noopener noreferrer"><img src={u.replace("/image/upload/", "/image/upload/f_auto,q_auto,w_200,c_fill,h_200/")} alt="" className="h-20 w-20 rounded-lg object-cover" loading="lazy" /></a>)}</div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2"><StatusChip label={PRODUCT_STATUS_LABEL[p.status as ProductStatus]} tone={PTONE[p.status as ProductStatus]} /><span className="text-xs text-ink-mute">{timeAgo(p.createdAt)}</span></div>
              <h3 className="font-bold">{p.title}</h3>
              <p className="text-sm font-extrabold text-brand-700">{formatNaira(p.price)} <span className="font-normal text-ink-soft">&bull; {p.quantity} in stock &bull; {p.condition} &bull; {p.category}</span></p>
              <p className="line-clamp-3 whitespace-pre-line text-sm text-ink-soft">{p.description}</p>
              <p className="text-xs text-ink-mute">Seller: {p.seller?.name} ({p.seller?.email}) {p.store && <>&bull; <Link href={`/store/${p.store.slug}`} className="font-semibold text-brand-600">{p.store.name}</Link></>}</p>
              {p.rejectionReason && <p className="text-xs text-red-700">Reason: {p.rejectionReason}</p>}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-brand-100 pt-3">
            {["PENDING_APPROVAL", "REJECTED"].includes(p.status) && <button className="btn btn-primary btn-sm" onClick={() => act(p.id, "approve")}><CheckCircle2 className="h-4 w-4" />Approve</button>}
            {["PENDING_APPROVAL", "APPROVED", "SOLD_OUT"].includes(p.status) && <button className="btn btn-ghost btn-sm border border-red-200 text-red-600" onClick={() => setReasonFor({ p, action: "reject" })}><XCircle className="h-4 w-4" />Reject</button>}
            {["APPROVED", "SOLD_OUT"].includes(p.status) && <button className="btn btn-ghost btn-sm border border-red-200 text-red-600" onClick={() => setReasonFor({ p, action: "suspend" })}><Ban className="h-4 w-4" />Suspend</button>}
            {p.status === "SUSPENDED" && <button className="btn btn-soft btn-sm" onClick={() => act(p.id, "restore")}>Restore</button>}
            <button className="btn btn-ghost btn-sm text-red-600" onClick={() => remove(p)}><Trash2 className="h-4 w-4" />Remove</button>
          </div>
        </article>
      ))}
      {data && <Pagination page={page} pages={data.pages} onPage={setPage} />}
      <Modal open={!!reasonFor} onClose={() => setReasonFor(null)} title={reasonFor?.action === "reject" ? "Reject listing" : "Suspend listing"}>
        <div className="space-y-3"><p className="text-sm text-ink-soft">The seller will see this reason.</p><textarea className="input min-h-24" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="e.g. Photos don't show the actual item" /><button className="btn btn-danger w-full" disabled={!reason.trim()} onClick={() => reasonFor && act(reasonFor.p.id, reasonFor.action, reason.trim())}>Confirm</button></div>
      </Modal>
    </div>
  );
}

function Users() {
  const [q, setQ] = useState(""); const dq = useDebounce(q);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<{ items: any[]; pages: number }>(`/admin/users?page=${page}&limit=15${filter ? `&filter=${filter}` : ""}${dq ? `&q=${encodeURIComponent(dq)}` : ""}`);
  const { toast } = useToast();
  const act = async (id: string, action: string, reason?: string) => {
    try { await api(`/admin/users/${id}`, { method: "PATCH", body: { action, reason } }); toast("success", "Done."); reload(); } catch (e) { toast("error", errorMessage(e)); }
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input className="input w-auto flex-1 sm:max-w-xs" placeholder="Search name, email or username" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search users" />
        <select className="input w-auto" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} aria-label="Filter users"><option value="">All users</option><option value="sellers">Sellers</option><option value="verified">Verified</option><option value="suspended">Suspended</option><option value="admins">Admins</option></select>
      </div>
      {loading ? <Skeleton className="h-56" /> : error ? <ErrorState message={error} onRetry={reload} /> : !data?.items.length ? <EmptyState title="No users found" /> : (
        <div className="card divide-y divide-brand-100 overflow-hidden">
          {data.items.map((u) => (
            <div key={u.id} className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3"><Avatar src={u.photoUrl} name={u.name} size={40} /><div className="min-w-0"><p className="flex items-center gap-1 truncate text-sm font-bold">{u.name || "(no name)"}{u.verified && <VerifiedBadge />}{u.role === "admin" && <StatusChip label="Admin" tone="purple" />}{u.suspended && <StatusChip label="Suspended" tone="red" />}{u.isSeller && <StatusChip label="Seller" tone="green" />}</p><p className="truncate text-xs text-ink-soft">{u.email}{u.username ? ` \u2022 @${u.username}` : ""}</p></div></div>
              <div className="flex flex-wrap gap-1.5">
                <button className="btn btn-soft btn-sm" onClick={() => act(u.id, u.verified ? "unverify" : "verify")}><BadgeCheck className="h-3.5 w-3.5" />{u.verified ? "Remove badge" : "Verify"}</button>
                {u.suspended ? <button className="btn btn-soft btn-sm" onClick={() => act(u.id, "restore")}>Restore</button> : u.role !== "admin" && <button className="btn btn-ghost btn-sm border border-red-200 text-red-600" onClick={() => { const r = prompt("Reason for suspending this account?"); if (r) act(u.id, "suspend", r); }}><Ban className="h-3.5 w-3.5" />Suspend</button>}
                {u.role === "admin" ? <button className="btn btn-ghost btn-sm border border-brand-100" onClick={() => confirm("Remove admin role?") && act(u.id, "remove_admin")}><ShieldOff className="h-3.5 w-3.5" />Remove admin</button> : <button className="btn btn-ghost btn-sm border border-brand-100" onClick={() => confirm(`Make ${u.name || u.email} an administrator?`) && act(u.id, "make_admin")}><ShieldCheck className="h-3.5 w-3.5" />Make admin</button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {data && <Pagination page={page} pages={data.pages} onPage={setPage} />}
    </div>
  );
}

function Orders() {
  const [status, setStatus] = useState(""); const [q, setQ] = useState(""); const dq = useDebounce(q); const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<{ items: any[]; pages: number }>(`/admin/orders?page=${page}&limit=15${status ? `&status=${status}` : ""}${dq ? `&q=${encodeURIComponent(dq)}` : ""}`);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2"><input className="input w-auto flex-1 sm:max-w-xs" placeholder="Exact order number (FM-...)" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Order number" /><select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status"><option value="">All statuses</option>{ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_LABELS[s]}</option>)}</select></div>
      {loading ? <Skeleton className="h-56" /> : error ? <ErrorState message={error} onRetry={reload} /> : !data?.items.length ? <EmptyState title="No orders found" /> : data.items.map((o) => (
        <article key={o.id} className="card p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2"><b>{o.orderNumber}</b><StatusChip label={ORDER_LABELS[o.status as OrderStatus]} tone={o.status === "completed" ? "green" : o.status === "rejected" || o.status === "cancelled" ? "gray" : "amber"} /></div>
          <p className="mt-1 text-ink-soft">{o.items.join(", ")} &bull; <b className="text-brand-700">{formatNaira(o.total)}</b></p>
          <p className="mt-1 text-xs text-ink-mute">Buyer: {o.buyer?.name} ({o.buyer?.email}) &bull; Seller: {o.seller?.name} ({o.seller?.email}) &bull; {timeAgo(o.createdAt)}</p>
          <details className="mt-2 text-xs text-ink-soft"><summary className="cursor-pointer font-semibold text-brand-600">Status history</summary><ul className="mt-1 space-y-0.5">{o.history.map((h: any, i: number) => <li key={i}>{ORDER_LABELS[h.status as OrderStatus] || h.status} &bull; {new Date(h.at).toLocaleString("en-NG")}{h.note ? ` \u2022 ${h.note}` : ""}</li>)}</ul></details>
        </article>
      ))}
      {data && <Pagination page={page} pages={data.pages} onPage={setPage} />}
    </div>
  );
}

function Reports({ onChanged }: { onChanged: () => void }) {
  const [status, setStatus] = useState("open"); const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<{ items: any[]; pages: number }>(`/admin/reports?page=${page}&limit=10${status ? `&status=${status}` : ""}`);
  const { toast } = useToast();
  const resolve = async (r: any, st: string, action = "none") => {
    const resolution = st === "reviewing" ? "" : prompt("Resolution note (visible to admins only)") ?? null;
    if (resolution === null) return;
    try { await api(`/admin/reports/${r.id}`, { method: "PATCH", body: { status: st, resolution, action } }); toast("success", "Report updated."); reload(); onChanged(); } catch (e) { toast("error", errorMessage(e)); }
  };
  return (
    <div className="space-y-3">
      <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status"><option value="">All</option><option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select>
      {loading ? <Skeleton className="h-48" /> : error ? <ErrorState message={error} onRetry={reload} /> : !data?.items.length ? <EmptyState title="No reports" text="Nothing needs moderation right now." /> : data.items.map((r) => (
        <article key={r.id} className="card p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2"><StatusChip label={r.status} tone={r.status === "open" ? "amber" : r.status === "resolved" ? "green" : "gray"} /><StatusChip label={r.targetType} tone="purple" /><StatusChip label={r.reason} tone="red" /><span className="text-xs text-ink-mute">{timeAgo(r.createdAt)}</span></div>
          <p className="mt-2 font-bold">{r.targetInfo.label} <span className="font-normal text-ink-mute">({r.targetInfo.state})</span></p>
          {r.details && <p className="mt-1 text-ink-soft">&ldquo;{r.details}&rdquo;</p>}
          <p className="mt-1 text-xs text-ink-mute">Reported by {r.reporter?.name} ({r.reporter?.email}){r.resolution ? ` \u2022 Resolution: ${r.resolution}` : ""}</p>
          {["open", "reviewing"].includes(r.status) && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-brand-100 pt-3">
              {r.status === "open" && <button className="btn btn-soft btn-sm" onClick={() => resolve(r, "reviewing")}>Start review</button>}
              {r.targetType === "product" && <button className="btn btn-ghost btn-sm border border-red-200 text-red-600" onClick={() => resolve(r, "resolved", "suspend_product")}>Suspend product</button>}
              {r.targetType === "user" && <button className="btn btn-ghost btn-sm border border-red-200 text-red-600" onClick={() => resolve(r, "resolved", "suspend_user")}>Suspend user</button>}
              <button className="btn btn-primary btn-sm" onClick={() => resolve(r, "resolved")}>Mark resolved</button>
              <button className="btn btn-ghost btn-sm" onClick={() => resolve(r, "dismissed")}>Dismiss</button>
            </div>
          )}
        </article>
      ))}
      {data && <Pagination page={page} pages={data.pages} onPage={setPage} />}
    </div>
  );
}

function Categories() {
  const { data, loading, error, reload } = useApi<{ items: any[] }>("/admin/categories");
  const { toast } = useToast();
  const [name, setName] = useState(""); const [icon, setIcon] = useState("MoreHorizontal");
  const run = async (fn: () => Promise<any>, ok: string) => { try { await fn(); toast("success", ok); reload(); } catch (e) { toast("error", errorMessage(e)); } };
  return (
    <div className="space-y-4">
      <form className="card flex flex-wrap items-end gap-3 p-4" onSubmit={(e) => { e.preventDefault(); run(() => api("/admin/categories", { method: "POST", body: { name, icon } }), "Category added.").then(() => setName("")); }}>
        <div className="min-w-48 flex-1"><label className="label" htmlFor="cn">New category</label><input id="cn" className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} /></div>
        <div><label className="label" htmlFor="ci">Icon</label><select id="ci" className="input" value={icon} onChange={(e) => setIcon(e.target.value)}>{CATEGORY_ICON_NAMES.map((n) => <option key={n}>{n}</option>)}</select></div>
        <button className="btn btn-primary">Add</button>
      </form>
      {loading ? <Skeleton className="h-48" /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <div className="card divide-y divide-brand-100 overflow-hidden">
          {data?.items.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
              <span className="min-w-0 flex-1 font-semibold">{c.name} <span className="font-normal text-ink-mute">({c.products} products)</span>{!c.active && <StatusChip label="Hidden" tone="gray" />}</span>
              <button className="btn btn-soft btn-sm" onClick={() => { const n = prompt("Rename category", c.name); if (n && n.trim().length > 1) run(() => api(`/admin/categories/${c.id}`, { method: "PATCH", body: { name: n.trim() } }), "Renamed."); }}>Rename</button>
              <button className="btn btn-ghost btn-sm border border-brand-100" onClick={() => run(() => api(`/admin/categories/${c.id}`, { method: "PATCH", body: { active: !c.active } }), c.active ? "Hidden." : "Shown.")}>{c.active ? "Hide" : "Show"}</button>
              <button className="btn btn-ghost btn-sm text-red-600" onClick={() => confirm(`Delete ${c.name}?`) && run(() => api(`/admin/categories/${c.id}`, { method: "DELETE" }), "Deleted.")}><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Logs() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<{ items: any[]; pages: number }>(`/admin/logs?page=${page}`);
  if (loading) return <Skeleton className="h-48" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data?.items.length) return <EmptyState title="No admin actions recorded yet" />;
  return (
    <>
      <div className="card divide-y divide-brand-100 overflow-hidden text-sm">{data.items.map((l) => <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 p-3"><span><b>{l.admin}</b> &bull; {l.action} &bull; <span className="text-ink-soft">{l.targetType} {l.targetId.slice(-6)}</span></span><span className="text-xs text-ink-mute">{new Date(l.at).toLocaleString("en-NG")}</span></div>)}</div>
      <Pagination page={page} pages={data.pages} onPage={setPage} />
    </>
  );
}
