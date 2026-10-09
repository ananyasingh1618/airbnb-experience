"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import type { Listing } from "@/types";

const PlaceMap = dynamic(() => import("@/components/listings/PlaceMap"), { ssr: false, loading: () => <div className="skeleton size-full" /> });

export function LocationMap({ listing }: { listing: Listing }) {
  const { latitude: lat, longitude: lng } = listing;
  return (
    <section id="location" aria-labelledby="where" className="scroll-mt-24">
      <h2 id="where" className="mb-1 text-[22px] font-medium tracking-[-0.02em]">Where you&apos;ll be</h2>
      <p className="mb-6 text-base">{listing.location}</p>
      <div className="h-[480px] overflow-hidden rounded-xl border border-[#ebebeb]">
        {lat != null && lng != null ? <PlaceMap lat={lat} lng={lng} label={listing.location} /> : (
          <div className="grid h-full place-items-center bg-surface text-ink-2"><span className="flex items-center gap-2"><MapPin className="size-5" aria-hidden />{listing.location}</span></div>
        )}
      </div>
      <p className="mt-3 text-xs text-ink-2">Exact location is provided after booking.</p>
    </section>
  );
}
