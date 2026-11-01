"use client";
import clsx from "clsx";

export function Tabs({ tabs, value, onChange }: { tabs: { id: string; label: string; badge?: number }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="no-scrollbar -mx-3 mb-5 flex gap-1 overflow-x-auto border-b border-brand-100 px-3 sm:mx-0 sm:px-0" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)} className={clsx("relative shrink-0 px-4 py-2.5 text-sm font-semibold transition", value === t.id ? "text-brand-600" : "text-ink-soft hover:text-ink")}>
          {t.label}
          {!!t.badge && <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{t.badge}</span>}
          {value === t.id && <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-brand-600" />}
        </button>
      ))}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-brand-700 md:text-3xl">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-ink-mute">{hint}</p>}
    </div>
  );
}
