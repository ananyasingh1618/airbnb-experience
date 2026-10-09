/** URL <-> search state. The URL is the source of truth for the Explore page. */
export interface SearchState {
  q: string;
  check_in: string;
  check_out: string;
  guests: number;
  min_price: string;
  max_price: string;
  property_type: string;
  amenities: string[];
  category: string;
  sort: string;
  page: number;
  favorites: boolean;
}

export const EMPTY_SEARCH: SearchState = {
  q: "", check_in: "", check_out: "", guests: 0, min_price: "", max_price: "",
  property_type: "", amenities: [], category: "", sort: "recommended", page: 1, favorites: false,
};

type SP = { get(k: string): string | null };

export function parseSearch(sp: SP): SearchState {
  const num = (k: string) => {
    const n = Number(sp.get(k));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  };
  return {
    q: sp.get("q") ?? "",
    check_in: sp.get("check_in") ?? "",
    check_out: sp.get("check_out") ?? "",
    guests: num("guests"),
    min_price: sp.get("min_price") ?? "",
    max_price: sp.get("max_price") ?? "",
    property_type: sp.get("type") ?? "",
    amenities: (sp.get("amenities") ?? "").split(",").filter(Boolean),
    category: sp.get("category") ?? "",
    sort: sp.get("sort") ?? "recommended",
    page: num("page") || 1,
    favorites: sp.get("favorites") === "1",
  };
}

export function toQuery(s: SearchState): URLSearchParams {
  const p = new URLSearchParams();
  if (s.q.trim()) p.set("q", s.q.trim());
  if (s.check_in && s.check_out) {
    p.set("check_in", s.check_in);
    p.set("check_out", s.check_out);
  }
  if (s.guests > 0) p.set("guests", String(s.guests));
  if (s.min_price) p.set("min_price", s.min_price);
  if (s.max_price) p.set("max_price", s.max_price);
  if (s.property_type) p.set("type", s.property_type);
  if (s.amenities.length) p.set("amenities", s.amenities.join(","));
  if (s.category) p.set("category", s.category);
  if (s.sort && s.sort !== "recommended") p.set("sort", s.sort);
  if (s.page > 1) p.set("page", String(s.page));
  if (s.favorites) p.set("favorites", "1");
  return p;
}

/** Params for the API (note `type` → `property_type`, amenities comma-joined). */
export function toApiParams(s: SearchState, pageSize: number) {
  return {
    q: s.q.trim() || undefined,
    check_in: s.check_in && s.check_out ? s.check_in : undefined,
    check_out: s.check_in && s.check_out ? s.check_out : undefined,
    guests: s.guests || undefined,
    min_price: s.min_price || undefined,
    max_price: s.max_price || undefined,
    property_type: s.property_type || undefined,
    amenities: s.amenities.join(",") || undefined,
    category: s.category || undefined,
    sort: s.sort,
    page: s.page,
    page_size: pageSize,
    favorites_only: s.favorites || undefined,
  };
}

/** Number of "advanced" filters (those inside the Filters dialog). */
export const filterCount = (s: SearchState) =>
  (s.min_price || s.max_price ? 1 : 0) + (s.property_type ? 1 : 0) + s.amenities.length;
