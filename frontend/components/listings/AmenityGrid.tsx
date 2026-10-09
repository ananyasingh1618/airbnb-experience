"use client";

import { useState } from "react";
import { AmenityIcon } from "@/components/ui/Icons";
import { Dialog } from "@/components/ui/Dialog";
import type { Amenity } from "@/types";

export function AmenityGrid({ amenities }: { amenities: Amenity[] }) {
  const [open, setOpen] = useState(false);
  const preview = amenities.slice(0, 10);
  const renderList = (items: Amenity[]) => (
    <ul className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map((a) => (
        <li key={a.id} className="flex items-center gap-4 text-base"><AmenityIcon name={a.icon} />{a.name}</li>
      ))}
    </ul>
  );
  return (
    <section id="amenities" aria-labelledby="amenities-h" className="scroll-mt-24">
      <h2 id="amenities-h" className="mb-6 text-[22px] font-medium tracking-[-0.02em]">What this place offers</h2>
      {renderList(preview)}
      {amenities.length > preview.length && (
        <>
          <button onClick={() => setOpen(true)} className="btn-grey mt-8">Show all {amenities.length} amenities</button>
          <Dialog open={open} onClose={() => setOpen(false)} title="What this place offers" closeRight><div className="p-6">{renderList(amenities)}</div></Dialog>
        </>
      )}
    </section>
  );
}
