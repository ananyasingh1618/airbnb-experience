"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Grip, Heart, Share2 } from "lucide-react";
import { PhotoViewer } from "@/components/listings/PhotoViewer";
import { useFavorites } from "@/lib/favorites";
import { useToast } from "@/components/ui/Toast";

export function ListingGallery({ images, title, listingId }: { images: string[]; title: string; listingId: number }) {
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(0);
  const [idx, setIdx] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const { isFavorite, toggle } = useFavorites();
  const { toast } = useToast();
  const show = (i: number) => { setFocus(i); setOpen(true); };
  const alt = (i: number) => `${title} — photo ${i + 1} of ${images.length}`;
  const tile = "relative block overflow-hidden bg-surface-2 transition-[filter] duration-200 hover:brightness-90";
  const on = isFavorite(listingId);
  const share = async () => { try { await navigator.clipboard.writeText(window.location.href.split("?")[0]); toast("Link copied to clipboard", "success"); } catch { toast("Couldn't copy the link", "error"); } };
  const round = "grid size-8 place-items-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.25)]";

  return (
    <>
      {/* Mobile: full-bleed swipeable hero with floating back / share / save buttons */}
      <div className="relative -mx-4 sm:hidden">
        <div ref={scroller} onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))} className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto" aria-label="Photos">
          {images.map((src, i) => (
            <button key={src} onClick={() => show(i)} className="relative aspect-[4/3] w-full shrink-0 snap-center bg-surface-2" aria-label={`Open photo ${i + 1}`}>
              <Image src={src} alt={alt(i)} fill sizes="100vw" priority={i === 0} className="object-cover" />
            </button>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between">
          <Link href="/" aria-label="Back to explore" className={`${round} pointer-events-auto size-9`}><ChevronLeft className="size-5" /></Link>
          <div className="pointer-events-auto flex gap-3">
            <button onClick={share} aria-label="Share" className={`${round} size-9`}><Share2 className="size-4" /></button>
            <button onClick={() => toggle(listingId)} aria-pressed={on} aria-label={on ? "Remove from wishlist" : "Save to wishlist"} className={`${round} size-9`}><Heart className={`size-4 ${on ? "fill-brand text-brand" : ""}`} /></button>
          </div>
        </div>
        <span className="pointer-events-none absolute bottom-3 right-4 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">{idx + 1} / {images.length}</span>
      </div>

      {/* Desktop: one dominant photo + four supporting */}
      <div className="relative hidden aspect-[1120/476] w-full grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-xl sm:grid">
        <button onClick={() => show(0)} className={`${tile} ${images.length >= 5 ? "col-span-2 row-span-2" : "col-span-4 row-span-2"}`} aria-label="Open photo 1">
          <Image src={images[0]} alt={alt(0)} fill priority sizes="(min-width:1280px) 560px, 50vw" quality={75} className="object-cover" />
        </button>
        {images.slice(1, 5).map((src, i) => (
          <button key={src} onClick={() => show(i + 1)} className={tile} aria-label={`Open photo ${i + 2}`}>
            <Image src={src} alt={alt(i + 1)} fill sizes="(min-width:1280px) 280px, 25vw" quality={60} className="object-cover" />
          </button>
        ))}
        <button onClick={() => show(0)} className="absolute bottom-6 right-6 flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs font-medium shadow-[0_1px_4px_rgba(0,0,0,0.2)] transition-colors hover:bg-white">
          <Grip className="size-4" aria-hidden />
          Show all photos
        </button>
      </div>

      <PhotoViewer open={open} onClose={() => setOpen(false)} images={images} title={title} listingId={listingId} focus={focus} />
    </>
  );
}
