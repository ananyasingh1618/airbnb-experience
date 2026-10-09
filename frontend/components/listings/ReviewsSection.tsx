"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Laurel } from "@/components/listings/Laurel";
import { Avatar } from "@/components/ui/Avatar";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { fmtRating, formatDate, isGuestFavourite, plural } from "@/lib/format";
import type { Review } from "@/types";

function Stars({ n }: { n: number }) {
  return <span className="flex items-center gap-px" aria-label={`Rated ${n} out of 5`}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-2.5 ${i < n ? "fill-ink" : "fill-[#ddd] stroke-[#ddd]"}`} aria-hidden />)}</span>;
}

function ReviewItem({ r }: { r: Review }) {
  return (
    <li>
      <div className="mb-3 flex items-center gap-3">
        <Avatar name={r.guest.name} src={r.guest.avatar_url} size={48} />
        <div><p className="text-base font-medium leading-tight">{r.guest.name}</p><p className="text-sm text-ink-2">Guest</p></div>
      </div>
      <p className="mb-2 flex items-center gap-2 text-sm"><Stars n={r.rating} /><span aria-hidden>·</span><span>{formatDate(r.created_at.slice(0, 10), "MMMM yyyy")}</span></p>
      <p className="text-base leading-6">{r.comment}</p>
    </li>
  );
}

export function ReviewsSection({ listingId }: { listingId: number }) {
  const { data, error, loading, reload } = useAsync(() => api.reviews(listingId), [listingId]);
  const [all, setAll] = useState(false);
  const fav = data?.average ? isGuestFavourite(data.average, data.count) : false;

  return (
    <section id="reviews" aria-labelledby="reviews-h" className="scroll-mt-24">
      {error ? <ErrorState message={error.message} onRetry={reload} /> : loading || !data ? (
        <div className="grid gap-8 md:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : data.count === 0 ? (
        <><h2 id="reviews-h" className="mb-3 text-[22px] font-medium">Reviews</h2><p className="text-ink-2">No reviews yet.</p></>
      ) : (
        <>
          {fav ? (
            <div className="mb-10 flex flex-col items-center text-center">
              <h2 id="reviews-h" className="sr-only">Guest reviews</h2>
              <div className="flex items-center gap-2"><Laurel className="h-20 w-10" /><span className="text-[64px] font-bold leading-none tracking-[-0.04em]">{fmtRating(data.average!)}</span><Laurel flip className="h-20 w-10" /></div>
              <p className="mt-3 text-[22px] font-medium">Guest favourite</p>
              <p className="mt-1 max-w-sm text-base text-ink-2">One of the most loved homes on Airbnb, based on ratings, reviews and reliability</p>
            </div>
          ) : (
            <h2 id="reviews-h" className="mb-8 flex items-center gap-2 text-[22px] font-medium tracking-[-0.02em]"><Star className="size-5 fill-ink" aria-hidden />{fmtRating(data.average!)} · {plural(data.count, "review")}</h2>
          )}
          <ul className="grid gap-x-16 gap-y-10 md:grid-cols-2">{data.items.slice(0, 6).map((r) => <ReviewItem key={r.id} r={r} />)}</ul>
          {data.count > 6 && <button onClick={() => setAll(true)} className="btn-grey mt-10">Show all {data.count} reviews</button>}
          <p className="mt-6 text-xs text-ink-2">Sample reviews written for this demo — not from real guests.</p>
          <Dialog open={all} onClose={() => setAll(false)} title={`${fmtRating(data.average!)} · ${plural(data.count, "review")}`} closeRight size="lg"><ul className="space-y-8 p-6">{data.items.map((r) => <ReviewItem key={r.id} r={r} />)}</ul></Dialog>
        </>
      )}
    </section>
  );
}
