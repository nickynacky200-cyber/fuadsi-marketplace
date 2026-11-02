/**
 * Normalises environment variables once, before anything reads them. Fixes the most common deployment mistakes:
 *  - values pasted with surrounding quotes or whitespace
 *  - Vercel's Upstash/KV integration naming (KV_REST_API_URL / KV_REST_API_TOKEN)
 *  - Firebase service-account JSON pasted whole
 * Import for side effects: `import "./env-clean"`.
 */
const strip = (v: string) => {
  let s = v.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) s = s.slice(1, -1).trim();
  return s;
};

const g = globalThis as unknown as { _envCleaned?: boolean };
if (!g._envCleaned) {
  g._envCleaned = true;
  for (const k of Object.keys(process.env)) {
    const v = process.env[k];
    if (typeof v === "string" && /^(MONGO|FIREBASE|CLOUDINARY|UPSTASH|KV_|ADMIN_|NEXT_PUBLIC_)/.test(k)) process.env[k] = strip(v);
  }
  const e = process.env;
  e.MONGODB_URI ||= e.MONGO_URI || e.MONGODB_URL;
  e.UPSTASH_REDIS_REST_URL ||= e.KV_REST_API_URL;
  e.UPSTASH_REDIS_REST_TOKEN ||= e.KV_REST_API_TOKEN;

  const raw = e.FIREBASE_SERVICE_ACCOUNT || (e.FIREBASE_PRIVATE_KEY?.startsWith("{") ? e.FIREBASE_PRIVATE_KEY : "");
  if (raw) {
    try {
      const j = JSON.parse(raw);
      e.FIREBASE_PROJECT_ID ||= j.project_id;
      e.FIREBASE_CLIENT_EMAIL ||= j.client_email;
      if (e.FIREBASE_PRIVATE_KEY?.startsWith("{") || !e.FIREBASE_PRIVATE_KEY) e.FIREBASE_PRIVATE_KEY = j.private_key;
    } catch {
      /* reported by /api/health */
    }
  }
}
export {};
