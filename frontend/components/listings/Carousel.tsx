"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

/** Airbnb home-page row: title + arrow link on the left, round prev/next buttons on the right. */
export function Carousel({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const measure = () => {
    const el = scroller.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const go = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.9, behavior: "smooth" });
  const arrow = "grid size-8 place-items-center rounded-full bg-[var(--grey-btn)] text-ink transition-[background-color,opacity] hover:bg-[#e4e4e4] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-[var(--grey-btn)]";
  return (
    <section aria-label={title} className="mt-[38px] first:mt-0">
      <div className="mb-3 flex items-center justify-between px-0.5">
        <Link href={href} className="group flex items-center gap-2">
          <h2 className="text-xl font-semibold leading-6 tracking-[-0.009em]">{title}</h2>
          <span className="grid size-7 place-items-center rounded-full bg-[var(--grey-btn)] transition-colors group-hover:bg-[#e4e4e4]" aria-hidden><ArrowRight className="size-4" /></span>
        </Link>
        <div className="hidden gap-2 sm:flex">
          <button className={arrow} disabled={edge.start} onClick={() => go(-1)} aria-label={`Scroll ${title} left`}><ChevronLeft className="size-4" /></button>
          <button className={arrow} disabled={edge.end} onClick={() => go(1)} aria-label={`Scroll ${title} right`}><ChevronRight className="size-4" /></button>
        </div>
      </div>
      <div ref={scroller} onScroll={measure} className="scrollbar-none -mx-4 flex snap-x snap-proximity scroll-px-4 gap-3 overflow-x-auto px-4 sm:mx-0 sm:scroll-px-0 sm:px-0">
        {children}
      </div>
    </section>
  );
}
