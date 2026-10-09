"use client";

import { Minus, Plus } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export interface GuestCounts { adults: number; children: number; infants: number; pets: number }

function Stepper({ value, onChange, min = 0, max = 99, label }: { value: number; onChange: (n: number) => void; min?: number; max?: number; label: string }) {
  const b = "grid size-8 place-items-center rounded-full border border-line-strong text-ink-2 transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-line-strong disabled:hover:text-ink-2";
  return (
    <div className="flex items-center gap-4">
      <button type="button" className={b} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`Decrease ${label}`}><Minus className="size-3.5" /></button>
      <output aria-live="polite" className="w-5 text-center text-base tabular-nums">{value}</output>
      <button type="button" className={b} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`Increase ${label}`}><Plus className="size-3.5" /></button>
    </div>
  );
}

/** Adults / Children / Infants / Pets, as in Airbnb's guest picker. Only adults + children count as guests. */
export function GuestsPanel({ value, onChange, maxGuests = 16, maxPets = 5, compact = false, minAdults = 0 }: { value: GuestCounts; onChange: (v: GuestCounts) => void; maxGuests?: number; maxPets?: number; compact?: boolean; minAdults?: number }) {
  const { toast } = useToast();
  const total = value.adults + value.children;
  const row = `flex items-center justify-between ${compact ? "py-4" : "py-5"}`;
  const set = (patch: Partial<GuestCounts>) => {
    const next = { ...value, ...patch };
    // Adding children/infants implies at least one adult, as on Airbnb.
    if ((next.children > 0 || next.infants > 0 || next.pets > 0) && next.adults === 0) next.adults = 1;
    onChange(next);
  };
  return (
    <div className="divide-y divide-line">
      <div className={row}>
        <div><p className="text-base font-medium">Adults</p><p className="text-sm text-ink-2">Ages 13 or above</p></div>
        <Stepper label="adults" value={value.adults} min={minAdults} max={maxGuests - value.children} onChange={(adults) => set({ adults })} />
      </div>
      <div className={row}>
        <div><p className="text-base font-medium">Children</p><p className="text-sm text-ink-2">Ages 2–12</p></div>
        <Stepper label="children" value={value.children} max={maxGuests - value.adults} onChange={(children) => set({ children })} />
      </div>
      <div className={row}>
        <div><p className="text-base font-medium">Infants</p><p className="text-sm text-ink-2">Under 2</p></div>
        <Stepper label="infants" value={value.infants} max={5} onChange={(infants) => set({ infants })} />
      </div>
      <div className={row}>
        <div>
          <p className="text-base font-medium">Pets</p>
          <button type="button" onClick={() => toast("Service animals are always welcome — this demo has no separate policy.", "info")} className="text-sm text-ink-2 underline">Bringing a service animal?</button>
        </div>
        <Stepper label="pets" value={value.pets} max={maxPets} onChange={(pets) => set({ pets })} />
      </div>
      {total >= maxGuests && <p className="pt-4 text-sm text-ink-2">This place has a maximum of {maxGuests} guests, not including infants.</p>}
    </div>
  );
}
