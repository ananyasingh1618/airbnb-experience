"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Flag } from "lucide-react";
import { subDays } from "date-fns";
import { DateRangePicker } from "@/components/search/DateRangePicker";
import { GuestsPanel } from "@/components/search/GuestsPanel";
import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { FieldError } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { useAsync, useClickOutside } from "@/lib/hooks";
import { useDemoUser } from "@/lib/demo-user";
import { formatDate, formatRange, fromISO, guestLabel, money, plural } from "@/lib/format";
import { stayQuery, useStay } from "@/lib/stay";
import type { Availability, Listing } from "@/types";

export function useAvailability(listing: Listing) {
  const { stay, hasDates } = useStay();
  return useAsync<Availability>(
    () => api.availability(listing.id, hasDates ? { check_in: stay.check_in, check_out: stay.check_out, guests: stay.guests } : {}),
    [listing.id, stay.check_in, stay.check_out, stay.guests],
  );
}

export type AvailabilityState = ReturnType<typeof useAvailability>;

export function BookingCard({ listing, avail }: { listing: Listing; avail: AvailabilityState }) {
  const wrap = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useDemoUser();
  const { stay, setStay, hasDates } = useStay();
  const [open, setOpenRaw] = useState<"dates" | "guests" | null>(null);
  // Bring the card (and its popup) fully into view when a popup opens.
  const setOpen = (v: "dates" | "guests" | null) => {
    setOpenRaw(v);
    if (v) setTimeout(() => wrap.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 30);
  };
  const [touched, setTouched] = useState(false);
  useClickOutside(wrap, () => setOpen(null), open !== null);

  const booked = avail.data?.booked ?? [];
  const quote = hasDates ? avail.data?.quote ?? null : null;
  const unavailable = hasDates && avail.data?.available === false;
  const isOwner = user?.id === listing.host.id;
  const allowsPets = listing.amenities.some((a) => a.name === "Pets allowed");

  const dateError = touched && !hasDates ? "Select your check-in and check-out dates." : unavailable ? "Those dates aren't available. Try different dates." : avail.error?.field === "check_in" || avail.error?.field === "check_out" ? avail.error.message : null;
  const guestError = avail.error?.field === "guests" ? avail.error.message : null;

  const reserve = () => {
    setTouched(true);
    if (!hasDates) return setOpen("dates");
    if (unavailable || avail.error || isOwner) return;
    router.push(`/checkout/${listing.id}?${stayQuery(stay)}`);
  };

  const field = "flex flex-col px-3 py-2.5 text-left transition-colors hover:bg-[#f7f7f7]";
  const label = "text-[10px] font-bold uppercase leading-3";
  const dateBtn = (which: "in" | "out") => (
    <button type="button" className={field} onClick={() => setOpen(open === "dates" ? null : "dates")} aria-expanded={open === "dates"} aria-describedby={dateError ? "date-err" : undefined}>
      <span className={label}>{which === "in" ? "Check-in" : "Checkout"}</span>
      <span className={`text-sm ${(which === "in" ? stay.check_in : stay.check_out) ? "" : "text-ink-2"}`}>{(which === "in" ? stay.check_in : stay.check_out) ? formatDate(which === "in" ? stay.check_in : stay.check_out, "M/d/yyyy") : "Add date"}</span>
    </button>
  );

  return (
    <div ref={wrap} className="relative">
      <aside aria-label="Reservation" className="rounded-xl bg-white p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04]">
        <div className="mb-5 flex items-baseline gap-1.5">
          {quote ? (
            <><span className="text-[22px] font-semibold underline">{money(quote.total_price_cents)}</span><span className="text-base">for {plural(quote.nights, "night")}</span></>
          ) : (
            <><span className="text-[22px] font-semibold">{money(listing.price_per_night_cents)}</span><span className="text-base">night</span></>
          )}
        </div>

        <div className={`rounded-lg border ${dateError || guestError ? "border-danger" : "border-[#b0b0b0]"}`}>
          <div className="grid grid-cols-2 divide-x divide-[#b0b0b0] overflow-hidden rounded-t-lg">{dateBtn("in")}{dateBtn("out")}</div>
          <button type="button" className={`${field} relative w-full rounded-b-lg border-t border-[#b0b0b0]`} onClick={() => setOpen(open === "guests" ? null : "guests")} aria-expanded={open === "guests"}>
            <span className={label}>Guests</span>
            <span className="text-sm">{guestLabel(stay.guests, stay.infants, stay.pets)}</span>
            {open === "guests" ? <ChevronUp className="absolute right-4 top-1/2 size-4 -translate-y-1/2" /> : <ChevronDown className="absolute right-4 top-1/2 size-4 -translate-y-1/2" />}
          </button>
        </div>
        <FieldError id="date-err">{dateError}</FieldError>
        <FieldError>{guestError}</FieldError>

        {quote && !unavailable && (
          <p className="mt-4 rounded-md bg-[#f2f2f2] px-3 py-2 text-center text-xs">
            Free cancellation before <strong className="font-semibold">{formatDate(subDays(fromISO(stay.check_in), 1).toISOString().slice(0, 10), "d MMMM")}</strong>
          </p>
        )}

        <button onClick={reserve} disabled={isOwner || unavailable} className="mt-4 h-12 w-full rounded-full bg-gradient-to-r from-[#e61e4d] via-[#e31c5f] to-[#d70466] text-base font-medium text-white transition-[filter,transform] hover:brightness-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">
          {isOwner ? "This is your listing" : unavailable ? "Unavailable" : hasDates ? "Reserve" : "Check availability"}
        </button>
        <p className="mt-3 text-center text-sm">You won&apos;t be charged yet — payment is simulated</p>

        {quote && <div className="anim-fade mt-5"><PriceBreakdown quote={quote} nightlyCents={listing.price_per_night_cents} /></div>}
      </aside>

      <button type="button" onClick={() => toast("Thanks — reporting isn't enabled in this demo.", "info")} className="mx-auto mt-6 flex items-center gap-2 text-sm text-ink-2 underline"><Flag className="size-4" aria-hidden />Report this listing</button>

      {open === "dates" && (
        <div className="anim-pop absolute right-0 top-[88px] z-30 w-[min(700px,calc(100vw-32px))] rounded-2xl bg-white p-6 shadow-[0_8px_28px_rgba(0,0,0,0.2)]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div><h3 className="text-[22px] font-medium tracking-[-0.02em]">{hasDates ? plural(Math.round((fromISO(stay.check_out).getTime() - fromISO(stay.check_in).getTime()) / 864e5), "night") : "Select dates"}</h3><p className="text-sm text-ink-2">{hasDates ? formatRange(stay.check_in, stay.check_out) : "Add your travel dates for exact pricing"}</p></div>
          </div>
          <div className="hidden sm:block"><DateRangePicker value={{ check_in: stay.check_in, check_out: stay.check_out }} booked={booked} onChange={(v) => { setStay(v); if (v.check_in && v.check_out) setOpen(null); }} /></div>
          <div className="sm:hidden"><DateRangePicker value={{ check_in: stay.check_in, check_out: stay.check_out }} booked={booked} months={1} onChange={(v) => { setStay(v); if (v.check_in && v.check_out) setOpen(null); }} /></div>
          <div className="mt-2 flex items-center justify-between">
            <button type="button" onClick={() => setStay({ check_in: "", check_out: "" })} className="text-sm font-medium underline">Clear dates</button>
            <button type="button" onClick={() => setOpen(null)} className="rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white">Close</button>
          </div>
        </div>
      )}
      {open === "guests" && (
        <div className="anim-pop absolute inset-x-0 top-[168px] z-30 rounded-xl bg-white px-6 pb-4 pt-2 shadow-[0_8px_28px_rgba(0,0,0,0.2)]">
          <GuestsPanel
            compact
            minAdults={1}
            maxGuests={listing.max_guests}
            maxPets={allowsPets ? 5 : 0}
            value={{ adults: stay.guests - stay.children, children: stay.children, infants: stay.infants, pets: stay.pets }}
            onChange={(v) => setStay({ guests: v.adults + v.children, children: v.children, infants: v.infants, pets: v.pets })}
          />
          {!allowsPets && <p className="pb-2 text-sm text-ink-2">Pets aren&apos;t allowed at this stay.</p>}
          <button type="button" onClick={() => setOpen(null)} className="mt-1 text-base font-medium underline">Close</button>
        </div>
      )}
    </div>
  );
}
