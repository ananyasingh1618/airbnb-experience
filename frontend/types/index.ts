export interface User {
  id: number;
  name: string;
  email: string;
  role: "guest" | "host";
  avatar_url: string | null;
  bio?: string | null;
}
export interface Amenity { id: number; name: string; icon: string }
export interface Quote {
  nights: number;
  nightly_subtotal_cents: number;
  cleaning_fee_cents: number;
  service_fee_cents: number;
  total_price_cents: number;
}
export interface Listing {
  id: number;
  host: User;
  title: string;
  description: string;
  location: string;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  price_per_night_cents: number;
  cleaning_fee_cents: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  property_type: string;
  category: string;
  images: string[];
  amenities: Amenity[];
  rating: number | null;
  review_count: number;
  is_favorite: boolean;
  quote: Quote | null;
  created_at: string;
}
export interface HostListing extends Listing {
  booking_count: number;
  upcoming_booking_count: number;
}
export interface ListingPage { items: Listing[]; total: number; page: number; page_size: number }
export interface BookedRange { check_in: string; check_out: string }
export interface Availability {
  listing_id: number;
  booked: BookedRange[];
  available: boolean | null;
  quote: Quote | null;
  reason: string | null;
}
export interface Booking extends Quote {
  id: number;
  reference: string;
  listing_id: number;
  listing_title: string;
  listing_location: string;
  listing_image: string | null;
  host_name: string;
  guest: User;
  check_in: string;
  check_out: string;
  guests: number;
  status: "confirmed" | "cancelled";
  is_upcoming: boolean;
  created_at: string;
}
export interface Review { id: number; rating: number; comment: string; created_at: string; guest: User }
export interface ReviewsResponse { listing_id: number; average: number | null; count: number; items: Review[] }
export interface Meta { categories: string[]; property_types: string[]; amenities: Amenity[] }
export interface ListingInput {
  title: string;
  description: string;
  location: string;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  price_per_night_cents: number;
  cleaning_fee_cents: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  property_type: string;
  category: string;
  image_urls: string[];
  amenity_ids: number[];
}
