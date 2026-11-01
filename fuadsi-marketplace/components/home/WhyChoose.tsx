import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

const POINTS = [
  "Made for FUADSI students",
  "Buy & sell with ease",
  "Secure in-app messaging",
  "Pay sellers directly, no fees",
  "Campus delivery & pickup",
];

export function WhyChoose() {
  return (
    <aside className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-white via-white to-leaf-50 p-5 shadow-card md:rounded-3xl md:p-6" aria-labelledby="why-title">
      <h2 id="why-title" className="text-lg font-extrabold leading-tight md:text-[22px]">Why Choose FUADSI Marketplace?</h2>
      <ul className="mt-4 space-y-3 md:mt-5">
        {POINTS.map((t) => (
          <li key={t} className="flex items-center gap-3 text-sm font-medium text-ink-soft"><CheckCircle2 className="h-5 w-5 shrink-0 fill-leaf-500 text-white" />{t}</li>
        ))}
      </ul>
      <Image src="/images/branding/logo-icon.webp" alt="" width={90} height={108} className="pointer-events-none absolute -bottom-2 right-3 hidden h-24 w-auto opacity-95 md:block" />
    </aside>
  );
}
