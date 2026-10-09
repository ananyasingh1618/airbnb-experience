"use client";

import { Star } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { formatDate, plural } from "@/lib/format";

export function ReviewsSection({ listingId }: { listingId: number }) {
  const { data, error, loading, reload } = useAsync(() => api.reviews(listingId), [listingId]);

  return (
    <section aria-labelledby="reviews">
      <h2 id="reviews" className="mb-6 flex items-center gap-2 text-[22px] font-semibold">
        {data?.average ? (
          <>
            <Star className="size-5 fill-ink" aria-hidden />
            {data.average.toFixed(2)} · {plural(data.count, "review")}
          </>
        ) : (
          "Reviews"
        )}
      </h2>
      {error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : loading || !data ? (
        <div className="grid gap-8 md:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : data.count === 0 ? (
        <p className="text-ink-2">No reviews yet.</p>
      ) : (
        <>
          <ul className="grid gap-x-16 gap-y-8 md:grid-cols-2">
            {data.items.map((r) => (
              <li key={r.id}>
                <div className="mb-3 flex items-center gap-3">
                  <Avatar name={r.guest.name} src={r.guest.avatar_url} size={44} />
                  <div>
                    <p className="font-semibold">{r.guest.name}</p>
                    <p className="text-sm text-ink-2">{formatDate(r.created_at.slice(0, 10), "MMMM yyyy")}</p>
                  </div>
                </div>
                <p className="mb-1 flex items-center gap-0.5" aria-label={`Rated ${r.rating} out of 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`size-3 ${i < r.rating ? "fill-ink" : "fill-line stroke-line"}`} aria-hidden />
                  ))}
                </p>
                <p className="leading-relaxed">{r.comment}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-ink-2">Sample reviews written for this demo — not from real guests.</p>
        </>
      )}
    </section>
  );
}
