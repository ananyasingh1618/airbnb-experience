"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, Heart, Share2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { useFavorites } from "@/lib/favorites";
import { useToast } from "@/components/ui/Toast";

/** Full-screen "Photo tour": thumbnail strip, then every photo in Airbnb's 1-large / 2-small rhythm. */
export function PhotoViewer({ open, onClose, images, title, listingId, focus = 0 }: { open: boolean; onClose: () => void; images: string[]; title: string; listingId: number; focus?: number }) {
  const { isFavorite, toggle } = useFavorites();
  const { toast } = useToast();
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const alt = (i: number) => `${title} — photo ${i + 1} of ${images.length}`;
  const goto = (i: number) => refs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
  useEffect(() => { if (open && focus > 0) setTimeout(() => refs.current[focus]?.scrollIntoView({ block: "start" }), 50); }, [open, focus]);
  const share = async () => { try { await navigator.clipboard.writeText(`${window.location.origin}/listings/${listingId}`); toast("Link copied to clipboard", "success"); } catch { toast("Couldn't copy the link", "error"); } };
  const on = isFavorite(listingId);

  return (
    <Dialog open={open} onClose={onClose} title={`${title} — photos`} size="screen" bare>
      <div className="mx-auto max-w-[1120px] px-4 pb-16 sm:px-6">
        <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between bg-white px-4 py-4 sm:-mx-6 sm:px-6">
          <button onClick={onClose} aria-label="Close photo tour" className="grid size-8 place-items-center rounded-full transition-colors hover:bg-[var(--grey-btn)]"><ChevronLeft className="size-5" /></button>
          <div className="flex items-center gap-1">
            <button onClick={share} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium underline hover:bg-[var(--grey-btn)]"><Share2 className="size-4" aria-hidden />Share</button>
            <button onClick={() => toggle(listingId)} aria-pressed={on} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium underline hover:bg-[var(--grey-btn)]"><Heart className={`size-4 ${on ? "fill-brand text-brand" : ""}`} aria-hidden />{on ? "Saved" : "Save"}</button>
          </div>
        </div>
        <h2 className="mb-6 mt-2 text-[22px] font-medium tracking-[-0.02em]">Photo tour</h2>
        <div className="scrollbar-none mb-10 flex gap-4 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button key={src} onClick={() => goto(i)} className="group w-[146px] shrink-0 text-left" aria-label={`Go to photo ${i + 1}`}>
              <span className="relative block aspect-[3/2] overflow-hidden rounded-lg bg-[var(--grey-btn)]"><Image src={src} alt="" fill sizes="146px" quality={60} className="object-cover transition-opacity group-hover:opacity-80" /></span>
              <span className="mt-2 block text-sm">Photo {i + 1}</span>
            </button>
          ))}
        </div>
        <div className="mx-auto grid max-w-[740px] grid-cols-2 gap-2">
          {images.map((src, i) => (
            <div key={src} ref={(el) => { refs.current[i] = el; }} className={`relative overflow-hidden bg-[var(--grey-btn)] ${i % 3 === 0 ? "col-span-2 aspect-[3/2]" : "aspect-square"} scroll-mt-20`}>
              <Image src={src} alt={alt(i)} fill sizes="(min-width:768px) 740px, 100vw" quality={75} className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  );
}
