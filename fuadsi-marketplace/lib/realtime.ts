import { kv } from "./kv";

export type RtEvent = { id: number; type: string; data: any };

const EV_TTL = 60 * 60 * 24;
const KEEP = 100;

/** Publish an event to one user's inbox (read by their open stream or poll). */
export async function publish(userId: string, type: string, data: any) {
  try {
    const id = await kv().incr(`evseq:${userId}`);
    await kv().rpush(`ev:${userId}`, { id, type, data });
    await kv().ltrim(`ev:${userId}`, -KEEP, -1);
    await kv().expire(`ev:${userId}`, EV_TTL);
    await kv().expire(`evseq:${userId}`, EV_TTL);
  } catch (e) {
    console.error("[realtime] publish failed", (e as Error).message);
  }
}

export async function currentSeq(userId: string): Promise<number> {
  return Number((await kv().get(`evseq:${userId}`)) || 0);
}

export async function eventsSince(userId: string, after: number): Promise<RtEvent[]> {
  const rows = await kv().lrange<RtEvent>(`ev:${userId}`, -KEEP, -1);
  return rows.filter((r) => r && r.id > after).sort((a, b) => a.id - b.id);
}

const PRESENCE_TTL = 40;
export async function markOnline(userId: string) {
  await kv().set(`presence:${userId}`, Date.now(), PRESENCE_TTL);
}

export async function onlineMap(ids: string[]): Promise<Record<string, boolean>> {
  const vals = await kv().mget(ids.map((i) => `presence:${i}`));
  const out: Record<string, boolean> = {};
  ids.forEach((id, i) => (out[id] = vals[i] != null));
  return out;
}
