"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { fmtRating, money, plural } from "@/lib/format";
import type { Listing, Quote } from "@/types";

/** Airbnb's sticky section nav; the price + Reserve appear once the reservation card scrolls away. */
export function DetailSubNav({ listing, quote }: { listing: Listing; quote: Quote | null }) {
  const [show, setShow] = useState(false);
  const [cardGone, setCardGone] = useState(false);

  useEffect(() => {
    const gallery = document.getElementById("photos");
    const card = document.getElementById("reserve");
    const obs: IntersectionObserver[] = [];
    if (gallery) { const o = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0)); o.observe(gallery); obs.push(o); }
    if (card) { const o = new IntersectionObserver(([e]) => setCardGone(!e.isIntersecting && e.boundingClientRect.top < 0)); o.observe(card); obs.push(o); }
    return () => obs.forEach((o) => o.disconnect());
  }, []);

  const link = "relative py-6 text-sm font-medium text-ink transition-colors hover:text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-ink after:opacity-0 hover:after:opacity-100";
  return (
    <div className={`fixed inset-x-0 top-0 z-40 hidden border-b border-[#ebebeb] bg-white transition-transform duration-200 lg:block ${show ? "translate-y-0" : "-translate-y-full"}`} aria-hidden={!show}>
      <div className="mx-auto flex h-20 max-w-[1120px] items-center justify-between">
        <nav aria-label="Listing sections" className="flex gap-6">
          {[["photos", "Photos"], ["amenities", "Amenities"], ["reviews", "Reviews"], ["location", "Location"]].map(([id, l]) => (
            <a key={id} href={`#${id}`} tabIndex={show ? 0 : -1} className={link}>{l}</a>
          ))}
        </nav>
        {cardGone && (
          <div className="flex items-center gap-4">
            <p className="text-sm leading-tight"><span className="text-base font-semibold underline">{money(quote ? quote.total_price_cents : listing.price_per_night_cents)}</span><span className="block text-ink-2">{quote ? `for ${plural(quote.nights, "night")}` : "night"}</span>
              {listing.rating && <span className="flex items-center gap-1 text-xs"><Star className="size-3 fill-ink" aria-hidden /><b className="font-semibold">{fmtRating(listing.rating)}</b><span className="text-ink-2">· {plural(listing.review_count, "review")}</span></span>}</p>
            <a href="#reserve" tabIndex={show ? 0 : -1} className="rounded-full bg-gradient-to-r from-[#e61e4d] via-[#e31c5f] to-[#d70466] px-8 py-3 text-base font-medium text-white">Reserve</a>
          </div>
        )}
      </div>
    </div>
  );
}
