"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff, Star } from "lucide-react";
import { FavoriteButton } from "@/components/listings/FavoriteButton";
import { cityOf, fmtRating, formatRange, isGuestFavourite, money, plural } from "@/lib/format";
import type { Listing } from "@/types";

interface Props {
  onHover?: (id: number | null) => void;
  listing: Listing;
  /** Query string (dates/guests) forwarded to the detail page so the stay carries over. */
  carry?: string;
  priority?: boolean;
}

export function ListingCard({ listing, carry = "", priority = false, onHover }: Props) {
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const images = listing.images.slice(0, 5);
  const href = `/listings/${listing.id}${carry ? `?${carry}` : ""}`;
  const q = listing.quote;
  const cp = new URLSearchParams(carry);
  const dates = cp.get("check_in") && cp.get("check_out") ? formatRange(cp.get("check_in")!, cp.get("check_out")!) : null;

  const step = (e: React.MouseEvent, d: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx((i) => (i + d + images.length) % images.length);
  };

  return (
    <article className="group relative" onMouseEnter={() => onHover?.(listing.id)} onMouseLeave={() => onHover?.(null)}>
      <Link href={href} className="block rounded-xl focus-visible:outline-offset-4" aria-label={`${listing.title}, ${listing.location}`}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-surface-2">
          {failed[idx] ? (
            <div className="grid h-full place-items-center text-ink-2"><ImageOff className="size-8" aria-hidden /></div>
          ) : (
            <Image
              key={images[idx]}
              src={images[idx]}
              alt={`${listing.title} — photo ${idx + 1} of ${images.length}`}
              fill
              sizes="(min-width:1536px) 20vw, (min-width:1024px) 25vw, (min-width:640px) 33vw, 100vw"
              priority={priority && idx === 0}
              loading={priority ? undefined : "lazy"}
              quality={75}
              onError={() => setFailed((f) => ({ ...f, [idx]: true }))}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          )}
          {isGuestFavourite(listing.rating, listing.review_count) && (
            <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[13px] font-semibold shadow-sm">Guest favourite</span>
          )}
          {images.length > 1 && (
            <>
              <button onClick={(e) => step(e, -1)} aria-label="Previous photo" className="absolute left-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 opacity-0 shadow-sm transition-opacity duration-150 hover:scale-105 focus-visible:opacity-100 group-hover:opacity-100 max-md:hidden">
                <ChevronLeft className="size-4" />
              </button>
              <button onClick={(e) => step(e, 1)} aria-label="Next photo" className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 opacity-0 shadow-sm transition-opacity duration-150 hover:scale-105 focus-visible:opacity-100 group-hover:opacity-100 max-md:hidden">
                <ChevronRight className="size-4" />
              </button>
              <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1" aria-hidden>
                {images.map((_, i) => (
                  <span key={i} className={`size-1.5 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/55"}`} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mt-3 flex items-start justify-between gap-3 text-[15px] leading-5">
          <h3 className="line-clamp-1 font-semibold">{listing.property_type} in {cityOf(listing.location)}</h3>
          <p className="flex shrink-0 items-center gap-1">
            {listing.rating ? (
              <>
                <Star className="size-3 fill-ink" aria-hidden />
                <span>{fmtRating(listing.rating)}</span>
                <span className="text-ink-2">({listing.review_count})</span>
                <span className="sr-only"> average rating from {plural(listing.review_count, "review")}</span>
              </>
            ) : (
              <>
                <Star className="size-3 fill-ink" aria-hidden />
                <span>New</span>
              </>
            )}
          </p>
        </div>
        <p className="line-clamp-1 text-[15px] leading-5 text-ink-2">{listing.title}</p>
        <p className="text-[15px] leading-5 text-ink-2">
          {listing.bedrooms === 0 ? "Studio" : plural(listing.bedrooms, "bedroom")} · {plural(listing.beds, "bed")} · {plural(listing.bathrooms, "bathroom")}
        </p>
        {dates && <p className="text-[15px] leading-5 text-ink-2">{dates}</p>}
        <p className="mt-1 text-[15px] leading-5">
          {q ? (
            <>
              <span className="font-semibold underline">{money(q.total_price_cents)}</span>
              <span> for {plural(q.nights, "night")}</span>
            </>
          ) : (
            <>
              <span className="font-semibold">{money(listing.price_per_night_cents)}</span>
              <span> night</span>
            </>
          )}
        </p>
      </Link>
      {/* Sibling of the link (not a child), so clicking it can never navigate. */}
      <FavoriteButton listingId={listing.id} title={listing.title} />
    </article>
  );
}
