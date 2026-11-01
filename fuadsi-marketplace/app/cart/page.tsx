"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Info, Minus, Plus, Trash2 } from "lucide-react";
import { CartLine, readCart, removeFromCart, setQuantity, clearCart } from "@/lib/cart";
import { api, errorMessage } from "@/lib/api-client";
import { formatNaira } from "@/lib/format";
import { cdn } from "@/lib/upload";
import { PAYMENT_NOTICE } from "@/lib/constants";
import { EmptyState, Skeleton } from "@/components/ui/primitives";
import { useRequireLogin } from "@/components/ui/Protected";
import { useToast } from "@/components/providers/ToastProvider";
import { OrderModal } from "@/components/OrderModal";

export default function CartPage() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [products, setProducts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [sellerOpen, setSellerOpen] = useState<string | null>(null);
  const requireLogin = useRequireLogin();
  const { toast } = useToast();

  useEffect(() => {
    const sync = () => setLines(readCart());
    sync();
    window.addEventListener("fuadsi:cart", sync);
    return () => window.removeEventListener("fuadsi:cart", sync);
  }, []);

  const ids = lines.map((l) => l.productId).join(",");
  useEffect(() => {
    if (!ids) { setLoading(false); return; }
    api<{ items: any[] }>(`/products/batch?ids=${ids}`, { auth: false })
      .then((r) => setProducts(Object.fromEntries(r.items.map((p) => [p.id, p]))))
      .catch((e) => toast("error", errorMessage(e)))
      .finally(() => setLoading(false));
  }, [ids, toast]);

  // Items that disappeared (deleted/unapproved) are shown as unavailable and excluded from checkout.
  const groups = useMemo(() => {
    const g = new Map<string, { store: any; rows: { line: CartLine; p: any }[] }>();
    lines.forEach((line) => {
      const p = products[line.productId];
      if (!p || p.status !== "APPROVED" || !p.isAvailable || p.quantity < 1) return;
      const key = p.seller;
      if (!g.has(key)) g.set(key, { store: p.store, rows: [] });
      g.get(key)!.rows.push({ line, p });
    });
    return Array.from(g.entries());
  }, [lines, products]);
  const gone = lines.filter((l) => !loading && (!products[l.productId] || products[l.productId].status !== "APPROVED" || !products[l.productId].isAvailable || products[l.productId].quantity < 1));

  return (
    <div className="container-x max-w-3xl py-5 md:py-8">
      <h1 className="mb-4 text-2xl font-extrabold">Your cart</h1>
      {loading && lines.length > 0 ? <Skeleton className="h-48" /> : lines.length === 0 ? (
        <EmptyState title="Your cart is empty" text="Add products you like, then send an order request to each seller." action={<Link href="/shop" className="btn btn-primary">Start shopping</Link>} />
      ) : (
        <div className="space-y-5">
          <p className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><Info className="mt-0.5 h-4 w-4 shrink-0" />{PAYMENT_NOTICE} Each seller receives their own order request.</p>
          {groups.map(([sellerId, g]) => {
            const total = g.rows.reduce((s, r) => s + r.p.price * r.line.quantity, 0);
            return (
              <section key={sellerId} className="card p-4">
                <h2 className="mb-3 text-sm font-extrabold text-brand-700">{g.store?.name || "Seller"}</h2>
                <ul className="divide-y divide-brand-100">
                  {g.rows.map(({ line, p }) => (
                    <li key={p.id} className="flex items-center gap-3 py-3">
                      <Link href={`/product/${p.id}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-lav">{p.image && <Image src={cdn(p.image, 160)} alt="" fill sizes="64px" className="object-cover" unoptimized />}</Link>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{p.title}</p><p className="text-sm font-extrabold text-brand-700">{formatNaira(p.price)}</p></div>
                      <div className="flex items-center rounded-xl border border-brand-100">
                        <button className="p-2" onClick={() => setQuantity(p.id, Math.max(1, line.quantity - 1))} aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-7 text-center text-sm font-bold">{line.quantity}</span>
                        <button className="p-2" onClick={() => setQuantity(p.id, Math.min(p.quantity, line.quantity + 1))} aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <button onClick={() => removeFromCart(p.id)} className="p-2 text-ink-mute hover:text-red-600" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex items-center justify-between border-t border-brand-100 pt-3"><span className="font-extrabold">{formatNaira(total)}</span><button className="btn btn-primary" onClick={() => requireLogin(() => setSellerOpen(sellerId))}>Send order request</button></div>
                <OrderModal open={sellerOpen === sellerId} onClose={() => { setSellerOpen(null); }} onSuccess={() => g.rows.forEach(({ p }) => removeFromCart(p.id))} items={g.rows.map(({ line, p }) => ({ productId: p.id, quantity: line.quantity, title: p.title, price: p.price }))} total={total} />
              </section>
            );
          })}
          {gone.length > 0 && <div className="rounded-2xl bg-lav p-3 text-sm text-ink-soft">{gone.length} item(s) are no longer available. <button className="font-bold text-brand-600" onClick={() => gone.forEach((l) => removeFromCart(l.productId))}>Remove them</button></div>}
          <button onClick={clearCart} className="text-xs font-semibold text-ink-mute hover:text-red-600">Clear cart</button>
        </div>
      )}
    </div>
  );
}
