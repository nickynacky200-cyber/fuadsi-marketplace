import Image from "next/image";
import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="FUADSI Marketplace home">
      <Image src="/images/branding/logo-icon.webp" alt="" width={compact ? 30 : 44} height={compact ? 36 : 53} priority className={compact ? "h-9 w-auto" : "h-[52px] w-auto"} />
      <span className="leading-none">
        <span className={compact ? "block text-lg font-extrabold tracking-tight text-brand-800" : "block text-[26px] font-extrabold tracking-tight text-brand-800"}>FUADSI</span>
        <span className={compact ? "block text-[11px] font-bold text-brand-800" : "block text-[19px] font-bold tracking-tight text-brand-800"}>Marketplace</span>
        {!compact && <span className="mt-0.5 block text-[11px] font-medium text-leaf-600">Buy &bull; Sell &bull; Connect</span>}
      </span>
    </Link>
  );
}
