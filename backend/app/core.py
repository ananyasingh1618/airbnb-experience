"""Shared helpers: structured errors, demo-user resolution, pricing and availability."""

from datetime import date

from fastapi import Header
from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from .models import Booking, Listing, User
from .schemas import Quote

SERVICE_FEE_RATE_PERCENT = 10
MAX_NIGHTS = 90


class ApiError(Exception):
    """Expected failure rendered as ``{"error": {"code", "message", "field"?}}``."""

    def __init__(self, status: int, code: str, message: str, field: str | None = None):
        self.status, self.code, self.message, self.field = status, code, message, field


# --- demo identity -------------------------------------------------------------------
# DEMO ONLY: the active user is chosen by the X-Demo-User header. It is validated against
# the users table but is NOT authentication and offers no production security.


def resolve_user(db: Session, header_value: str | None, required: bool) -> User | None:
    if header_value is None or header_value == "":
        if required:
            raise ApiError(401, "demo_user_required", "Choose a demo account to continue.")
        return None
    try:
        user_id = int(header_value)
    except ValueError:
        raise ApiError(401, "invalid_demo_user", "Unknown demo account.")
    user = db.get(User, user_id)
    if user is None:
        raise ApiError(401, "invalid_demo_user", "Unknown demo account.")
    return user


DemoUserHeader = Header(alias="X-Demo-User")


# --- pricing ---------------------------------------------------------------------------


def make_quote(listing: Listing, check_in: date, check_out: date) -> Quote:
    """The one authoritative price calculation (integer cents, service fee rounds half-up)."""
    nights = (check_out - check_in).days
    subtotal = listing.price_per_night_cents * nights
    service_fee = (subtotal * SERVICE_FEE_RATE_PERCENT + 50) // 100
    cleaning = listing.cleaning_fee_cents
    return Quote(
        nights=nights,
        nightly_subtotal_cents=subtotal,
        cleaning_fee_cents=cleaning,
        service_fee_cents=service_fee,
        total_price_cents=subtotal + cleaning + service_fee,
    )


# --- stay validation / availability ------------------------------------------------------


def validate_stay(check_in: date, check_out: date, guests: int, max_guests: int | None = None) -> None:
    if check_in < date.today():
        raise ApiError(422, "check_in_in_past", "Check-in can't be in the past.", "check_in")
    if check_out <= check_in:
        raise ApiError(422, "invalid_dates", "Check-out must be after check-in.", "check_out")
    if (check_out - check_in).days > MAX_NIGHTS:
        raise ApiError(422, "stay_too_long", f"Stays are limited to {MAX_NIGHTS} nights.", "check_out")
    if guests < 1:
        raise ApiError(422, "invalid_guests", "At least one guest is required.", "guests")
    if max_guests is not None and guests > max_guests:
        raise ApiError(
            422, "too_many_guests", f"This place sleeps up to {max_guests} guests.", "guests"
        )


def overlap_clause(check_in: date, check_out: date):
    """Half-open overlap: existing_in < requested_out AND existing_out > requested_in."""
    return (
        (Booking.status == "confirmed")
        & (Booking.check_in < check_out)
        & (Booking.check_out > check_in)
    )


def listing_is_free(db: Session, listing_id: int, check_in: date, check_out: date) -> bool:
    clash = db.scalar(
        select(exists().where(Booking.listing_id == listing_id, overlap_clause(check_in, check_out)))
    )
    return not clash
