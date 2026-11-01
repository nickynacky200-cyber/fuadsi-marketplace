"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, PlusCircle, Store, User } from "lucide-react";
import clsx from "clsx";
import { useRealtime } from "@/components/providers/RealtimeProvider";
import { useAuth } from "@/components/providers/AuthProvider";

export function BottomNav() {
  const path = usePathname() || "/";
  const { counts } = useRealtime();
  const { me } = useAuth();
  if (path.startsWith("/messages/") || path.startsWith("/admin")) return null;
  const tabs = [
    { href: "/", label: "Home", icon: Home, active: path === "/" },
    { href: "/shop", label: "Shop", icon: Store, active: path.startsWith("/shop") || path.startsWith("/product") || path.startsWith("/store") },
    { href: "/sell", label: "Sell", icon: PlusCircle, active: path.startsWith("/sell") || path.startsWith("/dashboard/seller"), raised: true },
    { href: "/messages", label: "Messages", icon: MessageCircle, active: path.startsWith("/messages"), badge: counts.messages },
    { href: me ? "/profile" : "/login", label: me ? "Account" : "Login", icon: User, active: path.startsWith("/profile") || path.startsWith("/dashboard/buyer") || path === "/login" },
  ];
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-brand-100 bg-white/95 backdrop-blur md:hidden" aria-label="Primary">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {tabs.map((t) => (
          <li key={t.label}>
            <Link href={t.href} className={clsx("relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold", t.active ? "text-brand-600" : "text-ink-mute")} aria-current={t.active ? "page" : undefined}>
              {t.raised ? (
                <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-pop ring-4 ring-white"><t.icon className="h-6 w-6" /></span>
              ) : (
                <t.icon className="h-5.5 w-5.5" />
              )}
              <span className={t.raised ? "-mt-0.5" : ""}>{t.label}</span>
              {!!t.badge && t.badge > 0 && <span className="absolute right-[22%] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{t.badge > 99 ? "99+" : t.badge}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
