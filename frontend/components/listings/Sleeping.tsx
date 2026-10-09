import { SafeImage } from "@/components/ui/SafeImage";
import { plural } from "@/lib/format";
import type { Listing } from "@/types";

/** "Where you'll sleep": one card per bedroom, beds spread across rooms from the listing's real counts. */
export function Sleeping({ listing }: { listing: Listing }) {
  const rooms = Math.max(1, listing.bedrooms);
  const base = Math.floor(listing.beds / rooms);
  const extra = listing.beds % rooms;
  const photos = listing.images.slice(1).length ? listing.images.slice(1) : listing.images;
  return (
    <section aria-labelledby="sleep">
      <h2 id="sleep" className="mb-6 text-[22px] font-medium tracking-[-0.02em]">Where you&apos;ll sleep</h2>
      <div className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {Array.from({ length: rooms }).map((_, i) => {
          const beds = Math.max(1, base + (i < extra ? 1 : 0));
          return (
            <div key={i} className="w-[min(320px,78%)] shrink-0">
              <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-surface-2">
                <SafeImage src={photos[i % photos.length]} alt={`${listing.bedrooms === 0 ? "Living area" : `Bedroom ${i + 1}`} at ${listing.title}`} fill sizes="320px" quality={60} className="object-cover" />
              </div>
              <p className="mt-4 text-base font-medium">{listing.bedrooms === 0 ? "Living area" : `Bedroom ${i + 1}`}</p>
              <p className="text-sm text-ink-2">{plural(beds, "bed")}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
