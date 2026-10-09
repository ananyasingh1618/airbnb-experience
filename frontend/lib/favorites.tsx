"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useDemoUser } from "@/lib/demo-user";
import { useToast } from "@/components/ui/Toast";

interface FavState {
  isFavorite: (id: number) => boolean;
  toggle: (id: number) => Promise<void>;
  pending: (id: number) => boolean;
  version: number; // bumps on every change so "saved only" views can refetch
}
const Ctx = createContext<FavState>({ isFavorite: () => false, toggle: async () => {}, pending: () => false, version: 0 });
export const useFavorites = () => useContext(Ctx);

/** Single source of truth for favourites so every card / button stays in sync. */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user, ready } = useDemoUser();
  const { toast } = useToast();
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState<Set<number>>(new Set());
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!ready || !user) return;
    let alive = true;
    api
      .favorites()
      .then((l) => alive && setIds(new Set(l)))
      .catch(() => alive && setIds(new Set()));
    return () => {
      alive = false;
    };
  }, [ready, user]);

  const toggle = useCallback(
    async (id: number) => {
      if (!user) return toast("Choose a demo account to save favorites.", "error");
      if (busy.has(id)) return;
      const was = ids.has(id);
      const apply = (on: boolean) =>
        setIds((s) => {
          const n = new Set(s);
          if (on) n.add(id);
          else n.delete(id);
          return n;
        });
      apply(!was); // optimistic
      setBusy((s) => new Set(s).add(id));
      try {
        if (was) await api.removeFavorite(id);
        else await api.addFavorite(id);
        setVersion((v) => v + 1);
        toast(was ? "Removed from saved" : "Saved to your favorites", "success");
      } catch (e) {
        apply(was); // roll back so UI never lies about persisted state
        toast(e instanceof Error ? e.message : "Couldn't update favorites", "error");
      } finally {
        setBusy((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
      }
    },
    [user, ids, busy, toast],
  );

  const value = useMemo(
    () => ({ isFavorite: (id: number) => ids.has(id), toggle, pending: (id: number) => busy.has(id), version }),
    [ids, toggle, busy, version],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
