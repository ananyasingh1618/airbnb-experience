"""Pydantic request / response schemas. Money fields are integer cents (``*_cents``)."""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

CATEGORIES = [
    "amazing-views",
    "cabins",
    "beachfront",
    "countryside",
    "design",
    "tiny-homes",
    "pools",
    "mountains",
    "lakefront",
    "unique",
]
PROPERTY_TYPES = ["Apartment", "House", "Villa", "Cabin", "Cottage", "Loft", "Tiny home", "Unique stay"]

Category = Literal[
    "amazing-views", "cabins", "beachfront", "countryside", "design",
    "tiny-homes", "pools", "mountains", "lakefront", "unique",
]
PropertyType = Literal["Apartment", "House", "Villa", "Cabin", "Cottage", "Loft", "Tiny home", "Unique stay"]


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserOut(ORM):
    id: int
    name: str
    email: str
    role: str
    avatar_url: str | None = None
    bio: str | None = None


class AmenityOut(ORM):
    id: int
    name: str
    icon: str


class Quote(BaseModel):
    nights: int
    nightly_subtotal_cents: int
    cleaning_fee_cents: int
    service_fee_cents: int
    total_price_cents: int


class ListingOut(BaseModel):
    id: int
    host: UserOut
    title: str
    description: str
    location: str
    country: str | None
    latitude: float | None
    longitude: float | None
    price_per_night_cents: int
    cleaning_fee_cents: int
    max_guests: int
    bedrooms: int
    beds: int
    bathrooms: float
    property_type: str
    category: str
    images: list[str]
    amenities: list[AmenityOut]
    rating: float | None
    review_count: int
    is_favorite: bool = False
    quote: Quote | None = None  # present on search results when dates are supplied
    created_at: datetime


class ListingPage(BaseModel):
    items: list[ListingOut]
    total: int
    page: int
    page_size: int


class ListingIn(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    description: str = Field(min_length=20, max_length=4000)
    location: str = Field(min_length=2, max_length=160)
    country: str | None = Field(default=None, max_length=80)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    price_per_night_cents: int = Field(ge=1_00, le=100_000_00)
    cleaning_fee_cents: int = Field(default=0, ge=0, le=10_000_00)
    max_guests: int = Field(ge=1, le=30)
    bedrooms: int = Field(ge=0, le=30)
    beds: int = Field(ge=1, le=60)
    bathrooms: float = Field(ge=0.5, le=30)
    property_type: PropertyType
    category: Category
    image_urls: list[HttpUrl] = Field(min_length=1, max_length=12)
    amenity_ids: list[int] = Field(default_factory=list, max_length=40)

    @field_validator("title", "description", "location")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be blank")
        return v


class ListingPatch(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=160)
    description: str | None = Field(default=None, min_length=20, max_length=4000)
    location: str | None = Field(default=None, min_length=2, max_length=160)
    country: str | None = Field(default=None, max_length=80)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    price_per_night_cents: int | None = Field(default=None, ge=1_00, le=100_000_00)
    cleaning_fee_cents: int | None = Field(default=None, ge=0, le=10_000_00)
    max_guests: int | None = Field(default=None, ge=1, le=30)
    bedrooms: int | None = Field(default=None, ge=0, le=30)
    beds: int | None = Field(default=None, ge=1, le=60)
    bathrooms: float | None = Field(default=None, ge=0.5, le=30)
    property_type: PropertyType | None = None
    category: Category | None = None
    image_urls: list[HttpUrl] | None = Field(default=None, min_length=1, max_length=12)
    amenity_ids: list[int] | None = Field(default=None, max_length=40)


class BookedRange(BaseModel):
    check_in: date
    check_out: date


class AvailabilityOut(BaseModel):
    listing_id: int
    booked: list[BookedRange]
    available: bool | None = None  # only when check_in/check_out supplied
    quote: Quote | None = None
    reason: str | None = None


class BookingIn(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guests: int


class BookingOut(BaseModel):
    id: int
    reference: str
    listing_id: int
    listing_title: str
    listing_location: str
    listing_image: str | None
    host_name: str
    guest: UserOut
    check_in: date
    check_out: date
    nights: int
    guests: int
    nightly_subtotal_cents: int
    cleaning_fee_cents: int
    service_fee_cents: int
    total_price_cents: int
    status: str
    is_upcoming: bool
    created_at: datetime


class ReviewOut(BaseModel):
    id: int
    rating: int
    comment: str
    created_at: datetime
    guest: UserOut


class ReviewsResponse(BaseModel):
    listing_id: int
    average: float | None
    count: int
    items: list[ReviewOut]


class FavoriteIn(BaseModel):
    listing_id: int


class MetaOut(BaseModel):
    categories: list[str]
    property_types: list[str]
    amenities: list[AmenityOut]


class HostListingOut(ListingOut):
    booking_count: int = 0
    upcoming_booking_count: int = 0
