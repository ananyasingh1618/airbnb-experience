"use client";

import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { FavoriteButton } from "@/components/listings/FavoriteButton";
import { cityOf, fmtRating, isGuestFavourite, money } from "@/lib/format";
import type { Listing } from "@/types";

/** The small carousel card from Airbnb's home page (about 182px wide at 1440px). */
export function CompactCard({ listing, priority = false }: { listing: Listing; priority?: boolean }) {
  return (
    <article className="group relative w-[44%] shrink-0 snap-start sm:w-[30%] md:w-[calc((100%-48px)/5)] lg:w-[calc((100%-60px)/6)] xl:w-[calc((100%-72px)/7)]">
      <Link href={`/listings/${listing.id}`} className="block rounded-[18px]" aria-label={`${listing.title}, ${listing.location}`}>
        <div className="relative aspect-[182/173] overflow-hidden rounded-[18px] bg-surface-2">
          <Image src={listing.images[0]} alt={`${listing.title} — ${listing.location}`} fill sizes="(min-width:1280px) 190px, (min-width:768px) 22vw, 45vw" priority={priority} quality={60} className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          {isGuestFavourite(listing.rating, listing.review_count) && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold leading-[13px] shadow-sm backdrop-blur-sm">Guest favourite</span>
          )}
        </div>
        <div className="px-1 pt-2.5 text-[13px] leading-4">
          <h3 className="line-clamp-2 font-medium">{listing.property_type} in {cityOf(listing.location)}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-[#6c6c6c]">
            <span>{money(listing.price_per_night_cents)} night</span>
            <span aria-hidden>·</span>
            <span className="flex items-center gap-0.5"><Star className="size-2.5 fill-current" aria-hidden />{listing.rating ? fmtRating(listing.rating) : "New"}</span>
          </p>
        </div>
      </Link>
      <FavoriteButton listingId={listing.id} title={listing.title} />
    </article>
  );
}
