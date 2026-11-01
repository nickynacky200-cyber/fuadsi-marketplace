"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { PAYMENT_NOTICE } from "@/lib/constants";

export function Footer() {
  const path = usePathname() || "/";
  if (path.startsWith("/messages") || path.startsWith("/admin")) return null;
  return (
    <footer className="mt-12 border-t border-brand-100 bg-lav/70">
      <div className="container-x grid gap-8 py-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Logo compact />
          <p className="mt-3 max-w-sm text-sm text-ink-soft">The campus marketplace for the Federal University of Agriculture and Development Studies, Iragbiji. Not an official university service.</p>
        </div>
        <div className="text-sm">
          <h4 className="mb-2 font-bold">Marketplace</h4>
          <ul className="space-y-1.5 text-ink-soft">
            <li><Link href="/shop" className="hover:text-brand-600">Shop all products</Link></li>
            <li><Link href="/sell" className="hover:text-brand-600">Become a seller (free)</Link></li>
            <li><Link href="/safety" className="hover:text-brand-600">Safety &amp; how payments work</Link></li>
          </ul>
        </div>
        <div className="rounded-2xl bg-white p-4 text-xs leading-relaxed text-ink-soft shadow-card">
          <p className="mb-1 text-sm font-bold text-ink">Pay safely</p>
          {PAYMENT_NOTICE}
        </div>
      </div>
      <div className="border-t border-brand-100 py-4 text-center text-xs text-ink-mute">&copy; {new Date().getFullYear()} FUADSI Marketplace. Buy &bull; Sell &bull; Connect</div>
    </footer>
  );
}
