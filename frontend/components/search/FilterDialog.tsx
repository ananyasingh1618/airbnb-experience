"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { AmenityIcon } from "@/components/ui/Icons";
import { btn } from "@/components/ui/button";
import type { Meta } from "@/types";
import type { SearchState } from "@/lib/search";

interface Props {
  open: boolean;
  onClose: () => void;
  state: SearchState;
  meta: Meta | null;
  onApply: (patch: Partial<SearchState>) => void;
}

export function FilterDialog(props: Props) {
  // Mounted only while open, so the draft below always starts from the current URL filters.
  return props.open ? <FilterInner {...props} /> : null;
}

function FilterInner({ open, onClose, state, meta, onApply }: Props) {
  const [min, setMin] = useState(state.min_price);
  const [max, setMax] = useState(state.max_price);
  const [type, setType] = useState(state.property_type);
  const [amenities, setAmenities] = useState<string[]>(state.amenities);

  const invalid = min !== "" && max !== "" && Number(min) > Number(max);
  const toggleAmenity = (n: string) => setAmenities((l) => (l.includes(n) ? l.filter((x) => x !== n) : [...l, n]));
  const input = "w-full rounded-xl border border-line-strong bg-bg py-3 pl-7 pr-3 outline-none transition-shadow focus:border-ink focus:shadow-[0_0_0_1px_var(--text)]";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Filters"
      size="lg"
      footer={
        <div className="flex items-center justify-between">
          <button onClick={() => { setMin(""); setMax(""); setType(""); setAmenities([]); }} className="rounded-lg px-2 py-2 text-sm font-semibold underline">Clear all</button>
          <button
            disabled={invalid}
            onClick={() => { onApply({ min_price: min, max_price: max, property_type: type, amenities, page: 1 }); onClose(); }}
            className={btn("dark")}
          >
            Show results
          </button>
        </div>
      }
    >
      <div className="space-y-9 p-6">
        <section aria-labelledby="f-price">
          <h3 id="f-price" className="text-lg font-semibold">Price per night</h3>
          <p className="mb-4 text-sm text-ink-2">Nightly rate before fees, in USD</p>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <label htmlFor="f-min" className="sr-only">Minimum price</label>
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-2">$</span>
              <input id="f-min" inputMode="numeric" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} className={input} />
            </div>
            <span aria-hidden className="text-ink-2">–</span>
            <div className="relative flex-1">
              <label htmlFor="f-max" className="sr-only">Maximum price</label>
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-2">$</span>
              <input id="f-max" inputMode="numeric" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} className={input} />
            </div>
          </div>
          {invalid && <p role="alert" className="mt-2 text-sm text-danger">Minimum price can&apos;t be higher than the maximum.</p>}
        </section>

        <section aria-labelledby="f-type">
          <h3 id="f-type" className="mb-4 text-lg font-semibold">Property type</h3>
          <div className="flex flex-wrap gap-2.5">
            {(meta?.property_types ?? []).map((t) => (
              <button key={t} aria-pressed={type === t} onClick={() => setType(type === t ? "" : t)} className={`rounded-full border px-4 py-2 text-sm transition-colors ${type === t ? "border-ink bg-ink text-white" : "border-line-strong hover:border-ink"}`}>
                {t}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="f-amen">
          <h3 id="f-amen" className="mb-4 text-lg font-semibold">Amenities</h3>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {(meta?.amenities ?? []).map((a) => {
              const on = amenities.includes(a.name);
              return (
                <button key={a.id} aria-pressed={on} onClick={() => toggleAmenity(a.name)} className={`flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left text-sm transition-colors ${on ? "border-ink bg-surface shadow-[0_0_0_1px_var(--text)]" : "border-line-strong hover:border-ink"}`}>
                  <AmenityIcon name={a.icon} className="size-5 shrink-0" />
                  {a.name}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </Dialog>
  );
}
