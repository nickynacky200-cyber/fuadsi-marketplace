import { Redis } from "@upstash/redis";

/**
 * Tiny key-value facade over Upstash Redis (REST). In local development without Upstash credentials it falls
 * back to an in-process Map so the app still runs. Production REQUIRES Upstash (enforced in lib/env.ts) because
 * serverless instances do not share memory. Durable data (messages, conversations) always lives in MongoDB.
 */
export interface KV {
  get<T = any>(key: string): Promise<T | null>;
  mget<T = any>(keys: string[]): Promise<(T | null)[]>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<void>;
  rpush(key: string, value: any): Promise<void>;
  ltrim(key: string, start: number, stop: number): Promise<void>;
  lrange<T = any>(key: string, start: number, stop: number): Promise<T[]>;
}

function parse(v: any) {
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
}

class UpstashKV implements KV {
  constructor(private r: Redis) {}
  async get(key: string) {
    return (await this.r.get(key)) as any;
  }
  async mget(keys: string[]) {
    if (!keys.length) return [];
    return (await this.r.mget(...keys)) as any;
  }
  async set(key: string, value: any, ttl?: number) {
    if (ttl) await this.r.set(key, value, { ex: ttl });
    else await this.r.set(key, value);
  }
  async del(key: string) {
    await this.r.del(key);
  }
  async incr(key: string) {
    return await this.r.incr(key);
  }
  async expire(key: string, ttl: number) {
    await this.r.expire(key, ttl);
  }
  async rpush(key: string, value: any) {
    await this.r.rpush(key, JSON.stringify(value));
  }
  async ltrim(key: string, s: number, e: number) {
    await this.r.ltrim(key, s, e);
  }
  async lrange(key: string, s: number, e: number) {
    const rows = await this.r.lrange(key, s, e);
    return rows.map(parse);
  }
}

class MemoryKV implements KV {
  private m = new Map<string, { v: any; exp?: number }>();
  private live(key: string) {
    const e = this.m.get(key);
    if (!e) return undefined;
    if (e.exp && e.exp < Date.now()) {
      this.m.delete(key);
      return undefined;
    }
    return e;
  }
  async get(key: string) {
    return this.live(key)?.v ?? null;
  }
  async mget(keys: string[]) {
    return keys.map((k) => this.live(k)?.v ?? null);
  }
  async set(key: string, value: any, ttl?: number) {
    this.m.set(key, { v: value, exp: ttl ? Date.now() + ttl * 1000 : undefined });
  }
  async del(key: string) {
    this.m.delete(key);
  }
  async incr(key: string) {
    const e = this.live(key);
    const n = (Number(e?.v) || 0) + 1;
    this.m.set(key, { v: n, exp: e?.exp });
    return n;
  }
  async expire(key: string, ttl: number) {
    const e = this.live(key);
    if (e) e.exp = Date.now() + ttl * 1000;
  }
  async rpush(key: string, value: any) {
    const e = this.live(key);
    const arr: any[] = e?.v || [];
    arr.push(value);
    this.m.set(key, { v: arr, exp: e?.exp });
  }
  async ltrim(key: string, s: number, e2: number) {
    const e = this.live(key);
    if (!e) return;
    const arr: any[] = e.v;
    const from = s < 0 ? Math.max(0, arr.length + s) : s;
    const to = e2 < 0 ? arr.length + e2 : e2;
    e.v = arr.slice(from, to + 1);
  }
  async lrange(key: string, s: number, e2: number) {
    const e = this.live(key);
    if (!e) return [];
    const arr: any[] = e.v;
    const from = s < 0 ? Math.max(0, arr.length + s) : s;
    const to = e2 < 0 ? arr.length + e2 : e2;
    return arr.slice(from, to + 1);
  }
}

const g = globalThis as unknown as { _kv?: KV };

export function kv(): KV {
  if (g._kv) return g._kv;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  g._kv = url && token ? new UpstashKV(new Redis({ url, token })) : new MemoryKV();
  return g._kv;
}
