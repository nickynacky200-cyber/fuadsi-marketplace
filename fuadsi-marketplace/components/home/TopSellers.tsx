"use client";
import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { Avatar, Skeleton, Stars, VerifiedBadge } from "@/components/ui/primitives";

export function TopSellers() {
  const { data, loading } = useApi<{ items: any[] }>("/stores", { auth: false });
  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card md:rounded-3xl" aria-labelledby="ts-title">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="ts-title" className="flex items-center gap-2 text-lg font-extrabold"><Trophy className="h-5 w-5 text-amber-500" />Top Sellers</h2>
        <Link href="/shop" className="flex items-center gap-1 text-xs font-bold text-brand-600">View All<ArrowRight className="h-4 w-4" /></Link>
      </div>
      {loading ? <div className="space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /></div> : !data?.items.length ? (
        <p className="rounded-xl bg-lav px-3 py-5 text-center text-sm text-ink-soft">Stores with the most listings will show up here once sellers start posting.</p>
      ) : (
        <ul className="space-y-1">
          {data.items.map((s) => (
            <li key={s.id}>
              <Link href={`/store/${s.slug}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-lav">
                <Avatar src={s.avatarUrl} name={s.name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-sm font-bold">{s.name}{s.verified && <VerifiedBadge />}</p>
                  <p className="text-xs text-ink-soft">{s.products} {s.products === 1 ? "product" : "products"}</p>
                </div>
                {s.ratingCount > 0 && <Stars value={s.ratingAvg} count={s.ratingCount} />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
