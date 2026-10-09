import { Skeleton } from "@/components/ui/States";
import { ListingCard } from "@/components/listings/ListingCard";
import type { Listing } from "@/types";

export const GRID = "grid grid-cols-1 gap-x-6 gap-y-10 min-[560px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

export function ListingGrid({ items, carry }: { items: Listing[]; carry?: string }) {
  return (
    <div className={GRID}>
      {items.map((l, i) => (
        <ListingCard key={l.id} listing={l} carry={carry} priority={i < 4} />
      ))}
    </div>
  );
}

export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={GRID} aria-busy="true" aria-label="Loading stays">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="mt-3 h-4 w-3/5" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <Skeleton className="mt-2 h-4 w-2/5" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}
