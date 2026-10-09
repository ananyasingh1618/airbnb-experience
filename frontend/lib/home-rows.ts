import { isGuestFavourite } from "@/lib/format";
import type { Listing } from "@/types";

export interface HomeRow { title: string; href: string; items: Listing[] }

/** Groups the real API results into Airbnb-style carousel rows. Every arrow links to a matching search. */
export function buildRows(all: Listing[]): HomeRow[] {
  const by = (pred: (l: Listing) => boolean) => all.filter(pred);
  const cats = (...c: string[]) => by((l) => c.includes(l.category));
  const rows: HomeRow[] = [
    { title: "Guest favourites", href: "/?homes=1&sort=rating", items: by((l) => isGuestFavourite(l.rating, l.review_count)).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)) },
    { title: "Stay in the United States", href: "/?q=United%20States", items: by((l) => l.country === "United States") },
    { title: "Amazing pools", href: "/?category=pools", items: cats("pools") },
    { title: "Cabins & mountain retreats", href: "/?category=cabins", items: cats("cabins", "mountains") },
    { title: "Homes by the water", href: "/?category=beachfront", items: cats("beachfront", "lakefront") },
    { title: "Design stays", href: "/?category=design", items: cats("design") },
    { title: "Countryside & unique stays", href: "/?category=countryside", items: cats("countryside", "tiny-homes", "unique", "amazing-views") },
  ];
  return rows.filter((r) => r.items.length >= 2).map((r) => ({ ...r, items: r.items.slice(0, 7) }));
}
