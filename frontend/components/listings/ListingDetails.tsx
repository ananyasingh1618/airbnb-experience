"use client";

import { Share2, Star } from "lucide-react";
import { BookingCard, useAvailability } from "@/components/booking/BookingCard";
import { DateRangePicker } from "@/components/search/DateRangePicker";
import { AmenityGrid } from "@/components/listings/AmenityGrid";
import { FavoriteButton } from "@/components/listings/FavoriteButton";
import { ListingGallery } from "@/components/listings/ListingGallery";
import { LocationMap } from "@/components/listings/LocationMap";
import { ReviewsSection } from "@/components/listings/ReviewsSection";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { fmtRating, formatRange, isGuestFavourite, plural } from "@/lib/format";
import { useStay } from "@/lib/stay";
import type { Listing } from "@/types";

function AvailabilityCalendar({ listing }: { listing: Listing }) {
  const { stay, setStay, hasDates } = useStay();
  const avail = useAvailability(listing);
  return (
    <section aria-labelledby="calendar">
      <h2 id="calendar" className="text-[22px] font-semibold">
        {hasDates ? `${plural((new Date(stay.check_out).getTime() - new Date(stay.check_in).getTime()) / 864e5, "night")} in ${listing.location.split(",")[0]}` : "Select check-in date"}
      </h2>
      <p className="mb-5 mt-1 text-sm text-ink-2">{hasDates ? formatRange(stay.check_in, stay.check_out) : "Add your travel dates for exact pricing. Struck-through dates are booked."}</p>
      <div className="overflow-x-auto">
        <div className="hidden md:block">
          <DateRangePicker value={{ check_in: stay.check_in, check_out: stay.check_out }} booked={avail.data?.booked} onChange={setStay} />
        </div>
        <div className="md:hidden">
          <DateRangePicker value={{ check_in: stay.check_in, check_out: stay.check_out }} booked={avail.data?.booked} months={1} onChange={setStay} />
        </div>
      </div>
      {hasDates && <button onClick={() => setStay({ check_in: "", check_out: "" })} className="mt-3 text-sm font-semibold underline">Clear dates</button>}
    </section>
  );
}

export function ListingDetails({ listing }: { listing: Listing }) {
  const { toast } = useToast();
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href.split("?")[0]);
      toast("Link copied to clipboard", "success");
    } catch {
      toast("Couldn't copy the link", "error");
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-10 pt-8 sm:px-6 md:px-10 lg:px-[40px] xl:max-w-[1120px] xl:px-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[26px] font-medium leading-8">{listing.title}</h1>
        <div className="flex items-center gap-1">
          <button onClick={share} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium underline transition-colors hover:bg-surface-2"><Share2 className="size-4" aria-hidden />Share</button>
          <FavoriteButton listingId={listing.id} title={listing.title} variant="inline" />
        </div>
      </div>

      <ListingGallery images={listing.images} title={listing.title} />

      <div className="mt-6 grid gap-x-24 lg:grid-cols-[1fr_372px]">
        <div className="min-w-0 space-y-10 [&>section]:border-t [&>section]:border-line [&>section]:pt-10 [&>section:first-child]:border-0 [&>section:first-child]:pt-0">
          <section aria-labelledby="overview">
            <h2 id="overview" className="text-[22px] font-semibold leading-7">{listing.property_type} in {listing.location}</h2>
            <p className="mt-1 text-base">
              {plural(listing.max_guests, "guest")} · {listing.bedrooms === 0 ? "Studio" : plural(listing.bedrooms, "bedroom")} · {plural(listing.beds, "bed")} · {plural(listing.bathrooms, "bathroom")}
            </p>
            {listing.rating ? (
              <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-line px-6 py-4">
                {isGuestFavourite(listing.rating, listing.review_count) && (
                  <p className="font-semibold leading-tight">Guest favourite<span className="block max-w-[260px] text-sm font-normal text-ink-2">One of the most loved homes on Roamly, according to guests</span></p>
                )}
                <div className={`flex shrink-0 items-center divide-x divide-line ${isGuestFavourite(listing.rating, listing.review_count) ? "" : "mx-auto"}`}>
                  <p className="px-5 text-center"><span className="block text-[22px] font-semibold leading-6">{fmtRating(listing.rating)}</span><span className="flex justify-center gap-px" aria-hidden>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-2.5 fill-ink" />)}</span></p>
                  <p className="px-5 text-center"><span className="block text-[22px] font-semibold leading-6">{listing.review_count}</span><span className="text-xs text-ink-2">Reviews</span></p>
                </div>
              </div>
            ) : <p className="mt-3 text-sm text-ink-2">New listing</p>}
          </section>
          <section aria-label="Host" className="flex items-center gap-4">
            <Avatar name={listing.host.name} src={listing.host.avatar_url} size={56} />
            <div>
              <p className="font-semibold">Hosted by {listing.host.name}</p>
              {listing.host.bio && <p className="text-sm text-ink-2">{listing.host.bio}</p>}
            </div>
          </section>
          <section aria-labelledby="about">
            <h2 id="about" className="sr-only">About this place</h2>
            <p className="whitespace-pre-line text-[16px] leading-relaxed">{listing.description}</p>
          </section>
          <AmenityGrid amenities={listing.amenities} />
          <AvailabilityCalendar listing={listing} />
          <ReviewsSection listingId={listing.id} />
          <LocationMap listing={listing} />
        </div>
        <div className="relative mt-10 lg:mt-0">
          <div className="lg:sticky lg:top-[112px]"><BookingCard listing={listing} /></div>
        </div>
      </div>
    </div>
  );
}
