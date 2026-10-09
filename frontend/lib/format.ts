import { differenceInCalendarDays, format, parseISO } from "date-fns";

/** Cents → "$1,234" (whole dollars) or "$1,234.50" when there are cents. */
export function money(cents: number, opts: { forceCents?: boolean } = {}): string {
  const whole = cents % 100 === 0 && !opts.forceCents;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
}

export const toISO = (d: Date) => format(d, "yyyy-MM-dd");
export const fromISO = (s: string) => parseISO(s);
export const nightsBetween = (a: string, b: string) => differenceInCalendarDays(parseISO(b), parseISO(a));

export function formatDate(iso: string, pattern = "MMM d, yyyy") {
  return format(parseISO(iso), pattern);
}

export function formatRange(a: string, b: string) {
  const s = parseISO(a);
  const e = parseISO(b);
  if (s.getFullYear() !== e.getFullYear()) return `${format(s, "MMM d, yyyy")} – ${format(e, "MMM d, yyyy")}`;
  if (s.getMonth() === e.getMonth()) return `${format(s, "MMM d")} – ${format(e, "d")}`;
  return `${format(s, "MMM d")} – ${format(e, "MMM d")}`;
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const CATEGORY_LABELS: Record<string, string> = {
  "amazing-views": "Amazing views",
  cabins: "Cabins",
  beachfront: "Beachfront",
  countryside: "Countryside",
  design: "Design",
  "tiny-homes": "Tiny homes",
  pools: "Amazing pools",
  mountains: "Mountains",
  lakefront: "Lakefront",
  unique: "Unique stays",
};

/** Next/Image loader-free helper: shrink Unsplash URLs requested by seed data. */
export const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

/** "5.0", "4.83" - Airbnb shows at least one decimal and at most two. */
export const fmtRating = (r: number) => (Math.round(r * 100) % 10 === 0 ? r.toFixed(1) : r.toFixed(2));

/** Derived (not stored) so it is always consistent with the reviews shown. */
export const isGuestFavourite = (rating: number | null, reviews: number) => (rating ?? 0) >= 4.8 && reviews >= 3;

export const cityOf = (location: string) => location.split(",")[0];
