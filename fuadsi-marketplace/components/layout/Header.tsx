"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, Home, LayoutDashboard, LogOut, MessageCircle, Search, ShieldCheck, ShoppingCart, Store, User, UserPlus, X } from "lucide-react";
import clsx from "clsx";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import { CategoryIcon } from "./CategoryIcon";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRealtime } from "@/components/providers/RealtimeProvider";
import { useApi, useCartCount } from "@/lib/hooks";
import { Avatar, VerifiedBadge } from "@/components/ui/primitives";

function useOutside(onOut: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onOut();
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onOut]);
  return ref;
}

function SearchBox({ autoFocus = false, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") setQ(new URLSearchParams(window.location.search).get("q") || "");
  }, []);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop");
        onDone?.();
      }}
      className="relative w-full"
    >
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-mute" />
      <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus={autoFocus} type="search" enterKeyHint="search" placeholder="Search for products..." aria-label="Search products" className="w-full rounded-2xl border border-brand-200/70 bg-brand-50/50 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-ink-mute focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-600/15" />
    </form>
  );
}

export function Header() {
  const path = usePathname();
  const { me, store, loading, logout } = useAuth();
  const { counts } = useRealtime();
  const cart = useCartCount();
  const [shopOpen, setShopOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const shopRef = useOutside(() => setShopOpen(false));
  const menuRef = useOutside(() => setMenuOpen(false));
  const cats = useApi<{ items: { id: string; name: string; slug: string; icon: string }[] }>(shopOpen ? "/categories" : null, { auth: false });

  useEffect(() => { setShopOpen(false); setMenuOpen(false); setSearchOpen(false); }, [path]);

  const link = (href: string, active: boolean) => clsx("relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-brand-50", active ? "text-brand-600" : "text-ink");
  const hideOnMobileChat = path?.startsWith("/messages/");

  return (
    <header className={clsx("sticky top-0 z-40 border-b border-brand-100/70 bg-white/95 backdrop-blur", hideOnMobileChat && "max-md:hidden")}>
      {/* Desktop */}
      <div className="container-x hidden h-[84px] items-center gap-5 md:flex">
        <Logo />
        <div className="max-w-xl flex-1"><Suspense><SearchBox /></Suspense></div>
        <nav className="flex items-center gap-0.5" aria-label="Main">
          <Link href="/" className={link("/", path === "/")}><Home className="h-4.5 w-4.5" />Home{path === "/" && <span className="absolute inset-x-3 -bottom-[17px] h-[3px] rounded-full bg-brand-600" />}</Link>
          <div className="relative" ref={shopRef}>
            <button onClick={() => setShopOpen((o) => !o)} className={link("/shop", path === "/shop")} aria-expanded={shopOpen}>Shop <ChevronDown className="h-4 w-4" /></button>
            {shopOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-72 animate-pop rounded-2xl border border-brand-100 bg-white p-2 shadow-pop">
                <Link href="/shop" className="block rounded-xl px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50">All products</Link>
                {(cats.data?.items || []).map((c) => (
                  <Link key={c.id} href={`/shop?category=${c.slug}`} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-brand-50"><CategoryIcon name={c.icon} className="h-4 w-4 text-brand-600" />{c.name}</Link>
                ))}
              </div>
            )}
          </div>
          <Link href="/sell" className={link("/sell", path === "/sell")}>Sell</Link>
          <Link href="/messages" className={link("/messages", !!path?.startsWith("/messages"))}>Messages{counts.messages > 0 && <span className="absolute right-0.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{counts.messages > 99 ? "99+" : counts.messages}</span>}</Link>
          {me && <NotificationBell />}
          <Link href="/cart" className="relative rounded-xl p-2 hover:bg-brand-50" aria-label={`Cart, ${cart} items`}><ShoppingCart className="h-5 w-5" />{cart > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">{cart}</span>}</Link>
        </nav>
        <div className="flex items-center gap-2.5">
          {loading ? <div className="skeleton h-10 w-40" /> : me ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 rounded-full border border-brand-100 py-1 pl-1 pr-3 hover:bg-brand-50" aria-expanded={menuOpen}>
                <Avatar src={me.photoUrl} name={me.name} size={34} /><span className="max-w-[110px] truncate text-sm font-semibold">{me.name?.split(" ")[0] || "Account"}</span><ChevronDown className="h-4 w-4" />
              </button>
              {menuOpen && <UserMenu onLogout={logout} />}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn btn-outline px-6">Login</Link>
              <Link href="/signup" className="btn btn-primary px-5"><UserPlus className="h-4 w-4" />Sign Up</Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile */}
      <div className="container-x md:hidden">
        <div className="flex h-14 items-center justify-between gap-2">
          <Logo compact />
          <div className="flex items-center">
            <button onClick={() => setSearchOpen((o) => !o)} className="rounded-xl p-2.5" aria-label={searchOpen ? "Close search" : "Search"}>{searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}</button>
            <Link href="/cart" className="relative rounded-xl p-2.5" aria-label="Cart"><ShoppingCart className="h-5 w-5" />{cart > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">{cart}</span>}</Link>
            {me ? <NotificationBell label={false} /> : !loading && <Link href="/login" className="btn btn-primary btn-sm ml-1">Login</Link>}
          </div>
        </div>
        {searchOpen && <div className="pb-3"><Suspense><SearchBox autoFocus onDone={() => setSearchOpen(false)} /></Suspense></div>}
      </div>
    </header>
  );
}

function UserMenu({ onLogout }: { onLogout: () => void }) {
  const { me, store } = useAuth();
  if (!me) return null;
  const item = "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-brand-50";
  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-64 animate-pop rounded-2xl border border-brand-100 bg-white p-2 shadow-pop">
      <div className="px-3 pb-2 pt-1"><p className="flex items-center gap-1 truncate text-sm font-bold">{me.name}{me.verified && <VerifiedBadge />}</p><p className="truncate text-xs text-ink-soft">{me.email}</p></div>
      <hr className="mb-1 border-brand-100" />
      <Link href="/dashboard/buyer" className={item}><LayoutDashboard className="h-4 w-4 text-brand-600" />My orders</Link>
      <Link href="/dashboard/buyer?tab=favourites" className={item}><Heart className="h-4 w-4 text-brand-600" />Favourites</Link>
      {me.isSeller ? <Link href="/dashboard/seller" className={item}><Store className="h-4 w-4 text-brand-600" />Seller dashboard</Link> : <Link href="/sell" className={item}><Store className="h-4 w-4 text-brand-600" />Open your free store</Link>}
      {store && <Link href={`/store/${store.slug}`} className={item}><Store className="h-4 w-4 text-brand-600" />View my store</Link>}
      <Link href="/profile" className={item}><User className="h-4 w-4 text-brand-600" />Profile</Link>
      {me.role === "admin" && <Link href="/admin" className={item}><ShieldCheck className="h-4 w-4 text-brand-600" />Admin</Link>}
      <hr className="my-1 border-brand-100" />
      <button onClick={onLogout} className={clsx(item, "w-full text-red-600")}><LogOut className="h-4 w-4" />Sign out</button>
    </div>
  );
}
