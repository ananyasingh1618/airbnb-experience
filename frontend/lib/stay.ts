"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface Stay { check_in: string; check_out: string; guests: number; children: number; infants: number; pets: number }

/** Trip dates + guest count live in the URL so they survive refresh and carry into checkout. */
export function useStay() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const stay: Stay = {
    check_in: sp.get("check_in") ?? "",
    check_out: sp.get("check_out") ?? "",
    guests: Math.max(1, Number(sp.get("guests")) || 1),
    children: Math.max(0, Number(sp.get("children")) || 0),
    infants: Math.max(0, Number(sp.get("infants")) || 0),
    pets: Math.max(0, Number(sp.get("pets")) || 0),
  };
  const setStay = useCallback(
    (patch: Partial<Stay>) => {
      const p = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === "" || v === undefined || v === 0 && k !== "guests") p.delete(k);
        else p.set(k, String(v));
      }
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [sp, router, pathname],
  );
  return { stay, setStay, hasDates: Boolean(stay.check_in && stay.check_out) };
}

export const stayQuery = (s: Stay) =>
  new URLSearchParams({
    ...(s.check_in && s.check_out ? { check_in: s.check_in, check_out: s.check_out } : {}),
    guests: String(s.guests),
    ...(s.children ? { children: String(s.children) } : {}),
    ...(s.infants ? { infants: String(s.infants) } : {}),
    ...(s.pets ? { pets: String(s.pets) } : {}),
  }).toString();
