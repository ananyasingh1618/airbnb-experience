"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { DateRangePicker } from "@/components/search/DateRangePicker";
import { GuestSelector } from "@/components/search/GuestSelector";
import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { FieldError } from "@/components/ui/States";
import { btn } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAsync, useClickOutside } from "@/lib/hooks";
import { useDemoUser } from "@/lib/demo-user";
import { formatDate, money, plural } from "@/lib/format";
import { stayQuery, useStay } from "@/lib/stay";
import type { Availability, Listing } from "@/types";

export function useAvailability(listing: Listing) {
  const { stay, hasDates } = useStay();
  const q = useAsync<Availability>(
    () => api.availability(listing.id, hasDates ? { check_in: stay.check_in, check_out: stay.check_out, guests: stay.guests } : {}),
    [listing.id, stay.check_in, stay.check_out, stay.guests],
  );
  return q;
}

export function BookingCard({ listing }: { listing: Listing }) {
  const router = useRouter();
  const { user } = useDemoUser();
  const { stay, setStay, hasDates } = useStay();
  const avail = useAvailability(listing);
  const [open, setOpen] = useState<"dates" | "guests" | null>(null);
  const [touched, setTouched] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  useClickOutside(wrap, () => setOpen(null), open !== null);

  const booked = avail.data?.booked ?? [];
  const quote = hasDates ? avail.data?.quote ?? null : null;
  const unavailable = hasDates && avail.data?.available === false;
  const isOwner = user?.id === listing.host.id;

  const dateError = touched && !hasDates ? "Select your check-in and check-out dates." : unavailable ? "Those dates aren't available. Try different dates." : avail.error?.field === "check_in" || avail.error?.field === "check_out" ? avail.error.message : null;
  const guestError = avail.error?.field === "guests" ? avail.error.message : null;

  const reserve = () => {
    setTouched(true);
    if (!hasDates || unavailable || avail.error || isOwner) return;
    router.push(`/checkout/${listing.id}?${stayQuery(stay)}`);
  };

  const field = "flex flex-col px-3.5 py-2.5 text-left transition-colors hover:bg-surface";

  return (
    <aside ref={wrap} aria-label="Reservation" className="relative rounded-2xl border border-line bg-bg p-6 shadow-pop">
      <div className="mb-5 flex items-baseline justify-between">
        <p>
          <span className="text-[22px] font-semibold">{money(listing.price_per_night_cents)}</span>
          <span className="text-ink-2"> night</span>
        </p>
        {listing.rating && (
          <p className="flex items-center gap-1 text-sm">
            <Star className="size-3.5 fill-ink" aria-hidden />
            <span className="font-semibold">{listing.rating.toFixed(2)}</span>
            <span className="text-ink-2">· {plural(listing.review_count, "review")}</span>
          </p>
        )}
      </div>

      <div className={`rounded-xl border ${dateError || guestError ? "border-danger" : "border-line-strong"}`}>
        <div className="grid grid-cols-2 divide-x divide-line-strong overflow-hidden rounded-t-xl">
          <button type="button" className={field} onClick={() => setOpen(open === "dates" ? null : "dates")} aria-expanded={open === "dates"} aria-describedby={dateError ? "date-err" : undefined}>
            <span className="text-[10px] font-bold uppercase">Check-in</span>
            <span className={`text-sm ${stay.check_in ? "" : "text-ink-2"}`}>{stay.check_in ? formatDate(stay.check_in, "M/d/yyyy") : "Add date"}</span>
          </button>
          <button type="button" className={field} onClick={() => setOpen(open === "dates" ? null : "dates")} aria-expanded={open === "dates"}>
            <span className="text-[10px] font-bold uppercase">Checkout</span>
            <span className={`text-sm ${stay.check_out ? "" : "text-ink-2"}`}>{stay.check_out ? formatDate(stay.check_out, "M/d/yyyy") : "Add date"}</span>
          </button>
        </div>
        <button type="button" className={`${field} w-full rounded-b-xl border-t border-line-strong`} onClick={() => setOpen(open === "guests" ? null : "guests")} aria-expanded={open === "guests"}>
          <span className="text-[10px] font-bold uppercase">Guests</span>
          <span className="text-sm">{plural(stay.guests, "guest")}</span>
        </button>
      </div>
      <FieldError id="date-err">{dateError}</FieldError>
      <FieldError>{guestError}</FieldError>

      {open === "dates" && (
        <div className="anim-pop absolute right-0 top-[120px] z-30 rounded-2xl border border-line bg-bg p-4 shadow-pop">
          <DateRangePicker
            value={{ check_in: stay.check_in, check_out: stay.check_out }}
            booked={booked}
            months={1}
            onChange={(v) => { setStay(v); if (v.check_in && v.check_out) setOpen(null); }}
          />
          {hasDates && <button type="button" onClick={() => setStay({ check_in: "", check_out: "" })} className="text-sm font-semibold underline">Clear dates</button>}
        </div>
      )}
      {open === "guests" && (
        <div className="anim-pop absolute inset-x-6 top-[168px] z-30 rounded-2xl border border-line bg-bg p-5 shadow-pop">
          <GuestSelector value={stay.guests} onChange={(guests) => setStay({ guests })} min={1} max={listing.max_guests} hint={`This place sleeps ${listing.max_guests}`} />
        </div>
      )}

      <button onClick={reserve} disabled={isOwner || unavailable} className={btn("brand", "mt-4 w-full py-3.5 text-base")}>
        {isOwner ? "This is your listing" : unavailable ? "Unavailable" : hasDates ? "Reserve" : "Check availability"}
      </button>

      {quote ? (
        <div className="anim-fade mt-5">
          <p className="mb-4 text-center text-sm text-ink-2">You won&apos;t be charged yet — payment is simulated</p>
          <PriceBreakdown quote={quote} nightlyCents={listing.price_per_night_cents} />
        </div>
      ) : (
        !hasDates && <p className="mt-4 text-center text-sm text-ink-2">Select dates to see the total price</p>
      )}
    </aside>
  );
}
