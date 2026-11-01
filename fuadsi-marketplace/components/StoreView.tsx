"use client";
import { useState } from "react";
import { CalendarDays, GraduationCap, PackageOpen } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { Avatar, EmptyState, ErrorState, Pagination, ProductSkeletonGrid, Skeleton, Stars, StatusChip, VerifiedBadge } from "@/components/ui/primitives";
import { ProductCard } from "@/components/ProductCard";
import { ChatSellerButton, WhatsAppButton } from "@/components/ContactButtons";
import { ReportButton } from "@/components/ReportButton";
import { timeAgo } from "@/lib/format";
import { AFFILIATIONS } from "@/lib/constants";

export function StoreView({ slug }: { slug: string }) {
  const store = useApi<{ store: any }>(`/stores/${slug}`, { auth: false });
  const [page, setPage] = useState(1);
  const products = useApi<{ items: any[]; pages: number }>(`/products?store=${encodeURIComponent(slug)}&page=${page}&limit=12`, { auth: false });
  const reviews = useApi<{ items: any[]; total: number }>(`/reviews?store=${encodeURIComponent(slug)}&limit=5`, { auth: false });

  if (store.loading) return <div className="container-x py-6"><Skeleton className="h-44" /></div>;
  if (store.error || !store.data) return <div className="container-x py-10"><ErrorState message={store.error === "Store not found." ? "We couldn't find that store." : store.error || "Couldn't load this store."} onRetry={store.reload} /></div>;
  const s = store.data.store;
  const aff = AFFILIATIONS.find((a) => a.value === s.affiliation)?.label;

  return (
    <div className="container-x space-y-6 py-4 md:py-6">
      <section className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-700 via-brand-600 to-leaf-500 md:h-32" />
        <div className="-mt-10 flex flex-col gap-4 p-4 pt-0 md:flex-row md:items-end md:justify-between md:p-6 md:pt-0">
          <div className="flex items-end gap-4">
            <Avatar src={s.avatarUrl} name={s.name} size={88} className="ring-4 ring-white" />
            <div className="pb-1">
              <h1 className="flex items-center gap-1.5 text-xl font-extrabold md:text-2xl">{s.name}{s.verified && <VerifiedBadge className="h-5 w-5" />}</h1>
              <p className="text-sm text-ink-soft">@{s.slug}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <ChatSellerButton sellerId={s.ownerId} className="btn btn-primary" label="Contact seller" />
            <WhatsAppButton number={s.whatsapp} />
          </div>
        </div>
        <div className="space-y-3 border-t border-brand-100 p-4 md:px-6">
          {s.description && <p className="max-w-3xl whitespace-pre-line text-sm text-ink-soft">{s.description}</p>}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
            {s.ratingCount > 0 ? <Stars value={s.ratingAvg} count={s.ratingCount} size="md" /> : <span className="text-ink-mute">No reviews yet</span>}
            <span className="flex items-center gap-1.5"><PackageOpen className="h-4 w-4" />{s.productCount} products</span>
            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />Joined {new Date(s.joinedAt).toLocaleDateString("en-NG", { month: "short", year: "numeric" })}</span>
            {aff && <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" />{aff}{s.department ? `, ${s.department}` : ""}</span>}
            <StatusChip label={s.available ? "Open for orders" : "Currently unavailable"} tone={s.available ? "green" : "amber"} />
          </div>
          <ReportButton targetType="user" target={s.ownerId} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-extrabold">Products</h2>
        {products.loading ? <ProductSkeletonGrid n={4} /> : products.data?.items.length ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{products.data.items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
            <Pagination page={page} pages={products.data.pages} onPage={setPage} />
          </>
        ) : <EmptyState title="No products yet" text="This store hasn't got any approved listings right now." />}
      </section>

      {!!reviews.data?.items.length && (
        <section>
          <h2 className="mb-3 text-xl font-extrabold">Reviews</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {reviews.data.items.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center gap-2.5"><Avatar src={r.reviewer.photoUrl} name={r.reviewer.name} size={32} /><div><p className="text-sm font-bold">{r.reviewer.name}</p><p className="text-[11px] text-ink-mute">{timeAgo(r.createdAt)}</p></div><div className="ml-auto"><Stars value={r.rating} /></div></div>
                {r.comment && <p className="mt-2 text-sm text-ink-soft">{r.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
