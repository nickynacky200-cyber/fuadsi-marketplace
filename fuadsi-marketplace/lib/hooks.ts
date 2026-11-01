"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api-client";

export function useDebounce<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Minimal data hook. Pass null to skip. Ignores stale responses when the path changes. */
export function useApi<T = any>(path: string | null, opts: { auth?: boolean } = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (!path) return;
    const mine = ++seq.current;
    setLoading(true);
    try {
      const r = await api<T>(path, { auth: opts.auth });
      if (mine === seq.current) {
        setData(r);
        setError(null);
      }
    } catch (e: any) {
      if (mine === seq.current) setError(e?.message || "Something went wrong.");
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [path, opts.auth]);

  useEffect(() => {
    if (!path) {
      setData(null);
      setLoading(false);
      return;
    }
    load();
  }, [path, load]);

  return { data, error, loading, reload: load, setData };
}

export function useCartCount() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const read = () => {
      try {
        const lines = JSON.parse(localStorage.getItem("fuadsi.cart.v1") || "[]");
        setN(Array.isArray(lines) ? lines.reduce((s: number, l: any) => s + (l.quantity || 0), 0) : 0);
      } catch {
        setN(0);
      }
    };
    read();
    window.addEventListener("fuadsi:cart", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("fuadsi:cart", read);
      window.removeEventListener("storage", read);
    };
  }, []);
  return n;
}
