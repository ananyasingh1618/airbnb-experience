"""SQLAlchemy models. All money is stored as integer cents."""

from datetime import date, datetime, timezone

from sqlalchemy import (
    DDL,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
    event,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    role: Mapped[str] = mapped_column(String(10))  # "guest" | "host"
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    bio: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    __table_args__ = (CheckConstraint("role IN ('guest','host')", name="ck_users_role"),)


listing_amenities = Table(
    "listing_amenities",
    Base.metadata,
    Column("listing_id", ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True),
    Column("amenity_id", ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True),
)


class Amenity(Base):
    __tablename__ = "amenities"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    icon: Mapped[str] = mapped_column(String(40))


class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[int] = mapped_column(primary_key=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text)
    location: Mapped[str] = mapped_column(String(160), index=True)
    country: Mapped[str | None] = mapped_column(String(80))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    price_per_night_cents: Mapped[int] = mapped_column(Integer)
    cleaning_fee_cents: Mapped[int] = mapped_column(Integer, default=0)
    max_guests: Mapped[int] = mapped_column(Integer)
    bedrooms: Mapped[int] = mapped_column(Integer)
    beds: Mapped[int] = mapped_column(Integer)
    bathrooms: Mapped[float] = mapped_column(Float)
    property_type: Mapped[str] = mapped_column(String(40), index=True)
    category: Mapped[str] = mapped_column(String(40), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    host: Mapped[User] = relationship()
    images: Mapped[list["ListingImage"]] = relationship(
        cascade="all, delete-orphan", order_by="ListingImage.position"
    )
    amenities: Mapped[list[Amenity]] = relationship(secondary=listing_amenities)

    __table_args__ = (
        CheckConstraint("price_per_night_cents > 0", name="ck_listing_price"),
        CheckConstraint("cleaning_fee_cents >= 0", name="ck_listing_cleaning"),
        CheckConstraint("max_guests >= 1", name="ck_listing_guests"),
    )


class ListingImage(Base):
    __tablename__ = "listing_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    image_url: Mapped[str] = mapped_column(String(600))
    position: Mapped[int] = mapped_column(Integer, default=0)


class Booking(Base):
    """Bookings are never deleted: cancelling flips ``status`` to 'cancelled'.

    ``listing_id`` is RESTRICT so a listing with booking history cannot be removed.
    """

    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="RESTRICT"))
    guest_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    check_in: Mapped[date] = mapped_column(Date)
    check_out: Mapped[date] = mapped_column(Date)
    guests: Mapped[int] = mapped_column(Integer)
    nightly_subtotal_cents: Mapped[int] = mapped_column(Integer)
    cleaning_fee_cents: Mapped[int] = mapped_column(Integer)
    service_fee_cents: Mapped[int] = mapped_column(Integer)
    total_price_cents: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(12), default="confirmed")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    listing: Mapped[Listing] = relationship()
    guest: Mapped[User] = relationship()

    __table_args__ = (
        CheckConstraint("check_out > check_in", name="ck_booking_dates"),
        CheckConstraint("guests >= 1", name="ck_booking_guests"),
        CheckConstraint("status IN ('confirmed','cancelled')", name="ck_booking_status"),
        Index("ix_bookings_listing_dates", "listing_id", "status", "check_in", "check_out"),
    )


class Favorite(Base):
    __tablename__ = "favorites"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    guest_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    guest: Mapped[User] = relationship()

    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_review_rating"),
        UniqueConstraint("listing_id", "guest_id", name="uq_review_listing_guest"),
    )


# Defence in depth: even if application code were bypassed, the database itself refuses
# a confirmed booking that overlaps another confirmed booking (half-open intervals).
event.listen(
    Booking.__table__,
    "after_create",
    DDL(
        """
        CREATE TRIGGER trg_bookings_no_overlap
        BEFORE INSERT ON bookings
        WHEN NEW.status = 'confirmed' AND EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.listing_id = NEW.listing_id
              AND b.status = 'confirmed'
              AND b.check_in < NEW.check_out
              AND b.check_out > NEW.check_in
        )
        BEGIN
            SELECT RAISE(ABORT, 'booking_overlap');
        END
        """
    ),
)
