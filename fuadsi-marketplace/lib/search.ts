// Prefix-token search: cheap, indexable (multikey index on searchTokens) and works for partial words.
export function normalizeWords(s: string): string[] {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

const MAX_PREFIX = 10;

export function buildSearchTokens(...parts: string[]): string[] {
  const set = new Set<string>();
  for (const part of parts) {
    for (const w of normalizeWords(part)) {
      if (w.length === 1) set.add(w);
      for (let i = 2; i <= Math.min(w.length, MAX_PREFIX); i++) set.add(w.slice(0, i));
    }
  }
  return Array.from(set).slice(0, 200);
}

export function queryTokens(q: string): string[] {
  return normalizeWords(q)
    .slice(0, 6)
    .map((w) => w.slice(0, MAX_PREFIX));
}
