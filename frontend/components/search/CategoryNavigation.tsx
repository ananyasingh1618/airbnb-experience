"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CATEGORY_ICONS } from "@/components/ui/Icons";
import { CATEGORY_LABELS } from "@/lib/format";

const ORDER = ["amazing-views", "cabins", "beachfront", "countryside", "design", "tiny-homes", "pools", "mountains", "lakefront", "unique"];

export function CategoryNavigation({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ left: false, right: true });

  const measure = () => {
    const el = scroller.current;
    if (!el) return;
    setEdge({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  };
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const scrollBy = (dx: number) => scroller.current?.scrollBy({ left: dx, behavior: "smooth" });

  return (
    <nav aria-label="Browse by category" className="relative min-w-0 flex-1">
      {edge.left && (
        <button onClick={() => scrollBy(-320)} aria-label="Scroll categories left" className="absolute left-0 top-1/2 z-10 hidden size-8 -translate-y-1/2 place-items-center rounded-full border border-line-strong bg-bg shadow-sm transition-transform hover:scale-105 md:grid">
          <ChevronLeft className="size-4" />
        </button>
      )}
      <div ref={scroller} onScroll={measure} className="scrollbar-none flex gap-8 overflow-x-auto px-1 md:gap-9">
        {ORDER.map((key) => {
          const Icon = CATEGORY_ICONS[key];
          const active = value === key;
          return (
            <button
              key={key}
              onClick={() => onChange(active ? "" : key)}
              aria-pressed={active}
              className={`group flex shrink-0 flex-col items-center gap-2 border-b-2 pb-3 pt-1 text-xs font-medium transition-colors duration-150 ${
                active ? "border-ink text-ink" : "border-transparent text-ink-2 hover:border-line-strong hover:text-ink"
              }`}
            >
              <Icon className={`size-6 transition-opacity ${active ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`} strokeWidth={1.5} aria-hidden />
              <span className="whitespace-nowrap">{CATEGORY_LABELS[key]}</span>
            </button>
          );
        })}
      </div>
      {edge.right && (
        <button onClick={() => scrollBy(320)} aria-label="Scroll categories right" className="absolute right-0 top-1/2 z-10 hidden size-8 -translate-y-1/2 place-items-center rounded-full border border-line-strong bg-bg shadow-sm transition-transform hover:scale-105 md:grid">
          <ChevronRight className="size-4" />
        </button>
      )}
    </nav>
  );
}
