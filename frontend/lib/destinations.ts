"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface Destination { name: string; sub: string; category: string }

const SUBTITLES: Record<string, string> = {
  beachfront: "Popular beach destination", lakefront: "Great for a lake getaway", mountains: "For nature lovers",
  cabins: "For nature lovers", pools: "Great for a pool getaway", design: "For its stunning architecture",
  countryside: "Peaceful countryside stays", "amazing-views": "For its stunning views", "tiny-homes": "Cosy tiny homes", unique: "For something different",
};

let cache: Destination[] | null = null;

/** Search suggestions built from the real inventory, so every suggestion returns results. */
export function useDestinations(enabled: boolean) {
  const [list, setList] = useState<Destination[]>(cache ?? []);
  useEffect(() => {
    if (!enabled || cache) return;
    let alive = true;
    api.listings({ page_size: 48 }).then((r) => {
      const seen = new Map<string, Destination>();
      for (const l of [...r.items].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))) if (!seen.has(l.location)) seen.set(l.location, { name: l.location, sub: SUBTITLES[l.category] ?? "Popular destination", category: l.category });
      cache = [...seen.values()];
      if (alive) setList(cache);
    }).catch(() => {});
    return () => { alive = false; };
  }, [enabled]);
  return list;
}

export function filterDestinations(all: Destination[], q: string, limit = 6): Destination[] {
  const t = q.trim().toLowerCase();
  const hits = t ? all.filter((d) => d.name.toLowerCase().includes(t)) : all;
  return hits.slice(0, limit);
}
