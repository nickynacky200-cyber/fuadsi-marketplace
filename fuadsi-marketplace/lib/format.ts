export function formatNaira(n: number): string {
  return "\u20A6" + Math.round(Number(n) || 0).toLocaleString("en-NG");
}

export function timeAgo(input: string | Date, now: number = Date.now()): string {
  const t = new Date(input).getTime();
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(t).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export function formatClock(input: string | Date): string {
  return new Date(input).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
}

export function lastSeenText(input?: string | Date | null, online?: boolean): string {
  if (online) return "Online";
  if (!input) return "Offline";
  return "Last seen " + timeAgo(input);
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function discountPercent(price: number, original?: number | null): number {
  if (!original || original <= price || price <= 0) return 0;
  return Math.round(((original - price) / original) * 100);
}
