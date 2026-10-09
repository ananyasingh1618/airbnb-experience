"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, House, MapPin, Search, X } from "lucide-react";
import { DateRangePicker, type DateValue } from "@/components/search/DateRangePicker";
import { GuestsPanel, type GuestCounts } from "@/components/search/GuestsPanel";
import { Dialog } from "@/components/ui/Dialog";
import { useClickOutside } from "@/lib/hooks";
import { filterDestinations, useDestinations } from "@/lib/destinations";
import { formatDate, formatRange } from "@/lib/format";
import { EMPTY_SEARCH, guestSummary, parseSearch, toQuery } from "@/lib/search";

type Panel = "where" | "when" | "who" | null;

function useDraft() {
  const sp = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const current = parseSearch(sp);
  const urlKey = `${current.q}|${current.check_in}|${current.check_out}|${current.guests}|${current.children}|${current.infants}|${current.pets}|${pathname}`;
  const fromUrl = () => ({
    q: current.q,
    dates: { check_in: current.check_in, check_out: current.check_out } as DateValue,
    guests: { adults: current.guests - current.children, children: current.children, infants: current.infants, pets: current.pets } as GuestCounts,
  });
  const [q, setQ] = useState(current.q);
  const [dates, setDates] = useState<DateValue>(fromUrl().dates);
  const [guests, setGuests] = useState<GuestCounts>(fromUrl().guests);

  // Keep the inputs in sync when the URL changes (reset filters, back button, shared link).
  const [syncedKey, setSyncedKey] = useState(urlKey);
  if (syncedKey !== urlKey) {
    const u = fromUrl();
    setSyncedKey(urlKey);
    setQ(u.q);
    setDates(u.dates);
    setGuests(u.guests);
  }

  const total = guests.adults + guests.children;
  const submit = () => {
    const base = pathname === "/" ? current : EMPTY_SEARCH;
    const next = { ...base, q, check_in: dates.check_in, check_out: dates.check_out, guests: total, children: guests.children, infants: guests.infants, pets: guests.pets, page: 1, homes: base.homes || (!q && !dates.check_in && !total) };
    router.push(`/?${toQuery(next).toString()}`);
  };
  const clear = () => { setQ(""); setDates({ check_in: "", check_out: "" }); setGuests({ adults: 0, children: 0, infants: 0, pets: 0 }); };
  return { q, setQ, dates, setDates, guests, setGuests, total, submit, clear };
}

function WherePanel({ query, onPick }: { query: string; onPick: (name: string) => void }) {
  const all = useDestinations(true);
  const items = filterDestinations(all, query);
  return (
    <div>
      <p className="mb-2 px-3 text-xs font-semibold text-ink-2">{query.trim() ? "Matching destinations" : "Suggested destinations"}</p>
      {items.length === 0 ? (
        <p className="px-3 py-4 text-sm text-ink-2">{all.length === 0 ? "Loading destinations…" : <>No destinations match “{query.trim()}”. Press <strong>Search</strong> to look anyway.</>}</p>
      ) : (
        <ul>
          {items.map((s) => (
            <li key={s.name}>
              <button type="button" onClick={() => onPick(s.name)} className="flex w-full items-center gap-4 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--grey-btn)]">
                <span className="grid size-12 place-items-center rounded-lg border border-line bg-[#f7f7f7]" aria-hidden><MapPin className="size-6" strokeWidth={1.5} /></span>
                <span><span className="block text-base">{s.name}</span><span className="block text-sm text-ink-2">{s.sub}</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WhenPanel({ dates, onChange, months }: { dates: DateValue; onChange: (v: DateValue) => void; months: 1 | 2 }) {
  const [tab, setTab] = useState<"dates" | "flexible">(dates.check_in ? "dates" : "dates");
  const seg = (on: boolean) => `rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${on ? "bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.12)]" : "hover:bg-[#e6e6e6]"}`;
  const box = "flex flex-1 items-center justify-between px-4 py-3 text-left";
  return (
    <div>
      <div className="mx-auto mb-6 flex w-fit rounded-full bg-[#ebebeb] p-1" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "dates"} className={seg(tab === "dates")} onClick={() => setTab("dates")}>Dates</button>
        <button type="button" role="tab" aria-selected={tab === "flexible"} className={seg(tab === "flexible")} onClick={() => { setTab("flexible"); onChange({ check_in: "", check_out: "" }); }}>Flexible</button>
      </div>
      {tab === "dates" ? (
        <div className="flex justify-center"><DateRangePicker value={dates} onChange={onChange} months={months} /></div>
      ) : (
        <p className="py-16 text-center text-ink-2">Flexible: search stays available any week. Pick <button type="button" onClick={() => setTab("dates")} className="font-semibold text-ink underline">Dates</button> to choose exact days.</p>
      )}
      {months === 2 && (
        <div className="mx-auto mt-4 flex w-fit overflow-hidden rounded-xl border border-line-strong divide-x divide-line-strong">
          <div className={`${box} w-[270px]`}><span><span className="block text-xs text-ink-2">Check-in</span><span className="text-base">{dates.check_in ? formatDate(dates.check_in, "EEE, d MMM") : "Exact date"}</span></span><ChevronDown className="size-4" aria-hidden /></div>
          <div className={`${box} w-[270px]`}><span><span className="block text-xs text-ink-2">Checkout</span><span className="text-base">{dates.check_out ? formatDate(dates.check_out, "EEE, d MMM") : "Exact date"}</span></span><ChevronDown className="size-4" aria-hidden /></div>
        </div>
      )}
    </div>
  );
}

/** Desktop expanded pill (Where | When | Who) with its popovers, or the mobile search sheet. */
export function SearchBar({ mode, onSubmitted }: { mode: "mobile" | "desktop"; onSubmitted?: () => void }) {
  const d = useDraft();
  const [panel, setPanel] = useState<Panel>(null);
  const wrap = useRef<HTMLDivElement>(null);
  useClickOutside(wrap, () => setPanel(null), panel !== null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [section, setSection] = useState<Panel>("where");

  const go = () => {
    setPanel(null);
    setMobileOpen(false);
    d.submit();
    onSubmitted?.();
  };
  const whoText = guestSummary(d.total, d.guests.infants, d.guests.pets);
  const datesText = d.dates.check_in && d.dates.check_out ? formatRange(d.dates.check_in, d.dates.check_out) : "";

  /* ---------------- mobile ---------------- */
  if (mode === "mobile") {
    const card = (id: Panel, title: string, value: string, body: React.ReactNode) => (
      <section className="rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
        {section === id ? (
          <div className="p-6"><h3 className="mb-5 text-[26px] font-semibold leading-8">{title}</h3>{body}</div>
        ) : (
          <button type="button" onClick={() => setSection(id)} className="flex w-full items-center justify-between px-6 py-5 text-sm">
            <span className="text-ink-2">{id === "where" ? "Where" : id === "when" ? "When" : "Who"}</span><span className="font-medium">{value}</span>
          </button>
        )}
      </section>
    );
    return (
      <>
        <button onClick={() => { setSection("where"); setMobileOpen(true); }} className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line bg-white text-sm font-medium shadow-search" aria-label="Start your search">
          <Search className="size-4" strokeWidth={2.5} aria-hidden />
          {d.q || datesText || whoText ? <span className="truncate px-2">{d.q || "Anywhere"}{datesText ? ` · ${datesText}` : ""}{whoText ? ` · ${whoText}` : ""}</span> : "Start your search"}
        </button>
        <Dialog open={mobileOpen} onClose={() => setMobileOpen(false)} title="Search stays" size="full" bare footer={
          <div className="flex items-center justify-between">
            <button onClick={d.clear} className="text-base font-medium underline">Clear all</button>
            <button onClick={go} className="flex items-center gap-2 rounded-lg bg-brand px-6 py-3.5 text-base font-semibold text-white"><Search className="size-4" strokeWidth={2.5} />Search</button>
          </div>
        }>
          <div className="flex items-center justify-between bg-white px-4 pb-2 pt-4">
            <div className="flex-1" aria-hidden />
            <div className="flex items-center gap-6 text-xs font-medium text-ink-2">
              <span className="flex flex-col items-center gap-1 border-b-2 border-ink pb-1 text-ink"><House className="size-6" strokeWidth={1.5} />Homes</span>
            </div>
            <div className="flex flex-1 justify-end"><button type="button" onClick={() => setMobileOpen(false)} aria-label="Close search" className="grid size-9 place-items-center rounded-full border border-line shadow-sm"><X className="size-4" /></button></div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); go(); }} className="space-y-3 bg-[#f7f7f7] p-4">
            {card("where", "Where?", d.q || "I'm flexible",
              <>
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-line-strong px-4"><Search className="size-4" aria-hidden /><input id="m-where" value={d.q} onChange={(e) => d.setQ(e.target.value)} placeholder="Search destinations" className="w-full bg-transparent py-3.5 outline-none" /></div>
                <WherePanel query={d.q} onPick={(n) => { d.setQ(n); setSection("when"); }} />
              </>)}
            {card("when", "When's your trip?", datesText || "Add dates", <WhenPanel dates={d.dates} onChange={(v) => { d.setDates(v); if (v.check_in && v.check_out) setSection("who"); }} months={1} />)}
            {card("who", "Who's coming?", whoText || "Add guests", <GuestsPanel value={d.guests} onChange={d.setGuests} compact />)}
          </form>
        </Dialog>
      </>
    );
  }

  /* ---------------- desktop ---------------- */
  const seg =
    "relative flex h-full min-w-0 flex-col justify-center rounded-full px-8 text-left transition-colors hover:bg-[#dddddd] data-[active=true]:bg-white data-[active=true]:shadow-[0_6px_20px_rgba(0,0,0,0.2)] data-[active=true]:hover:bg-white " +
    "[&:not(:first-child)]:before:absolute [&:not(:first-child)]:before:left-0 [&:not(:first-child)]:before:top-[26%] [&:not(:first-child)]:before:h-[48%] [&:not(:first-child)]:before:w-px [&:not(:first-child)]:before:bg-[#ddd] hover:before:opacity-0 data-[active=true]:before:opacity-0";
  const label = "text-xs font-medium leading-4 text-ink";
  const val = (on: boolean) => `truncate text-sm leading-5 ${on ? "text-ink" : "text-ink-2"}`;

  return (
    <div ref={wrap} className="relative mx-auto w-full max-w-[850px]">
      <form
        onSubmit={(e) => { e.preventDefault(); go(); }}
        role="search"
        aria-label="Search stays"
        className={`grid h-[66px] grid-cols-[280px_289px_1fr] items-stretch rounded-full border border-[#ddd] shadow-[0_3px_12px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.08)] transition-colors ${panel ? "bg-[#ebebeb]" : "bg-white"}`}
      >
        <label data-active={panel === "where"} className={`${seg} cursor-text`} onClick={() => setPanel("where")}>
          <span className={label}>Where</span>
          <input value={d.q} onChange={(e) => d.setQ(e.target.value)} onFocus={() => setPanel("where")} placeholder="Search destinations" autoComplete="off" className={`w-full truncate bg-transparent text-sm leading-5 outline-none focus-visible:outline-none placeholder:text-ink-2`} />
        </label>
        <button type="button" data-active={panel === "when"} className={seg} onClick={() => setPanel("when")} aria-haspopup="dialog" aria-expanded={panel === "when"}>
          <span className={label}>When</span>
          <span className={val(Boolean(datesText))}>{datesText || "Add dates"}</span>
        </button>
        <div data-active={panel === "who"} className={`${seg} flex-row items-center justify-between !pl-0 !pr-2.5`}>
          <button type="button" className="flex h-full min-w-0 flex-1 flex-col justify-center rounded-full pl-8 text-left" onClick={() => setPanel("who")} aria-haspopup="dialog" aria-expanded={panel === "who"}>
            <span className={label}>Who</span>
            <span className={val(Boolean(whoText))}>{whoText || "Add guests"}</span>
          </button>
          <button type="submit" aria-label="Search" className={`flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-brand text-white transition-all hover:bg-brand-hover active:scale-95 ${panel ? "px-4" : "w-12"}`}>
            <Search className="size-[18px]" strokeWidth={2.6} />
            {panel && <span className="text-base font-medium">Search</span>}
          </button>
        </div>
      </form>

      {panel && (
        <div
          className="anim-pop absolute top-[78px] z-50 rounded-[32px] bg-white p-8 shadow-[0_8px_28px_rgba(0,0,0,0.18)]"
          style={panel === "where" ? { left: 0, width: 440 } : panel === "when" ? { left: 0, right: 0 } : { right: 0, width: 425 }}
        >
          {panel === "where" && <WherePanel query={d.q} onPick={(n) => { d.setQ(n); setPanel("when"); }} />}
          {panel === "when" && (
            <>
              <WhenPanel dates={d.dates} onChange={(v) => { d.setDates(v); if (v.check_in && v.check_out) setPanel("who"); }} months={2} />
              {(d.dates.check_in || d.dates.check_out) && (
                <button type="button" onClick={() => d.setDates({ check_in: "", check_out: "" })} className="mt-3 flex items-center gap-1 text-sm font-semibold underline"><X className="size-3.5" />Clear dates</button>
              )}
            </>
          )}
          {panel === "who" && <div className="-my-3"><GuestsPanel value={d.guests} onChange={d.setGuests} /></div>}
        </div>
      )}
    </div>
  );
}

/** Airbnb's collapsed header pill ("Anywhere | Anytime | Add guests"). */
export function CompactSearch({ onOpen }: { onOpen: () => void }) {
  const s = parseSearch(useSearchParams());
  const part = "px-4 text-sm font-medium";
  const dates = s.check_in && s.check_out ? `${formatDate(s.check_in, "d")}–${formatDate(s.check_out, "d MMM")}` : "Anytime";
  const who = guestSummary(s.guests, s.infants, s.pets);
  return (
    <button onClick={onOpen} aria-label="Start your search" className="mx-auto flex h-12 items-center divide-x divide-line rounded-full border border-[#ddd] bg-white py-1 pl-2 pr-2 text-left shadow-[0_3px_12px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_6px_16px_rgba(0,0,0,0.16)]">
      <span className="flex items-center gap-2 pr-4 pl-2"><House className="size-6" strokeWidth={1.5} aria-hidden /><span className="max-w-[200px] truncate text-sm font-medium">{s.q ? `Homes in ${s.q}` : "Anywhere"}</span></span>
      <span className={`${part} whitespace-nowrap`}>{dates}</span>
      <span className={`${part} whitespace-nowrap ${who ? "" : "font-normal"}`}>{who || "Add guests"}</span>
      <span className="ml-1 grid size-8 shrink-0 place-items-center rounded-full bg-brand text-white"><Search className="size-3.5" strokeWidth={3} /></span>
    </button>
  );
}

