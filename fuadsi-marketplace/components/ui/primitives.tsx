"use client";
import Image from "next/image";
import { BadgeCheck, Loader2, Star } from "lucide-react";
import clsx from "clsx";
import { useEffect } from "react";
import { X } from "lucide-react";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx("h-5 w-5 animate-spin text-brand-600", className)} aria-label="Loading" />;
}

export function VerifiedBadge({ className, title = "Verified by FUADSI Marketplace admins" }: { className?: string; title?: string }) {
  return <BadgeCheck className={clsx("inline h-4 w-4 shrink-0 fill-brand-600 text-white", className)} aria-label={title} role="img" />;
}

export function Stars({ value, count, size = "sm" }: { value: number; count?: number; size?: "sm" | "md" }) {
  const s = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
      <Star className={clsx(s, "fill-amber-400 text-amber-400")} />
      <span className="font-semibold">{value.toFixed(1)}</span>
      {count !== undefined && <span>({count})</span>}
    </span>
  );
}

export function Avatar({ src, name, size = 36, className }: { src?: string | null; name?: string; size?: number; className?: string }) {
  const initials = (name || "?").trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "?";
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name || "Profile photo"} width={size} height={size} loading="lazy" className={clsx("shrink-0 rounded-full bg-brand-100 object-cover", className)} style={{ width: size, height: size }} />
  ) : (
    <span className={clsx("inline-flex shrink-0 items-center justify-center rounded-full bg-brand-600 font-bold text-white", className)} style={{ width: size, height: size, fontSize: size * 0.38 }} aria-label={name}>
      {initials}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("skeleton", className)} />;
}

export function ProductSkeletonGrid({ n = 4 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="card overflow-hidden p-2.5">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-5 w-1/2" />
          <Skeleton className="mt-3 h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ image, title, text, action, className }: { image?: "cart" | "chat" | "logo"; title: string; text?: string; action?: React.ReactNode; className?: string }) {
  const src = image === "chat" ? "/images/illustrations/chat.webp" : image === "logo" ? "/images/branding/logo-icon.webp" : "/images/illustrations/cart.webp";
  return (
    <div className={clsx("flex flex-col items-center rounded-2xl border border-dashed border-brand-200 bg-lav/60 px-5 py-10 text-center", className)}>
      <Image src={src} alt="" width={image === "logo" ? 72 : 130} height={image === "logo" ? 86 : 130} className="h-28 w-auto object-contain" />
      <h3 className="mt-3 text-base font-bold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-ink-soft">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700" role="alert">
      <p className="font-semibold">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn btn-outline btn-sm mt-3">Try again</button>}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="max-h-[92vh] w-full max-w-lg animate-up overflow-y-auto rounded-t-3xl bg-white p-5 shadow-pop sm:rounded-3xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-brand-50" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-3 text-sm">
      <button className="btn btn-soft btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      <span className="text-ink-soft">Page {page} of {pages}</span>
      <button className="btn btn-soft btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
}

export function StatusChip({ label, tone }: { label: string; tone: "green" | "amber" | "red" | "purple" | "gray" }) {
  const t = { green: "bg-leaf-50 text-leaf-700", amber: "bg-amber-50 text-amber-700", red: "bg-red-50 text-red-700", purple: "bg-brand-50 text-brand-700", gray: "bg-slate-100 text-slate-600" }[tone];
  return <span className={clsx("chip", t)}>{label}</span>;
}
