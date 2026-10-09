from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from ..core import (
    ApiError,
    DemoUserHeader,
    listing_is_free,
    make_quote,
    resolve_user,
    validate_stay,
)
from ..database import get_db
from ..models import Amenity, Booking, Favorite, Listing, ListingImage, Review
from ..schemas import (
    AvailabilityOut,
    BookedRange,
    ListingIn,
    ListingOut,
    ListingPage,
    ListingPatch,
)
from ..serializers import favorite_ids, listing_out, rating_stats

router = APIRouter(prefix="/api/listings", tags=["listings"])

LOAD = (selectinload(Listing.host), selectinload(Listing.images), selectinload(Listing.amenities))
SORTS = {"recommended", "price_asc", "price_desc", "rating", "newest"}


def _get_listing(db: Session, listing_id: int) -> Listing:
    listing = db.scalar(select(Listing).options(*LOAD).where(Listing.id == listing_id))
    if listing is None:
        raise ApiError(404, "listing_not_found", "That listing doesn't exist.")
    return listing


def _amenities(db: Session, ids: list[int]) -> list[Amenity]:
    unique = sorted(set(ids))
    found = list(db.scalars(select(Amenity).where(Amenity.id.in_(unique)))) if unique else []
    if len(found) != len(unique):
        raise ApiError(422, "invalid_amenity", "One or more amenities are unknown.", "amenity_ids")
    return found


@router.get("", response_model=ListingPage)
def search_listings(
    db: Annotated[Session, Depends(get_db)],
    x_demo_user: Annotated[str | None, DemoUserHeader] = None,
    q: str | None = None,
    check_in: date | None = None,
    check_out: date | None = None,
    guests: Annotated[int | None, Query(ge=1, le=30)] = None,
    min_price: Annotated[int | None, Query(ge=0, description="dollars per night")] = None,
    max_price: Annotated[int | None, Query(ge=0, description="dollars per night")] = None,
    property_type: str | None = None,
    category: str | None = None,
    amenities: Annotated[str | None, Query(description="comma separated amenity names (all required)")] = None,
    favorites_only: bool = False,
    sort: str = "recommended",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=48)] = 12,
):
    user = resolve_user(db, x_demo_user, required=favorites_only)
    if sort not in SORTS:
        raise ApiError(422, "invalid_sort", f"sort must be one of {sorted(SORTS)}", "sort")
    if (check_in is None) != (check_out is None):
        raise ApiError(422, "invalid_dates", "Provide both check-in and check-out.", "check_in")
    if check_in and check_out:
        validate_stay(check_in, check_out, guests or 1)

    rs = (
        select(Review.listing_id, func.avg(Review.rating).label("avg"), func.count().label("cnt"))
        .group_by(Review.listing_id)
        .subquery()
    )
    stmt = select(Listing).outerjoin(rs, rs.c.listing_id == Listing.id)

    if q and q.strip():
        for token in q.replace(",", " ").split():
            like = f"%{token}%"
            stmt = stmt.where(
                or_(
                    Listing.location.ilike(like),
                    Listing.country.ilike(like),
                    Listing.title.ilike(like),
                    Listing.property_type.ilike(like),
                )
            )
    if guests:
        stmt = stmt.where(Listing.max_guests >= guests)
    if min_price is not None:
        stmt = stmt.where(Listing.price_per_night_cents >= min_price * 100)
    if max_price is not None:
        stmt = stmt.where(Listing.price_per_night_cents <= max_price * 100)
    if property_type:
        stmt = stmt.where(Listing.property_type == property_type)
    if category:
        stmt = stmt.where(Listing.category == category)
    for name in [a.strip() for a in (amenities or "").split(",") if a.strip()]:
        stmt = stmt.where(Listing.amenities.any(Amenity.name == name))
    if favorites_only and user:
        stmt = stmt.where(Listing.id.in_(select(Favorite.listing_id).where(Favorite.user_id == user.id)))
    if check_in and check_out:
        stmt = stmt.where(
            ~Listing.id.in_(
                select(Booking.listing_id).where(
                    Booking.status == "confirmed",
                    Booking.check_in < check_out,
                    Booking.check_out > check_in,
                )
            )
        )

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

    order = {
        "price_asc": [Listing.price_per_night_cents.asc(), Listing.id],
        "price_desc": [Listing.price_per_night_cents.desc(), Listing.id],
        "rating": [rs.c.avg.desc().nulls_last(), rs.c.cnt.desc().nulls_last(), Listing.id],
        "newest": [Listing.created_at.desc(), Listing.id.desc()],
        "recommended": [Listing.id],
    }[sort]
    rows = db.scalars(
        stmt.options(*LOAD).order_by(*order).offset((page - 1) * page_size).limit(page_size)
    ).all()

    stats = rating_stats(db, [r.id for r in rows])
    favs = favorite_ids(db, user.id if user else None)
    items = [
        listing_out(
            r, stats, favs, make_quote(r, check_in, check_out) if check_in and check_out else None
        )
        for r in rows
    ]
    return ListingPage(items=items, total=total, page=page, page_size=page_size)


@router.get("/{listing_id}", response_model=ListingOut)
def get_listing(
    listing_id: int,
    db: Annotated[Session, Depends(get_db)],
    x_demo_user: Annotated[str | None, DemoUserHeader] = None,
):
    user = resolve_user(db, x_demo_user, required=False)
    listing = _get_listing(db, listing_id)
    return listing_out(
        listing, rating_stats(db, [listing.id]), favorite_ids(db, user.id if user else None)
    )


@router.get("/{listing_id}/availability", response_model=AvailabilityOut)
def availability(
    listing_id: int,
    db: Annotated[Session, Depends(get_db)],
    check_in: date | None = None,
    check_out: date | None = None,
    guests: Annotated[int, Query(ge=1)] = 1,
):
    listing = _get_listing(db, listing_id)
    booked = db.execute(
        select(Booking.check_in, Booking.check_out)
        .where(
            Booking.listing_id == listing_id,
            Booking.status == "confirmed",
            Booking.check_out > date.today(),
        )
        .order_by(Booking.check_in)
    ).all()
    out = AvailabilityOut(
        listing_id=listing_id, booked=[BookedRange(check_in=a, check_out=b) for a, b in booked]
    )
    if check_in and check_out:
        validate_stay(check_in, check_out, guests, listing.max_guests)
        out.available = listing_is_free(db, listing_id, check_in, check_out)
        out.quote = make_quote(listing, check_in, check_out)
        if not out.available:
            out.reason = "Those dates are no longer available."
    return out


def _apply(listing: Listing, data: dict, db: Session) -> None:
    image_urls = data.pop("image_urls", None)
    amenity_ids = data.pop("amenity_ids", None)
    for key, value in data.items():
        setattr(listing, key, value)
    if image_urls is not None:
        listing.images = [ListingImage(image_url=str(u), position=i) for i, u in enumerate(image_urls)]
    if amenity_ids is not None:
        listing.amenities = _amenities(db, amenity_ids)


@router.post("", response_model=ListingOut, status_code=201)
def create_listing(
    body: ListingIn,
    db: Annotated[Session, Depends(get_db)],
    x_demo_user: Annotated[str | None, DemoUserHeader] = None,
):
    user = resolve_user(db, x_demo_user, required=True)
    if user.role != "host":
        raise ApiError(403, "host_only", "Switch to a host account to create listings.")
    listing = Listing(host_id=user.id)
    _apply(listing, body.model_dump(), db)
    db.add(listing)
    db.commit()
    return listing_out(_get_listing(db, listing.id), {}, set())


@router.patch("/{listing_id}", response_model=ListingOut)
def update_listing(
    listing_id: int,
    body: ListingPatch,
    db: Annotated[Session, Depends(get_db)],
    x_demo_user: Annotated[str | None, DemoUserHeader] = None,
):
    user = resolve_user(db, x_demo_user, required=True)
    listing = _get_listing(db, listing_id)
    if listing.host_id != user.id:
        raise ApiError(403, "not_owner", "You can only edit your own listings.")
    data = body.model_dump(exclude_unset=True)
    # Required columns can't be nulled out through PATCH.
    for key, value in list(data.items()):
        if value is None and key not in {"country", "latitude", "longitude"}:
            del data[key]
    _apply(listing, data, db)
    db.commit()
    return listing_out(
        _get_listing(db, listing_id), rating_stats(db, [listing_id]), favorite_ids(db, user.id)
    )


@router.delete("/{listing_id}", status_code=204)
def delete_listing(
    listing_id: int,
    db: Annotated[Session, Depends(get_db)],
    x_demo_user: Annotated[str | None, DemoUserHeader] = None,
):
    user = resolve_user(db, x_demo_user, required=True)
    listing = _get_listing(db, listing_id)
    if listing.host_id != user.id:
        raise ApiError(403, "not_owner", "You can only delete your own listings.")
    has_bookings = db.scalar(select(func.count()).select_from(Booking).where(Booking.listing_id == listing_id))
    if has_bookings:
        raise ApiError(
            409,
            "listing_has_bookings",
            "This listing has booking history, so it can't be deleted. "
            "Booking records are kept for guests and hosts.",
        )
    try:
        db.delete(listing)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ApiError(409, "listing_has_bookings", "This listing is referenced by other records.")
    return Response(status_code=204)
