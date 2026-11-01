"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthProvider";
import { api } from "@/lib/api-client";
import { useToast } from "./ToastProvider";

type Ctx = { has: (id: string) => boolean; toggle: (id: string) => Promise<void> };
const C = createContext<Ctx>({ has: () => false, toggle: async () => {} });
export const useFavourites = () => useContext(C);

export function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const { me } = useAuth();
  const { toast } = useToast();
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!me?.onboarded) return setIds(new Set());
    api<{ ids: string[] }>("/favourites?ids=1").then((r) => setIds(new Set(r.ids))).catch(() => {});
  }, [me?.id, me?.onboarded]);

  const toggle = useCallback(async (id: string) => {
    const had = ids.has(id);
    setIds((s) => { const n = new Set(s); had ? n.delete(id) : n.add(id); return n; }); // optimistic
    try {
      if (had) await api(`/favourites?productId=${id}`, { method: "DELETE" });
      else await api("/favourites", { method: "POST", body: { productId: id } });
    } catch (e: any) {
      setIds((s) => { const n = new Set(s); had ? n.add(id) : n.delete(id); return n; });
      toast("error", e.message || "Couldn't update favourites.");
    }
  }, [ids, toast]);

  const value = useMemo(() => ({ has: (id: string) => ids.has(id), toggle }), [ids, toggle]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
