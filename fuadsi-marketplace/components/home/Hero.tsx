import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Store } from "lucide-react";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl bg-[#0E0630] text-white md:min-h-[316px] md:rounded-3xl" aria-label="FUADSI Marketplace">
      <Image src="/images/hero/mall.webp" alt="" fill priority sizes="(min-width:1024px) 70vw, 100vw" className="-z-20 object-cover object-center opacity-70" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0E0630] via-[#0E0630]/85 to-[#2b0c78]/30" />
      <div className="absolute -bottom-24 -left-16 -z-10 h-64 w-64 rounded-full bg-brand-600/40 blur-3xl" />
      <div className="relative grid items-center gap-2 p-5 sm:p-8 md:grid-cols-[1.25fr_1fr] md:p-10">
        <div>
          <h1 className="font-extrabold leading-[0.95] tracking-tight">
            <span className="block text-[44px] sm:text-6xl md:text-[68px]">FUADSI</span>
            <span className="block text-[38px] text-leaf-500 sm:text-5xl md:text-[60px]">Marketplace</span>
          </h1>
          <p className="mt-3 text-xl font-bold sm:text-2xl md:mt-4">Your Campus Marketplace!</p>
          <p className="mt-2 max-w-md text-sm text-white/85 sm:text-[15px]">Buy affordable products, sell your items, and connect with fellow FUADSI students.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/shop" className="btn bg-brand-500 px-5 py-3 text-white shadow-lg shadow-brand-900/40 hover:bg-brand-400"><ShoppingCart className="h-4.5 w-4.5" />Start Shopping</Link>
            <Link href="/sell" className="btn border border-white/80 bg-white/5 px-5 py-3 text-white backdrop-blur hover:bg-white/15"><Store className="h-4.5 w-4.5" />Become a Seller</Link>
          </div>
        </div>
        <div className="relative hidden h-[260px] md:block">
          <Image src="/images/illustrations/cart.webp" alt="" width={460} height={600} priority className="absolute -bottom-6 right-2 h-[300px] w-auto drop-shadow-[0_18px_40px_rgba(8,201,120,0.35)]" />
        </div>
      </div>
    </section>
  );
}
