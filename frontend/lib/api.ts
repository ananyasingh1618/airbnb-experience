import type {
  Availability, Booking, HostListing, Listing, ListingInput, ListingPage, Meta, ReviewsResponse, User,
} from "@/types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public field?: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

// Demo identity: set by DemoUserProvider. NOT real auth - see README.
let demoUserId: number | null = null;
export function setDemoUserId(id: number | null) {
  demoUserId = id;
}

async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (demoUserId != null) headers["X-Demo-User"] = String(demoUserId);
  if (init.json !== undefined) headers["Content-Type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "network_error", "Can't reach the server. Check your connection and try again.");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = data?.error;
    throw new ApiError(
      res.status,
      e?.code ?? "error",
      e?.message ?? "Something went wrong. Please try again.",
      e?.field,
      e?.fields,
    );
  }
  return data as T;
}

const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : "";
};

export const api = {
  meta: () => request<Meta>("/api/meta"),
  demoUsers: () => request<User[]>("/api/demo-users"),
  listings: (params: Record<string, string | number | boolean | undefined | null>, signal?: AbortSignal) =>
    request<ListingPage>(`/api/listings${qs(params)}`, { signal }),
  listing: (id: number | string) => request<Listing>(`/api/listings/${id}`),
  availability: (id: number | string, p: { check_in?: string; check_out?: string; guests?: number } = {}) =>
    request<Availability>(`/api/listings/${id}/availability${qs(p)}`),
  reviews: (id: number | string) => request<ReviewsResponse>(`/api/reviews/${id}`),
  createListing: (body: ListingInput) => request<Listing>("/api/listings", { method: "POST", json: body }),
  updateListing: (id: number, body: Partial<ListingInput>) =>
    request<Listing>(`/api/listings/${id}`, { method: "PATCH", json: body }),
  deleteListing: (id: number) => request<void>(`/api/listings/${id}`, { method: "DELETE" }),
  hostListings: () => request<HostListing[]>("/api/host/listings"),
  hostBookings: () => request<Booking[]>("/api/host/bookings"),
  createBooking: (body: { listing_id: number; check_in: string; check_out: string; guests: number }) =>
    request<Booking>("/api/bookings", { method: "POST", json: body }),
  myBookings: () => request<Booking[]>("/api/bookings/mine"),
  booking: (id: number | string) => request<Booking>(`/api/bookings/${id}`),
  cancelBooking: (id: number) => request<Booking>(`/api/bookings/${id}/cancel`, { method: "POST" }),
  favorites: () => request<number[]>("/api/favorites"),
  addFavorite: (listing_id: number) => request<unknown>("/api/favorites", { method: "POST", json: { listing_id } }),
  removeFavorite: (listing_id: number) => request<void>(`/api/favorites/${listing_id}`, { method: "DELETE" }),
};
