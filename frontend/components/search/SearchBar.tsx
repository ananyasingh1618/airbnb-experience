"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapPin, Search, X } from "lucide-react";
import { DateRangePicker, type DateValue } from "@/components/search/DateRangePicker";
import { GuestSelector } from "@/components/search/GuestSelector";
import { Dialog } from "@/components/ui/Dialog";
import { btn } from "@/components/ui/button";
import { useClickOutside } from "@/lib/hooks";
import { formatDate, plural } from "@/lib/format";
import { EMPTY_SEARCH, parseSearch, toQuery } from "@/lib/search";

type Panel = "where" | "in" | "out" | "who" | null;
const SUGGESTIONS = ["Whistler, Canada", "Tulum, Mexico", "Paris, France", "Lagos, Portugal", "Banff, Canada", "Mykonos, Greece"];

function useDraft() {
  const sp = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const current = parseSearch(sp);
  const urlKey = `${current.q}|${current.check_in}|${current.check_out}|${current.guests}`;
  const [q, setQ] = useState(current.q);
  const [dates, setDates] = useState<DateValue>({ check_in: current.check_in, check_out: current.check_out });
  const [guests, setGuests] = useState(current.guests);

  // Keep the inputs in sync when the URL changes (reset filters, back button, shared link).
  const [syncedKey, setSyncedKey] = useState(urlKey + pathname);
  if (syncedKey !== urlKey + pathname) {
    setSyncedKey(urlKey + pathname);
    setQ(current.q);
    setDates({ check_in: current.check_in, check_out: current.check_out });
    setGuests(current.guests);
  }

  const submit = () => {
    const base = pathname === "/" ? current : EMPTY_SEARCH;
    const next = { ...base, q, check_in: dates.check_in, check_out: dates.check_out, guests, page: 1 };
    router.push(`/?${toQuery(next).toString()}`);
  };
  return { q, setQ, dates, setDates, guests, setGuests, submit };
}

const seg =
  "relative flex h-full min-w-0 flex-col justify-center rounded-full px-8 text-left transition-colors hover:bg-[#ebebeb] data-[active=true]:bg-bg data-[active=true]:shadow-pop " +
  "[&:not(:first-child)]:before:absolute [&:not(:first-child)]:before:left-0 [&:not(:first-child)]:before:top-[26%] [&:not(:first-child)]:before:h-[48%] [&:not(:first-child)]:before:w-px [&:not(:first-child)]:before:bg-line [&:hover]:before:opacity-0 [&[data-active=true]]:before:opacity-0";

export function SearchBar({ mode, onSubmitted }: { mode: "mobile" | "desktop"; onSubmitted?: () => void }) {
  const d = useDraft();
  const [panel, setPanel] = useState<Panel>(null);
  const wrap = useRef<HTMLDivElement>(null);
  useClickOutside(wrap, () => setPanel(null), panel !== null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = () => {
    setPanel(null);
    setMobileOpen(false);
    d.submit();
    onSubmitted?.();
  };

  const summary = d.q || "Where to?";
  const dateSummary =
    d.dates.check_in && d.dates.check_out
      ? `${formatDate(d.dates.check_in, "MMM d")} – ${formatDate(d.dates.check_out, "MMM d")}`
      : "Add dates";

  return (
    <>
      {mode === "mobile" && <>
      {/* Mobile: compact trigger that opens a full-screen search sheet */}
      <button
        onClick={() => setMobileOpen(true)}
        className="flex w-full items-center gap-3 rounded-full border border-line px-4 py-2.5 text-left shadow-search md:hidden"
        aria-label="Open search"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{summary}</span>
          <span className="block truncate text-xs text-ink-2">
            {dateSummary} · {d.guests ? plural(d.guests, "guest") : "Add guests"}
          </span>
        </span>
      </button>

      <Dialog open={mobileOpen} onClose={() => setMobileOpen(false)} title="Search stays" footer={
        <div className="flex items-center justify-between">
          <button onClick={() => { d.setQ(""); d.setDates({ check_in: "", check_out: "" }); d.setGuests(0); }} className="text-sm font-semibold underline">Clear all</button>
          <button onClick={go} className={btn("brand")}><Search className="size-4" />Search</button>
        </div>
      }>
        <form onSubmit={(e) => { e.preventDefault(); go(); }} className="space-y-6 p-5">
          <section>
            <label htmlFor="m-where" className="mb-2 block text-lg font-semibold">Where?</label>
            <div className="flex items-center gap-2 rounded-xl border border-line-strong px-3">
              <MapPin className="size-4 text-ink-2" aria-hidden />
              <input id="m-where" value={d.q} onChange={(e) => d.setQ(e.target.value)} placeholder="Search destinations" className="w-full bg-transparent py-3 outline-none" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.slice(0, 4).map((s) => (
                <button key={s} type="button" onClick={() => d.setQ(s)} className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-ink">{s}</button>
              ))}
            </div>
          </section>
          <section>
            <h3 className="mb-2 text-lg font-semibold">When?</h3>
            <div className="flex justify-center rounded-xl border border-line p-2">
              <DateRangePicker value={d.dates} onChange={d.setDates} months={1} />
            </div>
          </section>
          <section>
            <h3 className="mb-3 text-lg font-semibold">Who?</h3>
            <GuestSelector value={d.guests} onChange={d.setGuests} min={0} hint="Ages 13 or above" />
          </section>
        </form>
      </Dialog>

      </>}

      {/* Desktop: segmented pill */}
      {mode === "desktop" && <div ref={wrap} className="relative mx-auto w-full max-w-[850px]">
        <form
          onSubmit={(e) => { e.preventDefault(); go(); }}
          role="search"
          aria-label="Search stays"
          className={`grid h-[66px] grid-cols-[1.45fr_1fr_1fr_1.25fr] items-stretch rounded-full border border-line pr-2 shadow-search transition-shadow hover:shadow-pop ${panel ? "bg-[#ebebeb]" : "bg-bg"}`}
        >
          <label data-active={panel === "where"} className={`${seg} cursor-text`} onClick={() => setPanel("where")}>
            <span className="text-xs font-semibold">Where</span>
            <input
              value={d.q}
              onChange={(e) => d.setQ(e.target.value)}
              onFocus={() => setPanel("where")}
              placeholder="Search destinations"
              autoComplete="off"
              className="w-full truncate bg-transparent text-sm outline-none placeholder:text-ink-2"
            />
          </label>
          <button type="button" data-active={panel === "in"} className={seg} onClick={() => setPanel("in")} aria-haspopup="dialog" aria-expanded={panel === "in"}>
            <span className="text-xs font-semibold">Check in</span>
            <span className={`text-sm ${d.dates.check_in ? "" : "text-ink-2"}`}>{d.dates.check_in ? formatDate(d.dates.check_in, "MMM d") : "Add dates"}</span>
          </button>
          <button type="button" data-active={panel === "out"} className={seg} onClick={() => setPanel("out")} aria-haspopup="dialog" aria-expanded={panel === "out"}>
            <span className="text-xs font-semibold">Check out</span>
            <span className={`text-sm ${d.dates.check_out ? "" : "text-ink-2"}`}>{d.dates.check_out ? formatDate(d.dates.check_out, "MMM d") : "Add dates"}</span>
          </button>
          <div className="relative flex items-center">
            <button type="button" data-active={panel === "who"} className={`${seg} h-full flex-1`} onClick={() => setPanel("who")} aria-haspopup="dialog" aria-expanded={panel === "who"}>
              <span className="text-xs font-semibold">Who</span>
              <span className={`text-sm ${d.guests ? "" : "text-ink-2"}`}>{d.guests ? plural(d.guests, "guest") : "Add guests"}</span>
            </button>
            <button type="submit" aria-label="Search" className="grid size-12 shrink-0 place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-hover active:scale-95">
              <Search className="size-4" strokeWidth={3} />
            </button>
          </div>
        </form>

        {panel && (
          <div className="anim-pop absolute left-0 top-[calc(100%+12px)] z-50 rounded-3xl border border-line bg-bg p-6 shadow-pop" style={panel === "in" || panel === "out" ? { left: "50%", transform: "translateX(-50%)", width: "max-content", maxWidth: "calc(100vw - 32px)" } : panel === "who" ? { left: "auto", right: 0, width: 340 } : { width: 380 }}>
            {panel === "where" && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-2">Popular destinations</p>
                <ul className="space-y-1">
                  {SUGGESTIONS.map((s) => (
                    <li key={s}>
                      <button type="button" onClick={() => { d.setQ(s); setPanel("in"); }} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-2">
                        <span className="grid size-10 place-items-center rounded-lg bg-surface-2"><MapPin className="size-4" /></span>
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(panel === "in" || panel === "out") && (
              <div>
                <DateRangePicker
                  value={d.dates}
                  onChange={(v) => { d.setDates(v); if (v.check_in && v.check_out) setPanel("who"); else setPanel("out"); }}
                />
                {(d.dates.check_in || d.dates.check_out) && (
                  <button type="button" onClick={() => { d.setDates({ check_in: "", check_out: "" }); setPanel("in"); }} className="mt-2 flex items-center gap-1 text-sm font-semibold underline">
                    <X className="size-3.5" />Clear dates
                  </button>
                )}
              </div>
            )}
            {panel === "who" && <GuestSelector value={d.guests} onChange={d.setGuests} min={0} hint="Ages 13 or above" />}
          </div>
        )}
      </div>}
    </>
  );
}

/** Airbnb's collapsed header pill ("Anywhere | Any week | Add guests"). */
export function CompactSearch({ onOpen }: { onOpen: () => void }) {
  const s = parseSearch(useSearchParams());
  const part = "px-4 text-sm font-medium first:pl-5";
  const dates = s.check_in && s.check_out ? `${formatDate(s.check_in, "MMM d")} – ${formatDate(s.check_out, "MMM d")}` : "Any week";
  return (
    <button
      onClick={onOpen}
      aria-label="Start your search"
      className="mx-auto flex h-12 items-center divide-x divide-line rounded-full border border-line bg-bg py-1 pr-2 text-left shadow-search transition-shadow hover:shadow-pop"
    >
      <span className={`${part} max-w-[200px] truncate`}>{s.q || "Anywhere"}</span>
      <span className={`${part} whitespace-nowrap`}>{dates}</span>
      <span className={`${part} whitespace-nowrap ${s.guests ? "" : "font-normal text-ink-2"}`}>{s.guests ? plural(s.guests, "guest") : "Add guests"}</span>
      <span className="ml-1 grid size-8 shrink-0 place-items-center rounded-full bg-brand text-white"><Search className="size-3.5" strokeWidth={3} /></span>
    </button>
  );
}
