"""Health, meta, demo users, host dashboard, favorites and reviews."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..core import ApiError, DemoUserHeader, resolve_user
from ..database import get_db
from ..models import Amenity, Booking, Favorite, Listing, Review, User
from ..schemas import (
    CATEGORIES,
    PROPERTY_TYPES,
    BookingOut,
    FavoriteIn,
    HostListingOut,
    MetaOut,
    ReviewOut,
    ReviewsResponse,
    UserOut,
)
from ..serializers import booking_out, favorite_ids, listing_out, rating_stats

DEMO_EMAIL_DOMAIN = "@demo.roamly.test"

router = APIRouter(prefix="/api")
Db = Annotated[Session, Depends(get_db)]
Demo = Annotated[str | None, DemoUserHeader]


@router.get("/health", tags=["meta"])
def health(db: Db):
    db.scalar(select(func.count()).select_from(User))
    return {"status": "ok"}


@router.get("/meta", response_model=MetaOut, tags=["meta"])
def meta(db: Db):
    return MetaOut(
        categories=CATEGORIES,
        property_types=PROPERTY_TYPES,
        amenities=db.scalars(select(Amenity).order_by(Amenity.name)).all(),
    )


@router.get("/demo-users", response_model=list[UserOut], tags=["meta"])
def demo_users(db: Db):
    """Accounts the UI can switch between (demo only - not real authentication)."""
    return db.scalars(
        select(User).where(User.email.like(f"%{DEMO_EMAIL_DOMAIN}")).order_by(User.id)
    ).all()


# --- host ------------------------------------------------------------------------------


def _require_host(db: Session, header: str | None) -> User:
    user = resolve_user(db, header, required=True)
    if user.role != "host":
        raise ApiError(403, "host_only", "Switch to a host account to use the host dashboard.")
    return user


@router.get("/host/listings", response_model=list[HostListingOut], tags=["host"])
def host_listings(db: Db, x_demo_user: Demo = None):
    host = _require_host(db, x_demo_user)
    rows = db.scalars(
        select(Listing)
        .options(selectinload(Listing.host), selectinload(Listing.images), selectinload(Listing.amenities))
        .where(Listing.host_id == host.id)
        .order_by(Listing.id)
    ).all()
    stats = rating_stats(db, [r.id for r in rows])
    counts = dict(
        db.execute(
            select(Booking.listing_id, func.count()).where(Booking.listing_id.in_([r.id for r in rows]))
            .group_by(Booking.listing_id)
        ).all()
    )
    upcoming = dict(
        db.execute(
            select(Booking.listing_id, func.count()).where(
                Booking.listing_id.in_([r.id for r in rows]),
                Booking.status == "confirmed",
                Booking.check_out > date.today(),
            ).group_by(Booking.listing_id)
        ).all()
    )
    return [
        listing_out(
            r, stats, set(), cls=HostListingOut,
            booking_count=counts.get(r.id, 0), upcoming_booking_count=upcoming.get(r.id, 0),
        )
        for r in rows
    ]


@router.get("/host/bookings", response_model=list[BookingOut], tags=["host"])
def host_bookings(db: Db, x_demo_user: Demo = None):
    host = _require_host(db, x_demo_user)
    rows = db.scalars(
        select(Booking)
        .join(Listing, Listing.id == Booking.listing_id)
        .options(
            selectinload(Booking.guest),
            selectinload(Booking.listing).selectinload(Listing.images),
            selectinload(Booking.listing).selectinload(Listing.host),
        )
        .where(Listing.host_id == host.id)
        .order_by(Booking.check_in.desc())
    ).all()
    return [booking_out(b) for b in rows]


# --- favorites -------------------------------------------------------------------------


@router.get("/favorites", response_model=list[int], tags=["favorites"])
def list_favorites(db: Db, x_demo_user: Demo = None):
    user = resolve_user(db, x_demo_user, required=True)
    return sorted(favorite_ids(db, user.id))


@router.post("/favorites", status_code=201, tags=["favorites"])
def add_favorite(body: FavoriteIn, db: Db, x_demo_user: Demo = None):
    user = resolve_user(db, x_demo_user, required=True)
    if db.get(Listing, body.listing_id) is None:
        raise ApiError(404, "listing_not_found", "That listing doesn't exist.")
    if db.get(Favorite, (user.id, body.listing_id)) is None:
        db.add(Favorite(user_id=user.id, listing_id=body.listing_id))
        db.commit()
    return {"listing_id": body.listing_id, "is_favorite": True}


@router.delete("/favorites/{listing_id}", status_code=204, tags=["favorites"])
def remove_favorite(listing_id: int, db: Db, x_demo_user: Demo = None):
    user = resolve_user(db, x_demo_user, required=True)
    fav = db.get(Favorite, (user.id, listing_id))
    if fav:
        db.delete(fav)
        db.commit()
    return Response(status_code=204)


# --- reviews ---------------------------------------------------------------------------


@router.get("/reviews/{listing_id}", response_model=ReviewsResponse, tags=["reviews"])
def listing_reviews(listing_id: int, db: Db):
    if db.get(Listing, listing_id) is None:
        raise ApiError(404, "listing_not_found", "That listing doesn't exist.")
    rows = db.scalars(
        select(Review)
        .options(selectinload(Review.guest))
        .where(Review.listing_id == listing_id)
        .order_by(Review.created_at.desc())
    ).all()
    avg, cnt = rating_stats(db, [listing_id]).get(listing_id, (None, 0))
    return ReviewsResponse(
        listing_id=listing_id,
        average=avg,
        count=cnt,
        items=[ReviewOut.model_validate(r, from_attributes=True) for r in rows],
    )
