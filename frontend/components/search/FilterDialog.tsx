"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Snowflake, UtensilsCrossed, Wifi, CarFront } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { api } from "@/lib/api";
import { CATEGORY_LABELS, money } from "@/lib/format";
import { toApiParams, type SearchState } from "@/lib/search";
import type { Meta } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  state: SearchState;
  meta: Meta | null;
  onApply: (patch: Partial<SearchState>) => void;
}

const RECOMMENDED = [
  { name: "Kitchen", Icon: UtensilsCrossed }, { name: "Free parking", Icon: CarFront },
  { name: "Wifi", Icon: Wifi }, { name: "Air conditioning", Icon: Snowflake },
];
const BINS = 36;

export function FilterDialog(props: Props) {
  // Mounted only while open, so the draft below always starts from the current URL filters.
  return props.open ? <FilterInner {...props} /> : null;
}

function FilterInner({ open, onClose, state, meta, onApply }: Props) {
  const [min, setMin] = useState(state.min_price);
  const [max, setMax] = useState(state.max_price);
  const [type, setType] = useState(state.property_type);
  const [category, setCategory] = useState(state.category);
  const [amenities, setAmenities] = useState<string[]>(state.amenities);
  const [showAll, setShowAll] = useState(false);
  const [prices, setPrices] = useState<number[]>([]);
  const [count, setCount] = useState<number | null>(null);

  // Real nightly prices drive the histogram and the slider range.
  useEffect(() => {
    api.listings({ page_size: 48 }).then((r) => setPrices(r.items.map((l) => Math.round(l.price_per_night_cents / 100)))).catch(() => {});
  }, []);
  const lo = prices.length ? Math.floor(Math.min(...prices) / 10) * 10 : 0;
  const hi = prices.length ? Math.ceil(Math.max(...prices) / 10) * 10 : 500;
  const curMin = min === "" ? lo : Math.max(lo, Number(min));
  const curMax = max === "" ? hi : Math.min(hi, Number(max));
  const bins = useMemo(() => {
    const b = new Array(BINS).fill(0);
    for (const p of prices) b[Math.min(BINS - 1, Math.floor(((p - lo) / Math.max(1, hi - lo)) * BINS))]++;
    return b;
  }, [prices, lo, hi]);
  const peak = Math.max(1, ...bins);

  // Live result count for the "Show N places" button (keeps the current search + dates).
  useEffect(() => {
    const t = setTimeout(() => {
      const draft: SearchState = { ...state, min_price: min, max_price: max, property_type: type, category, amenities, page: 1 };
      api.listings({ ...toApiParams(draft, 1) }).then((r) => setCount(r.total)).catch(() => setCount(null));
    }, 250);
    return () => clearTimeout(t);
  }, [min, max, type, category, amenities, state]);

  const invalid = min !== "" && max !== "" && Number(min) > Number(max);
  const dirty = Boolean(min || max || type || category || amenities.length);
  const toggle = (n: string) => setAmenities((l) => (l.includes(n) ? l.filter((x) => x !== n) : [...l, n]));
  const sectionH = "mb-1 text-[22px] font-medium tracking-[-0.02em]";
  const pill = "w-full rounded-full border border-[#b0b0b0] bg-white py-3 pl-8 pr-4 text-base outline-none focus:border-ink focus:shadow-[0_0_0_1px_var(--text)]";
  const allAmenities = meta?.amenities ?? [];
  const shown = showAll ? allAmenities : allAmenities.slice(0, 8);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Filters"
      closeRight
      footer={
        <div className="flex items-center justify-between">
          <button disabled={!dirty} onClick={() => { setMin(""); setMax(""); setType(""); setCategory(""); setAmenities([]); }} className="rounded-lg px-2 py-2 text-base font-medium underline disabled:text-[#b0b0b0] disabled:no-underline">Clear all</button>
          <button
            disabled={invalid}
            onClick={() => { onApply({ min_price: min, max_price: max, property_type: type, category, amenities, page: 1 }); onClose(); }}
            className="rounded-lg bg-ink px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-black disabled:opacity-50"
          >
            {count === null ? "Show places" : `Show ${count} ${count === 1 ? "place" : "places"}`}
          </button>
        </div>
      }
    >
      <div className="px-6">
        <section className="border-b border-[#ebebeb] py-8" aria-labelledby="f-rec">
          <h3 id="f-rec" className={`${sectionH} mb-5`}>Recommended for you</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {RECOMMENDED.map(({ name, Icon }) => {
              const on = amenities.includes(name);
              return (
                <button key={name} aria-pressed={on} onClick={() => toggle(name)} className={`flex flex-col items-start justify-between gap-5 rounded-xl border p-4 text-left text-sm font-medium transition-colors ${on ? "border-ink bg-[#f7f7f7] shadow-[0_0_0_1px_var(--text)]" : "border-[#ddd] hover:border-ink"}`}>
                  <Icon className="size-8" strokeWidth={1.25} aria-hidden />{name}
                </button>
              );
            })}
          </div>
        </section>

        <section className="border-b border-[#ebebeb] py-8" aria-labelledby="f-price">
          <h3 id="f-price" className={sectionH}>Price range</h3>
          <p className="mb-4 text-base text-ink-2">Nightly price before fees</p>
          <div className="relative mx-2 h-20">
            <div className="absolute inset-x-0 bottom-3 flex h-16 items-end gap-[2px]" aria-hidden>
              {bins.map((c, i) => {
                const mid = lo + ((i + 0.5) / BINS) * (hi - lo);
                const inRange = mid >= curMin && mid <= curMax;
                return <span key={i} className="flex-1 rounded-t-sm transition-colors" style={{ height: `${Math.max(4, (c / peak) * 100)}%`, background: inRange ? "#ff385c" : "#dddddd" }} />;
              })}
            </div>
            <div className="absolute inset-x-0 bottom-0 h-3">
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#ddd]" />
              <div className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-ink" style={{ left: `${((curMin - lo) / Math.max(1, hi - lo)) * 100}%`, right: `${100 - ((curMax - lo) / Math.max(1, hi - lo)) * 100}%` }} />
              {(["min", "max"] as const).map((k) => (
                <input key={k} type="range" min={lo} max={hi} step={10} value={k === "min" ? curMin : curMax} aria-label={k === "min" ? "Minimum price" : "Maximum price"}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (k === "min") { const nv = Math.min(v, curMax - 10); setMin(nv <= lo ? "" : String(nv)); }
                    else { const nv = Math.max(v, curMin + 10); setMax(nv >= hi ? "" : String(nv)); }
                  }}
                  className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-8 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-[#b0b0b0] [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-8 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[#b0b0b0] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm"
                  style={{ top: -10 }} />
              ))}
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="relative w-36"><label htmlFor="f-min" className="absolute left-4 top-1.5 text-xs text-ink-2">Minimum</label>
              <span className="pointer-events-none absolute bottom-3 left-4 text-base">$</span>
              <input id="f-min" inputMode="numeric" value={min} placeholder={String(lo)} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} className={`${pill} pb-2 pt-6 pl-8`} /></div>
            <span aria-hidden className="h-px w-3 bg-ink-2" />
            <div className="relative w-36"><label htmlFor="f-max" className="absolute left-4 top-1.5 text-xs text-ink-2">Maximum</label>
              <span className="pointer-events-none absolute bottom-3 left-4 text-base">$</span>
              <input id="f-max" inputMode="numeric" value={max} placeholder={`${hi}+`} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} className={`${pill} pb-2 pt-6 pl-8`} /></div>
          </div>
          {invalid && <p role="alert" className="mt-3 text-sm text-danger">Minimum price can&apos;t be higher than the maximum ({money(Number(max) * 100)}).</p>}
        </section>

        <section className="border-b border-[#ebebeb] py-8" aria-labelledby="f-cat">
          <h3 id="f-cat" className={`${sectionH} mb-5`}>Category</h3>
          <div className="flex flex-wrap gap-3">
            {(meta?.categories ?? []).map((c) => (
              <button key={c} aria-pressed={category === c} onClick={() => setCategory(category === c ? "" : c)} className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${category === c ? "border-ink bg-[#f7f7f7] shadow-[0_0_0_1px_var(--text)]" : "border-[#ddd] hover:border-ink"}`}>{CATEGORY_LABELS[c] ?? c}</button>
            ))}
          </div>
        </section>

        <section className="border-b border-[#ebebeb] py-8" aria-labelledby="f-type">
          <h3 id="f-type" className={`${sectionH} mb-5`}>Property type</h3>
          <div className="flex flex-wrap gap-3">
            {(meta?.property_types ?? []).map((t) => (
              <button key={t} aria-pressed={type === t} onClick={() => setType(type === t ? "" : t)} className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${type === t ? "border-ink bg-[#f7f7f7] shadow-[0_0_0_1px_var(--text)]" : "border-[#ddd] hover:border-ink"}`}>{t}</button>
            ))}
          </div>
        </section>

        <section className="py-8" aria-labelledby="f-amen">
          <h3 id="f-amen" className={`${sectionH} mb-5`}>Amenities</h3>
          <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {shown.map((a) => {
              const on = amenities.includes(a.name);
              return (
                <li key={a.id}>
                  <label className="flex cursor-pointer items-center gap-4 text-base">
                    <input type="checkbox" checked={on} onChange={() => toggle(a.name)} className="peer sr-only" />
                    <span className={`grid size-6 shrink-0 place-items-center rounded-md border transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 ${on ? "border-ink bg-ink text-white" : "border-[#b0b0b0]"}`}>{on && <Check className="size-4" strokeWidth={3} />}</span>
                    {a.name}
                  </label>
                </li>
              );
            })}
          </ul>
          {allAmenities.length > 8 && <button onClick={() => setShowAll((v) => !v)} className="mt-6 text-base font-medium underline">{showAll ? "Show less" : "Show more"}</button>}
        </section>
      </div>
    </Dialog>
  );
}
