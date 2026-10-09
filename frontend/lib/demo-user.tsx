"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setDemoUserId } from "@/lib/api";
import type { User } from "@/types";

interface DemoUserState {
  user: User | null;
  users: User[];
  ready: boolean;
  switchTo: (id: number) => void;
}
const Ctx = createContext<DemoUserState>({ user: null, users: [], ready: false, switchTo: () => {} });
export const useDemoUser = () => useContext(Ctx);

const KEY = "roamly-demo-user";

/** DEMO ONLY - picks which seeded account the API client acts as. Not authentication. */
export function DemoUserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .demoUsers()
      .then((list) => {
        if (!alive) return;
        let stored: number | null = null;
        try {
          stored = Number(localStorage.getItem(KEY)) || null;
        } catch {}
        const active = list.find((u) => u.id === stored) ?? list.find((u) => u.role === "guest") ?? list[0] ?? null;
        setDemoUserId(active?.id ?? null);
        setUsers(list);
        setUser(active);
      })
      .catch(() => {})
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const switchTo = useCallback(
    (id: number) => {
      const next = users.find((u) => u.id === id);
      if (!next) return;
      setDemoUserId(next.id); // before state updates so dependent fetches use the new identity
      try {
        localStorage.setItem(KEY, String(next.id));
      } catch {}
      setUser(next);
    },
    [users],
  );

  const value = useMemo(() => ({ user, users, ready, switchTo }), [user, users, ready, switchTo]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
