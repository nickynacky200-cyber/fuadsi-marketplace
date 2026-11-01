"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import clsx from "clsx";
import { formatNaira } from "@/lib/format";
import { cdn } from "@/lib/upload";
import { api } from "@/lib/api-client";
import { Avatar, Stars, VerifiedBadge } from "@/components/ui/primitives";
import { useRequireLogin } from "@/components/ui/Protected";
import { useFavourites } from "@/components/providers/FavouritesProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";

export type ProductCardData = {
  id: string; title: string; price: number; originalPrice: number | null; discountPercent: number; image: string | null; condition: string;
  status: string; seller: string;
  store: { name: string; slug: string; avatarUrl: string; ratingAvg: number; ratingCount: number; verified: boolean } | null;
};

export function ProductCard({ p, priority = false }: { p: ProductCardData; priority?: boolean }) {
  const router = useRouter();
  const { me } = useAuth();
  const { toast } = useToast();
  const requireLogin = useRequireLogin();
  const fav = useFavourites();
  const [busy, setBusy] = useState(false);
  const liked = fav.has(p.id);
  const mine = me?.id === p.seller;
  const soldOut = p.status === "SOLD_OUT";

  const chat = () =>
    requireLogin(async () => {
      setBusy(true);
      try {
        const r = await api<{ id: string }>("/conversations", { method: "POST", body: { userId: p.seller, productId: p.id } });
        router.push(`/messages/${r.id}`);
      } catch (e: any) {
        toast("error", e.message);
        setBusy(false);
      }
    });

  return (
    <article className="card group relative flex flex-col overflow-hidden p-2 transition hover:-translate-y-0.5 hover:shadow-pop sm:p-2.5">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-lav">
        <Link href={`/product/${p.id}`} className="absolute inset-0" aria-label={p.title}>
          {p.image ? <Image src={cdn(p.image, 500)} alt={p.title} fill sizes="(max-width:640px) 46vw, (max-width:1280px) 30vw, 22vw" priority={priority} className={clsx("object-cover transition duration-300 group-hover:scale-105", soldOut && "opacity-60")} unoptimized /> : <div className="h-full w-full" />}
        </Link>
        {p.discountPercent > 0 && <span className="absolute left-2 top-2 rounded-full bg-leaf-500 px-2 py-0.5 text-[11px] font-extrabold text-ink">-{p.discountPercent}%</span>}
        {soldOut && <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white">Sold out</span>}
        <button onClick={() => requireLogin(() => fav.toggle(p.id))} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-110" aria-label={liked ? "Remove from favourites" : "Save to favourites"} aria-pressed={liked}>
          <Heart className={clsx("h-4.5 w-4.5", liked ? "fill-brand-600 text-brand-600" : "text-brand-600")} />
        </button>
      </div>
      <div className="flex flex-1 flex-col px-0.5 pt-2.5">
        <Link href={`/product/${p.id}`} className="line-clamp-2 min-h-[2.5rem] text-[13px] font-bold leading-tight sm:text-sm">{p.title}</Link>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-brand-700">
          <span className="text-base font-extrabold sm:text-lg">{formatNaira(p.price)}</span>
          {p.originalPrice ? <span className="text-xs font-medium text-ink-mute line-through">{formatNaira(p.originalPrice)}</span> : null}
        </p>
        {p.store && (
          <Link href={`/store/${p.store.slug}`} className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-soft hover:text-brand-600">
            <Avatar src={p.store.avatarUrl} name={p.store.name} size={18} />
            <span className="truncate">{p.store.name}</span>
            {p.store.verified && <VerifiedBadge className="h-3.5 w-3.5" />}
          </Link>
        )}
        <div className="mt-1 h-5">{p.store && p.store.ratingCount > 0 && <Stars value={p.store.ratingAvg} count={p.store.ratingCount} />}</div>
        {!mine && (
          <button onClick={chat} disabled={busy} className="btn btn-outline mt-auto w-full py-2 text-[13px]"><MessageCircle className="h-4 w-4" />Chat Seller</button>
        )}
        {mine && <Link href={`/dashboard/seller?tab=products`} className="btn btn-soft mt-auto w-full py-2 text-[13px]">Manage listing</Link>}
      </div>
    </article>
  );
}
