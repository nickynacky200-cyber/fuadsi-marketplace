"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { api, getToken } from "@/lib/api-client";

type Handler = (data: any) => void;
type RtCtx = {
  counts: { notifications: number; messages: number };
  connected: boolean;
  refreshCounts: () => Promise<void>;
  subscribe: (type: string, fn: Handler) => () => void;
};
const Ctx = createContext<RtCtx>({ counts: { notifications: 0, messages: 0 }, connected: false, refreshCounts: async () => {}, subscribe: () => () => {} });
export const useRealtime = () => useContext(Ctx);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Client side of the realtime layer: a streaming fetch to /api/realtime/stream (Server-Sent Events over HTTP)
 * with automatic reconnection, replay from the last event id and an HTTP polling fallback.
 * The stream is paused while the tab is hidden to save data and Redis commands.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { me } = useAuth();
  const [counts, setCounts] = useState({ notifications: 0, messages: 0 });
  const [connected, setConnected] = useState(false);
  const listeners = useRef(new Map<string, Set<Handler>>());

  const subscribe = useCallback((type: string, fn: Handler) => {
    if (!listeners.current.has(type)) listeners.current.set(type, new Set());
    listeners.current.get(type)!.add(fn);
    return () => listeners.current.get(type)?.delete(fn);
  }, []);

  const refreshCounts = useCallback(async () => {
    try {
      setCounts(await api("/me/counts"));
    } catch {
      /* ignore transient errors */
    }
  }, []);

  useEffect(() => {
    if (!me?.onboarded) {
      setCounts({ notifications: 0, messages: 0 });
      return;
    }
    let stop = false;
    let after: number | null = null;
    let failures = 0;
    let ctrl: AbortController | null = null;

    const dispatch = (type: string, data: any, id?: number) => {
      if (id) after = Math.max(after ?? 0, id);
      if (type === "message") setCounts((c) => ({ ...c, messages: c.messages + 1 }));
      if (type === "notification" && !data?.silent) setCounts((c) => ({ ...c, notifications: c.notifications + 1 }));
      listeners.current.get(type)?.forEach((fn) => fn(data));
      listeners.current.get("*")?.forEach((fn) => fn({ type, data }));
    };

    const handleFrame = (frame: string) => {
      let id: number | undefined, type = "message", data = "";
      for (const line of frame.split("\n")) {
        if (line.startsWith("id:")) id = parseInt(line.slice(3).trim(), 10);
        else if (line.startsWith("event:")) type = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (!data) return;
      let parsed: any;
      try {
        parsed = JSON.parse(data);
      } catch {
        return;
      }
      if (type === "hello") {
        if (after === null) after = parsed.seq;
        return;
      }
      if (type === "reconnect") {
        after = Math.max(after ?? 0, parsed.after || 0);
        return;
      }
      dispatch(type, parsed, id);
    };

    const pollOnce = async () => {
      try {
        const r = await api<{ events: any[]; seq: number }>(`/realtime/poll${after === null ? "" : `?after=${after}`}`);
        if (after === null) after = r.seq;
        r.events.forEach((ev) => dispatch(ev.type, ev.data, ev.id));
      } catch {
        /* retry next loop */
      }
    };

    const run = async () => {
      await refreshCounts();
      while (!stop) {
        if (document.hidden) {
          await sleep(1000);
          continue;
        }
        try {
          const token = await getToken();
          if (!token) {
            await sleep(2000);
            continue;
          }
          ctrl = new AbortController();
          const res = await fetch(`/api/realtime/stream${after === null ? "" : `?after=${after}`}`, { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal, cache: "no-store" });
          if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);
          failures = 0;
          setConnected(true);
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          let buf = "";
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            let i;
            while ((i = buf.indexOf("\n\n")) >= 0) {
              handleFrame(buf.slice(0, i));
              buf = buf.slice(i + 2);
            }
          }
        } catch {
          if (stop) break;
          failures++;
        }
        setConnected(false);
        if (stop) break;
        if (failures >= 3) {
          await pollOnce();
          await sleep(5000);
        } else {
          await sleep(failures ? Math.min(1000 * 2 ** failures, 15000) : 300);
        }
      }
    };

    const onVisibility = () => {
      if (document.hidden) ctrl?.abort();
      else refreshCounts();
    };
    const onOnline = () => {
      failures = 0;
      ctrl?.abort();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    run();
    return () => {
      stop = true;
      ctrl?.abort();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, [me?.id, me?.onboarded, refreshCounts]);

  const value = useMemo(() => ({ counts, connected, refreshCounts, subscribe }), [counts, connected, refreshCounts, subscribe]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
