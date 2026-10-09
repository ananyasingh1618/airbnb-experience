"""Turn ORM rows into response schemas (batching rating lookups to avoid N+1 queries)."""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import Booking, Favorite, Listing, Review
from .schemas import BookingOut, ListingOut, Quote, UserOut


def rating_stats(db: Session, listing_ids: list[int]) -> dict[int, tuple[float | None, int]]:
    if not listing_ids:
        return {}
    rows = db.execute(
        select(Review.listing_id, func.avg(Review.rating), func.count())
        .where(Review.listing_id.in_(listing_ids))
        .group_by(Review.listing_id)
    ).all()
    return {lid: (round(float(avg), 2), cnt) for lid, avg, cnt in rows}


def favorite_ids(db: Session, user_id: int | None) -> set[int]:
    if user_id is None:
        return set()
    return set(db.scalars(select(Favorite.listing_id).where(Favorite.user_id == user_id)))


def listing_out(
    listing: Listing,
    stats: dict[int, tuple[float | None, int]],
    favorites: set[int],
    quote: Quote | None = None,
    cls=ListingOut,
    **extra,
):
    avg, cnt = stats.get(listing.id, (None, 0))
    return cls(
        id=listing.id,
        host=UserOut.model_validate(listing.host),
        title=listing.title,
        description=listing.description,
        location=listing.location,
        country=listing.country,
        latitude=listing.latitude,
        longitude=listing.longitude,
        price_per_night_cents=listing.price_per_night_cents,
        cleaning_fee_cents=listing.cleaning_fee_cents,
        max_guests=listing.max_guests,
        bedrooms=listing.bedrooms,
        beds=listing.beds,
        bathrooms=listing.bathrooms,
        property_type=listing.property_type,
        category=listing.category,
        images=[i.image_url for i in listing.images],
        amenities=listing.amenities,
        rating=avg,
        review_count=cnt,
        is_favorite=listing.id in favorites,
        quote=quote,
        created_at=listing.created_at,
        **extra,
    )


def booking_out(b: Booking) -> BookingOut:
    return BookingOut(
        id=b.id,
        reference=f"HM{b.id:08d}",
        listing_id=b.listing_id,
        listing_title=b.listing.title,
        listing_location=b.listing.location,
        listing_image=b.listing.images[0].image_url if b.listing.images else None,
        host_name=b.listing.host.name,
        guest=UserOut.model_validate(b.guest),
        check_in=b.check_in,
        check_out=b.check_out,
        nights=(b.check_out - b.check_in).days,
        guests=b.guests,
        nightly_subtotal_cents=b.nightly_subtotal_cents,
        cleaning_fee_cents=b.cleaning_fee_cents,
        service_fee_cents=b.service_fee_cents,
        total_price_cents=b.total_price_cents,
        status=b.status,
        is_upcoming=b.status == "confirmed" and b.check_out > date.today(),
        created_at=b.created_at,
    )
