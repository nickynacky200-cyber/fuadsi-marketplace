"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, Heart, MapPin, Minus, Plus, Share2, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import clsx from "clsx";
import { useApi } from "@/lib/hooks";
import { formatNaira, timeAgo } from "@/lib/format";
import { cdn } from "@/lib/upload";
import { addToCart } from "@/lib/cart";
import { CONDITION_LABEL, PAYMENT_NOTICE, PRODUCT_STATUS_LABEL } from "@/lib/constants";
import { Avatar, ErrorState, Skeleton, Stars, StatusChip, VerifiedBadge } from "@/components/ui/primitives";
import { ChatSellerButton, WhatsAppButton } from "@/components/ContactButtons";
import { OrderModal } from "@/components/OrderModal";
import { ReportButton } from "@/components/ReportButton";
import { useRequireLogin } from "@/components/ui/Protected";
import { useFavourites } from "@/components/providers/FavouritesProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";

export function ProductView({ id }: { id: string }) {
  const { data, loading, error, reload } = useApi<{ product: any; favourited: boolean; isOwner: boolean }>(`/products/${id}`);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [orderOpen, setOrderOpen] = useState(false);
  const fav = useFavourites();
  const { me } = useAuth();
  const requireLogin = useRequireLogin();
  const { toast } = useToast();

  if (loading) return <div className="container-x grid gap-6 py-6 md:grid-cols-2"><Skeleton className="aspect-square" /><div className="space-y-3"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-10 w-1/3" /><Skeleton className="h-32" /></div></div>;
  if (error || !data) return <div className="container-x py-10"><ErrorState message={error === "Product not found." ? "This product isn't available any more." : error || "Couldn't load this product."} onRetry={reload} /></div>;

  const p = data.product;
  const isOwner = data.isOwner;
  const purchasable = p.status === "APPROVED" && p.isAvailable && p.quantity > 0 && !isOwner && p.store?.available !== false;
  const liked = fav.has(p.id);
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: p.title, url });
      else { await navigator.clipboard.writeText(url); toast("success", "Link copied."); }
    } catch { /* cancelled */ }
  };

  return (
    <div className="container-x py-4 md:py-8">
      <nav className="mb-3 text-xs text-ink-mute" aria-label="Breadcrumb"><Link href="/shop" className="hover:text-brand-600">Shop</Link>{p.category && <> / <Link href={`/shop?category=${p.category.slug}`} className="hover:text-brand-600">{p.category.name}</Link></>}</nav>

      {isOwner && p.status !== "APPROVED" && (
        <div className="mb-4 flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><div><b>{PRODUCT_STATUS_LABEL[p.status as keyof typeof PRODUCT_STATUS_LABEL]}.</b> {p.status === "PENDING_APPROVAL" ? "Only you can see this until an administrator approves it." : p.rejectionReason ? `Reason: ${p.rejectionReason}` : ""}</div></div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-brand-100 bg-lav">
            {p.images[active] && <Image src={cdn(p.images[active].url, 900)} alt={p.title} fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-contain" unoptimized />}
            {p.discountPercent > 0 && <span className="absolute left-3 top-3 rounded-full bg-leaf-500 px-3 py-1 text-sm font-extrabold text-ink">-{p.discountPercent}%</span>}
          </div>
          {p.images.length > 1 && (
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
              {p.images.map((im: any, i: number) => (
                <button key={im.publicId} onClick={() => setActive(i)} className={clsx("relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 sm:h-20 sm:w-20", i === active ? "border-brand-600" : "border-transparent opacity-70 hover:opacity-100")} aria-label={`Show image ${i + 1}`}>
                  <Image src={cdn(im.url, 160)} alt="" fill sizes="80px" className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip label={CONDITION_LABEL[p.condition as "new" | "used"]} tone={p.condition === "new" ? "green" : "amber"} />
              <StatusChip label={p.status === "SOLD_OUT" || p.quantity === 0 ? "Sold out" : `${p.quantity} available`} tone={p.quantity > 0 && p.status !== "SOLD_OUT" ? "purple" : "gray"} />
            </div>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight md:text-3xl">{p.title}</h1>
            <p className="mt-2 flex flex-wrap items-baseline gap-2"><span className="text-3xl font-extrabold text-brand-700">{formatNaira(p.price)}</span>{p.originalPrice && <span className="text-base text-ink-mute line-through">{formatNaira(p.originalPrice)}</span>}</p>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-soft"><MapPin className="h-4 w-4" />{p.location} <span className="text-ink-mute">&bull; listed {timeAgo(p.createdAt)}</span></p>
          </div>

          {purchasable && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">Quantity</span>
                <div className="flex items-center rounded-xl border border-brand-100">
                  <button className="p-2.5" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease"><Minus className="h-4 w-4" /></button>
                  <span className="w-10 text-center text-sm font-bold" aria-live="polite">{qty}</span>
                  <button className="p-2.5" onClick={() => setQty((q) => Math.min(p.quantity, q + 1))} aria-label="Increase"><Plus className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="btn btn-primary py-3" onClick={() => requireLogin(() => setOrderOpen(true))}><Truck className="h-4.5 w-4.5" />Order now</button>
                <button className="btn btn-soft py-3" onClick={() => { addToCart(p.id, qty, p.quantity); toast("success", "Added to cart."); }}><ShoppingCart className="h-4.5 w-4.5" />Add to cart</button>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2.5">
            <ChatSellerButton sellerId={p.seller} productId={p.id} className="btn btn-outline flex-1 py-3" />
            <WhatsAppButton number={p.store?.whatsapp} productTitle={p.title} productId={p.id} className="btn flex-1 bg-[#25D366] py-3 text-white hover:bg-[#1fb857]" />
            <button onClick={() => requireLogin(() => fav.toggle(p.id))} className="btn btn-ghost border border-brand-100" aria-pressed={liked} aria-label={liked ? "Remove from favourites" : "Save to favourites"}><Heart className={clsx("h-4.5 w-4.5", liked && "fill-brand-600 text-brand-600")} /></button>
            <button onClick={share} className="btn btn-ghost border border-brand-100" aria-label="Share"><Share2 className="h-4.5 w-4.5" /></button>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-900"><p className="mb-0.5 flex items-center gap-1.5 text-sm font-bold"><ShieldCheck className="h-4 w-4" />Payment happens directly</p>{PAYMENT_NOTICE}</div>

          {p.store && (
            <Link href={`/store/${p.store.slug}`} className="card flex items-center gap-3 p-3.5 transition hover:shadow-pop">
              <Avatar src={p.store.avatarUrl} name={p.store.name} size={52} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 truncate font-bold">{p.store.name}{p.store.verified && <VerifiedBadge />}</p>
                <div className="mt-0.5">{p.store.ratingCount > 0 ? <Stars value={p.store.ratingAvg} count={p.store.ratingCount} size="md" /> : <span className="text-xs text-ink-mute">No reviews yet</span>}</div>
                {p.store.available === false && <p className="text-xs font-semibold text-amber-700">Store currently unavailable</p>}
              </div>
              <span className="text-sm font-bold text-brand-600">Visit store</span>
            </Link>
          )}
        </div>
      </div>

      <section className="mt-8 max-w-3xl">
        <h2 className="text-lg font-extrabold">Description</h2>
        <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">{p.description}</p>
        {!isOwner && <div className="mt-6 border-t border-brand-100 pt-3"><ReportButton targetType="product" target={p.id} /></div>}
      </section>

      <OrderModal open={orderOpen} onClose={() => setOrderOpen(false)} items={[{ productId: p.id, quantity: qty, title: p.title, price: p.price }]} total={p.price * qty} />
      {me && null}
    </div>
  );
}
