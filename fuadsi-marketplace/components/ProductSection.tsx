"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { ProductCard } from "./ProductCard";
import { EmptyState, ErrorState, ProductSkeletonGrid } from "@/components/ui/primitives";

export function ProductSection({ title, icon, section, href, limit = 8, cols = "md:grid-cols-3 xl:grid-cols-4", empty }: {
  title: string; icon?: React.ReactNode; section: "hot" | "recent" | "recommended"; href: string; limit?: number; cols?: string; empty: { title: string; text: string };
}) {
  const sort = section === "recent" ? "&sort=newest" : "";
  const { data, loading, error, reload } = useApi<{ items: any[] }>(`/products?section=${section}&limit=${limit}${sort}`, { auth: false });
  return (
    <section aria-label={title}>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-xl font-extrabold md:text-2xl">{icon}{title}</h2>
        {!!data?.items.length && <Link href={href} className="flex items-center gap-1 text-xs font-bold text-brand-600 md:text-sm">View All<ArrowRight className="h-4 w-4" /></Link>}
      </div>
      {loading ? <ProductSkeletonGrid n={limit > 4 ? 4 : limit} /> : error ? <ErrorState message={error} onRetry={reload} /> : data && data.items.length ? (
        <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${cols}`}>{data.items.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 2 && section === "hot"} />)}</div>
      ) : (
        <EmptyState title={empty.title} text={empty.text} action={<Link href="/sell" className="btn btn-primary btn-sm">List a product</Link>} />
      )}
    </section>
  );
}
