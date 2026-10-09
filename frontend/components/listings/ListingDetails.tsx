"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CookingPot, Laptop, MapPin, PawPrint, ParkingCircle, Share2, Bath, CalendarCheck, type LucideIcon } from "lucide-react";
import { BookingCard, useAvailability, type AvailabilityState } from "@/components/booking/BookingCard";
import { DateRangePicker } from "@/components/search/DateRangePicker";
import { AmenityGrid } from "@/components/listings/AmenityGrid";
import { DetailSubNav } from "@/components/listings/DetailSubNav";
import { FavoriteButton } from "@/components/listings/FavoriteButton";
import { MeetYourHost, ThingsToKnow } from "@/components/listings/HostAndRules";
import { Laurel } from "@/components/listings/Laurel";
import { ListingGallery } from "@/components/listings/ListingGallery";
import { LocationMap } from "@/components/listings/LocationMap";
import { ReviewsSection } from "@/components/listings/ReviewsSection";
import { Sleeping } from "@/components/listings/Sleeping";
import { Avatar } from "@/components/ui/Avatar";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { cityOf, fmtRating, formatRange, fromISO, isGuestFavourite, money, plural } from "@/lib/format";
import { stayQuery, useStay } from "@/lib/stay";
import type { Listing } from "@/types";

/** Highlights derived from the listing's real amenities (first three that apply). */
const FEATURES: { amenity: string; Icon: LucideIcon; title: string; body: string }[] = [
  { amenity: "Free parking", Icon: ParkingCircle, title: "Park for free", body: "Free parking is included with this stay." },
  { amenity: "Kitchen", Icon: CookingPot, title: "Full kitchen", body: "Cook your own meals with a fully equipped kitchen." },
  { amenity: "Dedicated workspace", Icon: Laptop, title: "Dedicated workspace", body: "A private space with a desk and Wifi for working." },
  { amenity: "Pets allowed", Icon: PawPrint, title: "Furry friends welcome", body: "Bring your pets along for the stay." },
  { amenity: "Hot tub", Icon: Bath, title: "Soak in the hot tub", body: "Unwind in your private hot tub after a day out." },
  { amenity: "Mountain view", Icon: MapPin, title: "Great views", body: "Wake up to mountain views from the property." },
  { amenity: "Beach access", Icon: MapPin, title: "Beach access", body: "Walk straight to the sand from your door." },
  { amenity: "Lake access", Icon: MapPin, title: "Lake access", body: "Spend your days on the water right outside." },
];

function AvailabilityCalendar({ listing, avail }: { listing: Listing; avail: AvailabilityState }) {
  const { stay, setStay, hasDates } = useStay();
  const nights = hasDates ? Math.round((fromISO(stay.check_out).getTime() - fromISO(stay.check_in).getTime()) / 864e5) : 0;
  const value = { check_in: stay.check_in, check_out: stay.check_out };
  return (
    <section aria-labelledby="calendar" className="scroll-mt-24">
      <h2 id="calendar" className="text-[22px] font-medium tracking-[-0.02em]">{hasDates ? `${plural(nights, "night")} in ${cityOf(listing.location)}` : "Select check-in date"}</h2>
      <p className="mb-6 mt-1 text-sm text-ink-2">{hasDates ? formatRange(stay.check_in, stay.check_out) : "Add your travel dates for exact pricing. Struck-through dates are booked."}</p>
      <div className="overflow-x-auto">
        <div className="hidden md:block"><DateRangePicker value={value} booked={avail.data?.booked} onChange={setStay} /></div>
        <div className="md:hidden"><DateRangePicker value={value} booked={avail.data?.booked} months={1} onChange={setStay} /></div>
      </div>
      <div className="mt-2 flex justify-end"><button onClick={() => setStay({ check_in: "", check_out: "" })} disabled={!hasDates} className="rounded-lg px-3 py-2 text-sm font-medium underline disabled:opacity-40">Clear dates</button></div>
    </section>
  );
}

export function ListingDetails({ listing }: { listing: Listing }) {
  const { toast } = useToast();
  const router = useRouter();
  const { stay, hasDates } = useStay();
  const avail = useAvailability(listing);
  const [cardVisible, setCardVisible] = useState(false);
  const [more, setMore] = useState(false);
  useEffect(() => {
    const el = document.getElementById("reserve");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCardVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href.split("?")[0]); toast("Link copied to clipboard", "success"); }
    catch { toast("Couldn't copy the link", "error"); }
  };

  const fav = isGuestFavourite(listing.rating, listing.review_count);
  const have = new Set(listing.amenities.map((a) => a.name));
  const features = FEATURES.filter((f) => have.has(f.amenity)).slice(0, 3);
  if (features.length < 3) features.push({ amenity: "", Icon: CalendarCheck, title: "Free cancellation", body: "Cancel before check-in and the dates open up for others again." });
  const quote = hasDates ? avail.data?.quote ?? null : null;
  const long = listing.description.length > 230;

  const reserveMobile = () => {
    if (hasDates && avail.data?.available) router.push(`/checkout/${listing.id}?${stayQuery(stay)}`);
    else document.getElementById("reserve")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const sec = "border-t border-[#ebebeb] py-8";

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-28 pt-0 sm:px-6 sm:pt-5 md:px-10 lg:pb-16 xl:max-w-[1120px] xl:px-0">
      <DetailSubNav listing={listing} quote={quote} />

      <div className="mb-5 hidden items-center justify-between gap-3 sm:flex">
        <h1 className="text-[26px] font-medium leading-8 tracking-[-0.02em]">{listing.title}</h1>
        <div className="flex items-center gap-1">
          <button onClick={share} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium underline transition-colors hover:bg-[var(--grey-btn)]"><Share2 className="size-4" aria-hidden />Share</button>
          <FavoriteButton listingId={listing.id} title={listing.title} variant="inline" />
        </div>
      </div>

      <div id="photos" className="scroll-mt-24"><ListingGallery images={listing.images} title={listing.title} listingId={listing.id} /></div>

      <div className="mt-6 grid gap-x-24 lg:grid-cols-[1fr_372px]">
        <div className="min-w-0 [&>section:first-child]:border-0 [&>section:first-child]:pt-0">
          <section aria-labelledby="overview" className="pb-8">
            <h1 className="mb-4 text-center text-[26px] font-medium leading-8 tracking-[-0.02em] sm:hidden">{listing.title}</h1>
            <h2 id="overview" className="text-center text-[22px] font-medium leading-7 tracking-[-0.02em] sm:text-left">{listing.property_type} in {listing.location}</h2>
            <p className="mt-1 text-center text-base sm:text-left">
              {plural(listing.max_guests, "guest")} · {listing.bedrooms === 0 ? "Studio" : plural(listing.bedrooms, "bedroom")} · {plural(listing.beds, "bed")} · {plural(listing.bathrooms, "bathroom")}
            </p>
            {listing.rating ? (
              <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-[#ddd] px-6 py-4">
                {fav && (
                  <div className="flex items-center gap-2">
                    <Laurel className="hidden h-10 w-5 sm:block" /><p className="text-base font-medium leading-5 sm:text-center">Guest<br className="hidden sm:block" /> favourite</p><Laurel flip className="hidden h-10 w-5 sm:block" />
                    <p className="ml-4 hidden max-w-[210px] text-sm font-medium leading-5 md:block">One of the most loved homes on Airbnb, according to guests</p>
                  </div>
                )}
                <div className={`flex shrink-0 items-center divide-x divide-[#ddd] ${fav ? "" : "mx-auto"}`}>
                  <p className="px-5 text-center"><span className="block text-[22px] font-semibold leading-6">{fmtRating(listing.rating)}</span><span className="flex justify-center gap-px" aria-hidden>{Array.from({ length: 5 }).map((_, i) => <svg key={i} viewBox="0 0 24 24" className="size-2.5 fill-ink"><path d="m12 2 3 6.9 7.5.7-5.7 5 1.7 7.400L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z" /></svg>)}</span></p>
                  <p className="px-5 text-center"><span className="block text-[22px] font-semibold leading-6">{listing.review_count}</span><span className="text-xs text-ink-2">Reviews</span></p>
                </div>
              </div>
            ) : <p className="mt-3 text-sm text-ink-2">New listing</p>}
          </section>

          <section aria-label="Host" className={`${sec} flex items-center gap-4`}>
            <Avatar name={listing.host.name} src={listing.host.avatar_url} size={40} />
            <div><p className="text-base font-medium leading-tight">Hosted by {listing.host.name}</p>{listing.host.bio && <p className="text-sm text-ink-2">{listing.host.bio.split(".")[0]}.</p>}</div>
          </section>

          <section aria-label="Highlights" className={`${sec} space-y-6`}>
            {features.map(({ Icon, title, body }) => (
              <div key={title} className="flex gap-6"><Icon className="mt-0.5 size-6 shrink-0" strokeWidth={1.5} aria-hidden /><div><p className="text-sm font-medium leading-5">{title}</p><p className="text-sm text-[#6c6c6c]">{body}</p></div></div>
            ))}
          </section>

          <section aria-labelledby="about" className={sec}>
            <h2 id="about" className="sr-only">About this place</h2>
            <p className={`whitespace-pre-line text-base leading-6 ${long ? "line-clamp-4" : ""}`}>{listing.description}</p>
            {long && <button onClick={() => setMore(true)} className="btn-grey mt-6">Show more</button>}
            <Dialog open={more} onClose={() => setMore(false)} title="About this place" closeRight size="lg"><p className="whitespace-pre-line p-6 text-base leading-6">{listing.description}</p></Dialog>
          </section>

          <div className={sec}><Sleeping listing={listing} /></div>
          <div className={sec}><AmenityGrid amenities={listing.amenities} /></div>
          <div className={sec}><AvailabilityCalendar listing={listing} avail={avail} /></div>
          <div className={sec}><ReviewsSection listingId={listing.id} /></div>
          <div className={sec}><LocationMap listing={listing} /></div>
          <div className={sec}><MeetYourHost listing={listing} /></div>
          <div className={sec}><ThingsToKnow listing={listing} /></div>
        </div>

        <div id="reserve" className="relative mt-4 scroll-mt-24 lg:mt-0">
          <div className="lg:sticky lg:top-[112px]"><BookingCard listing={listing} avail={avail} /></div>
        </div>
      </div>

      {/* Mobile: Airbnb-style sticky reserve bar */}
      <div className={`fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-[#ebebeb] bg-white px-4 py-3 transition-transform duration-200 lg:hidden ${cardVisible ? "translate-y-full" : ""}`} aria-hidden={cardVisible}>
        <p className="min-w-0 leading-tight">
          {quote ? (<><span className="text-base font-semibold underline">{money(quote.total_price_cents)}</span><span className="block truncate text-sm text-ink-2">For {plural(quote.nights, "night")} · {formatRange(stay.check_in, stay.check_out)}</span></>)
            : (<><span className="text-base font-semibold">{money(listing.price_per_night_cents)}</span> <span className="text-sm">night</span><span className="block truncate text-sm text-ink-2">{hasDates ? formatRange(stay.check_in, stay.check_out) : "Add dates for exact pricing"}</span></>)}
        </p>
        <button onClick={reserveMobile} tabIndex={cardVisible ? -1 : 0} className="shrink-0 rounded-full bg-gradient-to-r from-[#e61e4d] via-[#e31c5f] to-[#d70466] px-8 py-3.5 text-base font-medium text-white">{hasDates ? "Reserve" : "Check dates"}</button>
      </div>
    </div>
  );
}
