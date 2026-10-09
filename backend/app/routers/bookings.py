from typing import Annotated

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
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
from ..database import get_db, get_write_db
from ..models import Booking, Listing
from ..schemas import BookingIn, BookingOut
from ..serializers import booking_out

router = APIRouter(prefix="/api/bookings", tags=["bookings"])

LOAD = (
    selectinload(Booking.guest),
    selectinload(Booking.listing).selectinload(Listing.images),
    selectinload(Booking.listing).selectinload(Listing.host),
)


@router.post("", response_model=BookingOut, status_code=201)
def create_booking(
    body: BookingIn,
    response: Response,
    db: Annotated[Session, Depends(get_write_db)],  # BEGIN IMMEDIATE: holds the write lock
    x_demo_user: Annotated[str | None, DemoUserHeader] = None,
):
    """Availability is re-checked *inside* the write transaction, so two concurrent requests
    for overlapping dates are serialised by SQLite and the second one gets a 409."""
    guest = resolve_user(db, x_demo_user, required=True)
    listing = db.get(Listing, body.listing_id)
    if listing is None:
        raise ApiError(404, "listing_not_found", "That listing doesn't exist.")
    if listing.host_id == guest.id:
        raise ApiError(403, "own_listing", "You can't book your own listing.")
    validate_stay(body.check_in, body.check_out, body.guests, listing.max_guests)

    # Idempotency: an identical confirmed booking by the same guest (double click / retry)
    # returns the existing record instead of a confusing conflict.
    existing = db.scalar(
        select(Booking).options(*LOAD).where(
            Booking.listing_id == listing.id,
            Booking.guest_id == guest.id,
            Booking.check_in == body.check_in,
            Booking.check_out == body.check_out,
            Booking.status == "confirmed",
        )
    )
    if existing:
        response.status_code = 200
        return booking_out(existing)

    if not listing_is_free(db, listing.id, body.check_in, body.check_out):
        raise ApiError(409, "dates_unavailable", "Those dates are no longer available.", "check_in")

    quote = make_quote(listing, body.check_in, body.check_out)  # never trust client prices
    booking = Booking(
        listing_id=listing.id,
        guest_id=guest.id,
        check_in=body.check_in,
        check_out=body.check_out,
        guests=body.guests,
        nightly_subtotal_cents=quote.nightly_subtotal_cents,
        cleaning_fee_cents=quote.cleaning_fee_cents,
        service_fee_cents=quote.service_fee_cents,
        total_price_cents=quote.total_price_cents,
        status="confirmed",
    )
    db.add(booking)
    try:
        db.commit()
    except IntegrityError as exc:  # DB trigger is the last line of defence
        db.rollback()
        if "booking_overlap" in str(exc.orig):
            raise ApiError(409, "dates_unavailable", "Those dates are no longer available.", "check_in")
        raise
    return booking_out(_load(db, booking.id))


def _load(db: Session, booking_id: int) -> Booking:
    return db.scalar(select(Booking).options(*LOAD).where(Booking.id == booking_id))


@router.get("/mine", response_model=list[BookingOut])
def my_bookings(
    db: Annotated[Session, Depends(get_db)],
    x_demo_user: Annotated[str | None, DemoUserHeader] = None,
):
    user = resolve_user(db, x_demo_user, required=True)
    rows = db.scalars(
        select(Booking).options(*LOAD).where(Booking.guest_id == user.id).order_by(Booking.check_in.desc())
    ).all()
    return [booking_out(b) for b in rows]


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(
    booking_id: int,
    db: Annotated[Session, Depends(get_db)],
    x_demo_user: Annotated[str | None, DemoUserHeader] = None,
):
    user = resolve_user(db, x_demo_user, required=True)
    booking = _load(db, booking_id)
    if booking is None:
        raise ApiError(404, "booking_not_found", "That reservation doesn't exist.")
    if user.id not in (booking.guest_id, booking.listing.host_id):
        raise ApiError(403, "forbidden", "You don't have access to this reservation.")
    return booking_out(booking)


@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(
    booking_id: int,
    db: Annotated[Session, Depends(get_db)],
    x_demo_user: Annotated[str | None, DemoUserHeader] = None,
):
    """Cancelling keeps the row (history) and frees the dates for other guests."""
    user = resolve_user(db, x_demo_user, required=True)
    booking = _load(db, booking_id)
    if booking is None:
        raise ApiError(404, "booking_not_found", "That reservation doesn't exist.")
    if booking.guest_id != user.id:
        raise ApiError(403, "forbidden", "Only the guest can cancel this reservation.")
    if booking.status == "confirmed":
        from datetime import date

        if booking.check_in <= date.today():
            raise ApiError(409, "already_started", "Trips that have started can't be cancelled.")
        booking.status = "cancelled"
        db.commit()
    return booking_out(_load(db, booking_id))
