"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { Protected } from "@/components/ui/Protected";
import { Tabs, StatCard } from "@/components/Tabs";
import { StoreForm } from "@/components/StoreForm";
import { OrderCard } from "@/components/OrderCard";
import { useApi } from "@/lib/hooks";
import { api, errorMessage } from "@/lib/api-client";
import { formatNaira } from "@/lib/format";
import { cdn } from "@/lib/upload";
import { PRODUCT_STATUS_LABEL, ProductStatus } from "@/lib/constants";
import { EmptyState, ErrorState, Pagination, Skeleton, StatusChip } from "@/components/ui/primitives";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";

const TONE: Record<ProductStatus, "green" | "amber" | "red" | "gray"> = { APPROVED: "green", PENDING_APPROVAL: "amber", REJECTED: "red", SUSPENDED: "red", SOLD_OUT: "gray" };

export function SellerDashboard() {
  const sp = useSearchParams();
  const router = useRouter();
  const { me, store } = useAuth();
  const tab = sp.get("tab") || "overview";
  const setTab = (t: string) => router.replace(`/dashboard/seller?tab=${t}`, { scroll: false });
  const stats = useApi<any>(me?.isSeller ? "/seller/stats" : null);

  return (
    <Protected>
      <div className="container-x py-5 md:py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-extrabold">Seller dashboard</h1>{store && <Link href={`/store/${store.slug}`} className="text-sm font-semibold text-brand-600">{store.name} &rarr; view storefront</Link>}</div>
          {me?.isSeller && <Link href="/dashboard/seller/products/new" className="btn btn-primary"><Plus className="h-4 w-4" />Add product</Link>}
        </div>
        {!me?.isSeller ? (
          <EmptyState title="You don't have a store yet" text="Open your free store to start listing products." action={<Link href="/sell" className="btn btn-primary">Open my store</Link>} />
        ) : (
          <>
            <Tabs value={tab} onChange={setTab} tabs={[{ id: "overview", label: "Overview" }, { id: "products", label: "Products", badge: stats.data?.pendingApproval ? undefined : undefined }, { id: "orders", label: "Orders", badge: stats.data?.pendingOrders || undefined }, { id: "store", label: "Store settings" }]} />
            {tab === "overview" && <Overview stats={stats} />}
            {tab === "products" && <ProductsTab onChanged={stats.reload} />}
            {tab === "orders" && <OrdersTab onChanged={stats.reload} />}
            {tab === "store" && <div className="card max-w-xl p-5"><StoreForm /></div>}
          </>
        )}
      </div>
    </Protected>
  );
}

function Overview({ stats }: { stats: ReturnType<typeof useApi<any>> }) {
  if (stats.loading) return <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  if (stats.error) return <ErrorState message={stats.error} onRetry={stats.reload} />;
  const s = stats.data;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total products" value={s.totalProducts} />
        <StatCard label="Active listings" value={s.activeListings} hint="Live on the marketplace" />
        <StatCard label="Pending approval" value={s.pendingApproval} hint="Waiting for an admin" />
        <StatCard label="Total orders" value={s.totalOrders} />
        <StatCard label="Completed orders" value={s.completedOrders} />
      </div>
      {s.rejected > 0 && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{s.rejected} listing(s) were rejected. Open Products to see the reason and fix them.</p>}
      {s.pendingOrders > 0 && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">You have {s.pendingOrders} order request(s) waiting for your response.</p>}
    </div>
  );
}

function ProductsTab({ onChanged }: { onChanged: () => void }) {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<{ items: any[]; pages: number }>(`/seller/products?page=${page}&limit=10`);
  const { toast } = useToast();
  const refresh = () => { reload(); onChanged(); };

  const patch = async (id: string, body: any, msg: string) => {
    try { await api(`/products/${id}`, { method: "PATCH", body }); toast("success", msg); refresh(); } catch (e) { toast("error", errorMessage(e)); }
  };
  const remove = async (p: any) => {
    if (!confirm(`Delete "${p.title}"? This can't be undone.`)) return;
    try { await api(`/products/${p.id}`, { method: "DELETE" }); toast("success", "Product deleted."); refresh(); } catch (e) { toast("error", errorMessage(e)); }
  };
  const quick = (p: any, field: "price" | "quantity") => {
    const v = prompt(field === "price" ? "New price (NGN)" : "New quantity in stock", String(p[field]));
    if (v === null) return;
    const n = parseInt(v.replace(/\D/g, ""), 10);
    if (Number.isNaN(n)) return toast("error", "Enter a number.");
    patch(p.id, { [field]: n }, field === "price" ? "Price updated." : "Stock updated.");
  };

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data?.items.length) return <EmptyState title="No products yet" text="List your first item. It goes live after an administrator approves it." action={<Link href="/dashboard/seller/products/new" className="btn btn-primary">Add product</Link>} />;

  return (
    <div className="space-y-3">
      {data.items.map((p) => (
        <article key={p.id} className="card flex gap-3 p-3">
          <Link href={`/product/${p.id}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-lav">{p.image && <Image src={cdn(p.image, 200)} alt="" fill sizes="96px" className="object-cover" unoptimized />}</Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><StatusChip label={PRODUCT_STATUS_LABEL[p.status as ProductStatus]} tone={TONE[p.status as ProductStatus]} />{!p.isAvailable && <StatusChip label="Hidden" tone="gray" />}</div>
            <p className="mt-1 truncate font-bold">{p.title}</p>
            <p className="text-sm text-ink-soft"><button className="font-extrabold text-brand-700 underline decoration-dotted" onClick={() => quick(p, "price")}>{formatNaira(p.price)}</button> &bull; <button className="underline decoration-dotted" onClick={() => quick(p, "quantity")}>{p.quantity} in stock</button></p>
            {(p.status === "REJECTED" || p.status === "SUSPENDED") && p.rejectionReason && <p className="mt-1 text-xs text-red-700">Reason: {p.rejectionReason}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Link href={`/dashboard/seller/products/${p.id}/edit`} className="btn btn-soft btn-sm"><Pencil className="h-3.5 w-3.5" />Edit</Link>
              <button className="btn btn-ghost btn-sm border border-brand-100" onClick={() => patch(p.id, { isAvailable: !p.isAvailable }, p.isAvailable ? "Marked unavailable." : "Marked available.")}>{p.isAvailable ? <><EyeOff className="h-3.5 w-3.5" />Mark unavailable</> : <><Eye className="h-3.5 w-3.5" />Mark available</>}</button>
              <button className="btn btn-ghost btn-sm border border-red-200 text-red-600" onClick={() => remove(p)}><Trash2 className="h-3.5 w-3.5" />Delete</button>
            </div>
          </div>
        </article>
      ))}
      <Pagination page={page} pages={data.pages} onPage={setPage} />
    </div>
  );
}

function OrdersTab({ onChanged }: { onChanged: () => void }) {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<{ items: any[]; pages: number }>(`/orders?role=seller&page=${page}${status ? `&status=${status}` : ""}`);
  const done = () => { reload(); onChanged(); };
  return (
    <div className="space-y-3">
      <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter orders">
        <option value="">All orders</option><option value="pending">Pending</option><option value="accepted">Accepted</option><option value="ready_for_pickup">Ready for pickup</option><option value="out_for_delivery">Out for delivery</option><option value="completed">Completed</option><option value="rejected">Rejected</option><option value="cancelled">Cancelled</option>
      </select>
      {loading ? <Skeleton className="h-48" /> : error ? <ErrorState message={error} onRetry={reload} /> : !data?.items.length ? <EmptyState title="No orders here" text="Order requests from buyers will show up in this list." /> : (
        <div className="grid gap-4 lg:grid-cols-2">{data.items.map((o) => <OrderCard key={o.id} order={o} onChange={done} />)}</div>
      )}
      {data && <Pagination page={page} pages={data.pages} onPage={setPage} />}
    </div>
  );
}
