"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { CategoryIcon } from "@/components/layout/CategoryIcon";
import { Skeleton } from "@/components/ui/primitives";

export function CategoryRow() {
  const { data, loading, error } = useApi<{ items: { id: string; name: string; slug: string; icon: string }[] }>("/categories", { auth: false });
  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-3 shadow-card sm:p-4 md:rounded-3xl" aria-labelledby="cat-title">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 id="cat-title" className="text-lg font-extrabold md:text-xl">Browse Categories</h2>
        <Link href="/shop" className="flex items-center gap-1 text-xs font-bold text-brand-600 md:text-sm">View All Categories<ArrowRight className="h-4 w-4" /></Link>
      </div>
      <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 md:grid md:grid-cols-[repeat(11,minmax(0,1fr))] md:gap-2 md:overflow-visible">
        {loading && Array.from({ length: 11 }).map((_, i) => <Skeleton key={i} className="h-24 w-24 shrink-0 md:w-auto" />)}
        {error && <p className="px-2 text-sm text-red-600">Couldn't load categories.</p>}
        {data?.items.map((c) => (
          <Link key={c.id} href={`/shop?category=${c.slug}`} className="group flex w-[92px] shrink-0 flex-col items-center gap-2 rounded-2xl border border-brand-100/80 bg-lav/50 px-1.5 py-3 text-center transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-white hover:shadow-card md:w-auto">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm transition group-hover:bg-brand-600 group-hover:text-white"><CategoryIcon name={c.icon} className="h-6 w-6" /></span>
            <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-ink-soft md:text-xs">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
