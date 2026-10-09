"use client";

import { useState } from "react";
import Image from "next/image";
import { Grid2x2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";

export function ListingGallery({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(0);
  const show = (i: number) => { setFocus(i); setOpen(true); };
  const alt = (i: number) => `${title} — photo ${i + 1} of ${images.length}`;
  const tile = "relative block overflow-hidden bg-surface-2 transition-[filter] duration-200 hover:brightness-90";

  return (
    <>
      {/* Mobile: swipeable strip */}
      <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:hidden" aria-label="Photos">
        {images.map((src, i) => (
          <button key={src} onClick={() => show(i)} className="relative aspect-[4/3] w-[88%] shrink-0 snap-center overflow-hidden rounded-xl bg-surface-2" aria-label={`Open photo ${i + 1}`}>
            <Image src={src} alt={alt(i)} fill sizes="90vw" priority={i === 0} className="object-cover" />
          </button>
        ))}
      </div>

      {/* Desktop: one dominant photo + four supporting */}
      <div className="relative hidden aspect-[2.2/1] max-h-[520px] w-full grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl sm:grid">
        <button onClick={() => show(0)} className={`${tile} ${images.length >= 5 ? "col-span-2 row-span-2" : "col-span-4 row-span-2"}`} aria-label="Open photo 1">
          <Image src={images[0]} alt={alt(0)} fill priority sizes="(min-width:1280px) 640px, 50vw" quality={75} className="object-cover" />
        </button>
        {images.slice(1, 5).map((src, i) => (
          <button key={src} onClick={() => show(i + 1)} className={tile} aria-label={`Open photo ${i + 2}`}>
            <Image src={src} alt={alt(i + 1)} fill sizes="(min-width:1280px) 320px, 25vw" quality={60} className="object-cover" />
          </button>
        ))}
        <button onClick={() => show(0)} className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg border border-ink bg-bg px-4 py-2 text-sm font-semibold shadow-sm transition-colors hover:bg-surface">
          <Grid2x2 className="size-4" aria-hidden />
          Show all photos
        </button>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title={`${images.length} photos`} size="lg">
        <div className="space-y-3 p-3 sm:p-6">
          {images.map((src, i) => (
            <div key={src} ref={(el) => { if (el && open && i === focus) el.scrollIntoView({ block: "start" }); }} className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-surface-2">
              <Image src={src} alt={alt(i)} fill sizes="(min-width:768px) 680px, 100vw" quality={75} className="object-cover" />
            </div>
          ))}
        </div>
      </Dialog>
    </>
  );
}
