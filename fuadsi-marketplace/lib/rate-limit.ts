import { kv } from "./kv";
import { ApiError } from "./api";

/** Fixed-window limiter backed by Redis (shared across serverless instances). */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const k = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSeconds)}`;
  let n = 0;
  try {
    n = await kv().incr(k);
    if (n === 1) await kv().expire(k, windowSeconds + 1);
  } catch (e) {
    // Fail open if Redis is briefly unavailable rather than taking the whole site down.
    console.error("[rate-limit] kv error", (e as Error).message);
    return;
  }
  if (n > limit) throw new ApiError(429, "Too many requests. Please slow down and try again shortly.", "RATE_LIMITED");
}

export function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  return (xf?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
}
