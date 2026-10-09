"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff, Star } from "lucide-react";
import { FavoriteButton } from "@/components/listings/FavoriteButton";
import { money, plural } from "@/lib/format";
import type { Listing } from "@/types";

interface Props {
  listing: Listing;
  /** Query string (dates/guests) forwarded to the detail page so the stay carries over. */
  carry?: string;
  priority?: boolean;
}

export function ListingCard({ listing, carry = "", priority = false }: Props) {
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const images = listing.images.slice(0, 5);
  const href = `/listings/${listing.id}${carry ? `?${carry}` : ""}`;
  const q = listing.quote;

  const step = (e: React.MouseEvent, d: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx((i) => (i + d + images.length) % images.length);
  };

  return (
    <article className="group relative">
      <Link href={href} className="block rounded-xl focus-visible:outline-offset-4" aria-label={`${listing.title}, ${listing.location}`}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-2">
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

        <div className="mt-3 flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-[15px] font-semibold">{listing.location}</h3>
          <p className="flex shrink-0 items-center gap-1 text-[15px]">
            {listing.rating ? (
              <>
                <Star className="size-3.5 fill-ink" aria-hidden />
                <span>{listing.rating.toFixed(2)}</span>
                <span className="sr-only">average rating from {plural(listing.review_count, "review")}</span>
              </>
            ) : (
              <span className="text-ink-2">New</span>
            )}
          </p>
        </div>
        <p className="line-clamp-1 text-[15px] text-ink-2">{listing.title}</p>
        <p className="text-[15px] text-ink-2">
          {listing.property_type} · {plural(listing.bedrooms, "bedroom")}
        </p>
        <p className="mt-1 text-[15px]">
          <span className="font-semibold">{money(listing.price_per_night_cents)}</span>
          <span className="text-ink"> night</span>
          {q && (
            <span className="text-ink-2">
              {" "}· <span className="font-medium text-ink underline">{money(q.total_price_cents)} total</span>
              <span className="sr-only"> for {plural(q.nights, "night")}</span>
            </span>
          )}
        </p>
      </Link>
      {/* Sibling of the link (not a child), so clicking it can never navigate. */}
      <FavoriteButton listingId={listing.id} title={listing.title} />
    </article>
  );
}
