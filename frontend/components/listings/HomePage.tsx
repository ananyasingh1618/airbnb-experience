"use client";

import { Carousel } from "@/components/listings/Carousel";
import { CompactCard } from "@/components/listings/CompactCard";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { useDemoUser } from "@/lib/demo-user";
import { buildRows } from "@/lib/home-rows";

function RowSkeleton() {
  return (
    <div className="mt-11 first:mt-0" aria-hidden>
      <Skeleton className="mb-3 h-6 w-48" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="w-[44%] shrink-0 sm:w-[30%] md:w-[calc((100%-48px)/5)] lg:w-[calc((100%-60px)/6)] xl:w-[calc((100%-72px)/7)]">
            <Skeleton className="aspect-[182/173] w-full rounded-[18px]" />
            <Skeleton className="mt-3 h-3.5 w-3/4" />
            <Skeleton className="mt-1.5 h-3.5 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomePage() {
  const { ready, user } = useDemoUser();
  const { data, error, reload } = useAsync(ready ? () => api.listings({ page_size: 48, sort: "rating" }) : null, [ready, user?.id]);
  const rows = data ? buildRows(data.items) : [];
  return (
    <div className="mx-auto max-w-[1760px] px-4 pb-6 pt-8 sm:px-6 md:px-10 md:pt-12 xl:px-12" aria-busy={!data && !error}>
      {error ? <ErrorState message={error.message} onRetry={reload} /> : !data ? (<><RowSkeleton /><RowSkeleton /></>) : rows.length === 0 ? (
        <EmptyState title="No stays yet" body="There are no listings to show." action={{ label: "Become a host", href: "/host" }} />
      ) : (
        rows.map((r, i) => (
          <Carousel key={r.title} title={r.title} href={r.href}>
            {r.items.map((l, j) => <CompactCard key={l.id} listing={l} priority={i === 0 && j < 7} />)}
          </Carousel>
        ))
      )}
    </div>
  );
}
