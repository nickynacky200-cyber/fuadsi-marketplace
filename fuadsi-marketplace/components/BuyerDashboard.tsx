"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Protected } from "@/components/ui/Protected";
import { Tabs } from "@/components/Tabs";
import { OrderCard } from "@/components/OrderCard";
import { ProductCard } from "@/components/ProductCard";
import { useApi } from "@/lib/hooks";
import { EmptyState, ErrorState, Pagination, ProductSkeletonGrid, Skeleton } from "@/components/ui/primitives";

export function BuyerDashboard() {
  const sp = useSearchParams();
  const router = useRouter();
  const tab = sp.get("tab") || "orders";
  return (
    <Protected>
      <div className="container-x py-5 md:py-8">
        <h1 className="mb-4 text-2xl font-extrabold">My account</h1>
        <Tabs value={tab} onChange={(t) => router.replace(`/dashboard/buyer?tab=${t}`, { scroll: false })} tabs={[{ id: "orders", label: "My orders" }, { id: "favourites", label: "Favourites" }]} />
        {tab === "orders" ? <Orders /> : <Favourites />}
      </div>
    </Protected>
  );
}

function Orders() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<{ items: any[]; pages: number }>(`/orders?role=buyer&page=${page}`);
  if (loading) return <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-56" /><Skeleton className="h-56" /></div>;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data?.items.length) return <EmptyState title="No orders yet" text="When you order something, you can follow its progress here." action={<Link href="/shop" className="btn btn-primary">Start shopping</Link>} />;
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">{data.items.map((o) => <OrderCard key={o.id} order={o} onChange={reload} />)}</div>
      <Pagination page={page} pages={data.pages} onPage={setPage} />
    </>
  );
}

function Favourites() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<{ items: any[]; pages: number }>(`/favourites?page=${page}&limit=12`);
  if (loading) return <ProductSkeletonGrid n={4} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data?.items.length) return <EmptyState title="Nothing saved yet" text="Tap the heart on any product to keep it here." action={<Link href="/shop" className="btn btn-primary">Browse products</Link>} />;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{data.items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      <Pagination page={page} pages={data.pages} onPage={setPage} />
    </>
  );
}
