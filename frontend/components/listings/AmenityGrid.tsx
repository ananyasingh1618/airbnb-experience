"use client";

import { useState } from "react";
import { AmenityIcon } from "@/components/ui/Icons";
import { Dialog } from "@/components/ui/Dialog";
import { btn } from "@/components/ui/button";
import type { Amenity } from "@/types";

export function AmenityGrid({ amenities }: { amenities: Amenity[] }) {
  const [open, setOpen] = useState(false);
  const preview = amenities.slice(0, 6);
  const renderList = (items: Amenity[]) => (
    <ul className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map((a) => (
        <li key={a.id} className="flex items-center gap-4 text-[16px]">
          <AmenityIcon name={a.icon} />
          {a.name}
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-labelledby="amenities">
      <h2 id="amenities" className="mb-6 text-[22px] font-semibold">What this place offers</h2>
      {renderList(preview)}
      {amenities.length > preview.length && (
        <>
          <button onClick={() => setOpen(true)} className={btn("outline", "mt-8")}>Show all {amenities.length} amenities</button>
          <Dialog open={open} onClose={() => setOpen(false)} title="What this place offers">
            <div className="p-6">{renderList(amenities)}</div>
          </Dialog>
        </>
      )}
    </section>
  );
}
