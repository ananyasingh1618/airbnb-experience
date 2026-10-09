import { MapPin } from "lucide-react";
import type { Listing } from "@/types";

export function LocationMap({ listing }: { listing: Listing }) {
  const { latitude: lat, longitude: lng } = listing;
  return (
    <section aria-labelledby="where">
      <h2 id="where" className="mb-2 text-[22px] font-semibold">Where you&apos;ll be</h2>
      <p className="mb-5 text-ink-2">{listing.location}</p>
      {lat != null && lng != null ? (
        <div className="overflow-hidden rounded-2xl border border-line">
          <iframe
            title={`Map of ${listing.location}`}
            loading="lazy"
            className="h-[360px] w-full"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.06}%2C${lat - 0.04}%2C${lng + 0.06}%2C${lat + 0.04}&layer=mapnik&marker=${lat}%2C${lng}`}
          />
        </div>
      ) : (
        <div className="grid h-[240px] place-items-center rounded-2xl bg-surface text-ink-2">
          <span className="flex items-center gap-2"><MapPin className="size-5" aria-hidden />{listing.location}</span>
        </div>
      )}
      <p className="mt-3 text-xs text-ink-2">Map © OpenStreetMap contributors. Exact address is shared after booking.</p>
    </section>
  );
}
