"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import clsx from "clsx";
import { useApi, useDebounce } from "@/lib/hooks";
import { ProductCard } from "@/components/ProductCard";
import { CategoryIcon } from "@/components/layout/CategoryIcon";
import { EmptyState, ErrorState, Pagination, ProductSkeletonGrid } from "@/components/ui/primitives";

const SORTS = [["newest", "Newest"], ["price_asc", "Price: low to high"], ["price_desc", "Price: high to low"], ["popular", "Most popular"], ["discount", "Biggest discount"]];

export function ShopView() {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const cats = useApi<{ items: any[] }>("/categories", { auth: false });

  const [q, setQ] = useState(sp.get("q") || "");
  const dq = useDebounce(q, 400);
  const [showFilters, setShowFilters] = useState(false);
  const category = sp.get("category") || "";
  const sort = sp.get("sort") || "newest";
  const section = sp.get("section") || "";
  const min = sp.get("min") || "";
  const max = sp.get("max") || "";
  const condition = sp.get("condition") || "";
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);

  const setParams = useCallback((patch: Record<string, string | null>, keepPage = false) => {
    const n = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    if (!keepPage) n.delete("page");
    router.replace(`${path}?${n.toString()}`, { scroll: false });
  }, [sp, router, path]);

  // keep the URL in sync with the debounced search box
  useEffect(() => {
    if (dq !== (sp.get("q") || "")) setParams({ q: dq || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq]);
  useEffect(() => setQ(sp.get("q") || ""), [sp.get("q")]); // eslint-disable-line react-hooks/exhaustive-deps

  const apiPath = useMemo(() => {
    const n = new URLSearchParams({ page: String(page), limit: "12" });
    if (sp.get("q")) n.set("q", sp.get("q")!);
    if (category) n.set("category", category);
    if (section) n.set("section", section);
    if (!section) n.set("sort", sort);
    if (min) n.set("min", min);
    if (max) n.set("max", max);
    if (condition) n.set("condition", condition);
    return `/products?${n.toString()}`;
  }, [sp, page, category, sort, section, min, max, condition]);
  const { data, loading, error, reload } = useApi<{ items: any[]; total: number; pages: number }>(apiPath, { auth: false });

  const activeFilters = [min, max, condition].filter(Boolean).length;
  const title = section === "hot" ? "Hot Deals" : cats.data?.items.find((c) => c.slug === category)?.name || "All products";

  return (
    <div className="container-x py-4 md:py-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
          {data && <p className="text-sm text-ink-soft">{data.total} {data.total === 1 ? "item" : "items"}{sp.get("q") ? ` for "${sp.get("q")}"` : ""}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" /><input className="input pl-9" type="search" placeholder="Search products..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" /></div>
          <select className="input w-auto max-md:hidden" value={sort} onChange={(e) => setParams({ sort: e.target.value })} aria-label="Sort" disabled={!!section}>{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <button onClick={() => setShowFilters((s) => !s)} className={clsx("btn btn-soft relative", showFilters && "bg-brand-100")} aria-expanded={showFilters}><SlidersHorizontal className="h-4 w-4" /><span className="max-sm:hidden">Filters</span>{activeFilters > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] text-white">{activeFilters}</span>}</button>
        </div>
      </div>

      <div className="no-scrollbar -mx-3 mb-4 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        <button onClick={() => setParams({ category: null, section: null })} className={clsx("chip shrink-0 border px-3.5 py-2 text-xs", !category && !section ? "border-brand-600 bg-brand-600 text-white" : "border-brand-100 bg-white text-ink-soft hover:bg-brand-50")}>All</button>
        {cats.data?.items.map((c) => (
          <button key={c.id} onClick={() => setParams({ category: c.slug, section: null })} className={clsx("chip shrink-0 gap-1.5 border px-3.5 py-2 text-xs", category === c.slug ? "border-brand-600 bg-brand-600 text-white" : "border-brand-100 bg-white text-ink-soft hover:bg-brand-50")}><CategoryIcon name={c.icon} className="h-3.5 w-3.5" />{c.name}</button>
        ))}
      </div>

      {showFilters && (
        <div className="card mb-4 grid animate-up gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div><label className="label" htmlFor="fmin">Min price (NGN)</label><input id="fmin" className="input" inputMode="numeric" defaultValue={min} onBlur={(e) => setParams({ min: e.target.value.replace(/\D/g, "") || null })} /></div>
          <div><label className="label" htmlFor="fmax">Max price (NGN)</label><input id="fmax" className="input" inputMode="numeric" defaultValue={max} onBlur={(e) => setParams({ max: e.target.value.replace(/\D/g, "") || null })} /></div>
          <div><label className="label" htmlFor="fcond">Condition</label><select id="fcond" className="input" value={condition} onChange={(e) => setParams({ condition: e.target.value || null })}><option value="">Any</option><option value="new">New</option><option value="used">Fairly used</option></select></div>
          <div className="md:hidden"><label className="label" htmlFor="fsort">Sort by</label><select id="fsort" className="input" value={sort} onChange={(e) => setParams({ sort: e.target.value })}>{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div className="flex items-end"><button onClick={() => { setQ(""); router.replace(path); }} className="btn btn-ghost w-full"><X className="h-4 w-4" />Clear all</button></div>
        </div>
      )}

      {loading ? <ProductSkeletonGrid n={8} /> : error ? <ErrorState message={error} onRetry={reload} /> : data && data.items.length ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{data.items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          <Pagination page={page} pages={data.pages} onPage={(p) => { setParams({ page: String(p) }, true); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </>
      ) : (
        <EmptyState title="No products found" text={sp.toString() ? "Try a different search, category or price range." : "No one has listed anything yet. Be the first!"} />
      )}
    </div>
  );
}
