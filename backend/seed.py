"""Seed realistic *sample* data. Safe to re-run: rows are matched on natural keys
(email / amenity name / host+title), so nothing is duplicated.

    python seed.py            # add anything that is missing
    python seed.py --reset    # wipe the database and re-seed from scratch

All people, reviews and bookings are fictional demo content. Photos are from Unsplash.
Booking dates are generated relative to today so the demo never goes stale.
"""

import sys
from datetime import date, timedelta

from sqlalchemy import func, select

from app import models
from app.database import Base, SessionLocal, engine
from app.models import Amenity, Booking, Favorite, Listing, ListingImage, Review, User
from app.core import make_quote

DEMO = "@demo.airbnb.test"


def img(photo_id: str) -> str:
    # w/q are applied by the frontend loader; keep the canonical URL here.
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w=1600&q=80"


P = {  # photo ids (each checked to return HTTP 200 and visually reviewed)
    "apt_red_chair": "1522708323590-d24dbb6b0267", "apt_plants": "1502672260266-1c1ef2d93688",
    "apt_blue_sofa": "1493809842364-78817add7ffb", "villa_pool_white": "1512917774080-9991f1c4c750",
    "villa_pool_palm": "1564013799919-ab600027ffc6", "log_cabin": "1449158743715-0a90ebb6d2d8",
    "red_tiny": "1518780664697-55e3ad937233", "living_art": "1505691938895-1758d7feb511",
    "living_bay": "1560448204-e02f11c3d0e2", "villa_cube_pool": "1600596542815-ffad4c1539a9",
    "modern_dark": "1600585154340-be6161a56a0c", "living_wood": "1600607687939-ce8a6c25118c",
    "villa_infinity": "1613490493576-7fde63acd811", "farmhouse": "1570129477492-45c003edd2be",
    "lodge_dusk": "1568605114967-8130f3a36994", "kitchen_island": "1507089947368-19c1da9775ae",
    "kitchen_dark": "1484154218962-a197022b5858", "kitchen_cook": "1556911220-bff31c812dba",
    "bedroom_orange": "1540518614846-7eded433c457", "dining_bay": "1560185007-cde436f6a4d0",
    "beach_hut": "1499793983690-e29da59ef1c2", "chalet_snow": "1510798831971-661eb04b3739",
    "lake_boathouse": "1470770841072-f978cf4d019e", "valley_mtns": "1464822759023-fed622ff2c3b",
    "clouds_peaks": "1506905925346-21bda4d32df4", "cabin_sunset": "1542718610-a1d656d1884c",
    "cabin_forest": "1587061949409-02df41d5e562", "deck_house": "1595877244574-e90ce41ce089",
    "white_house": "1523217582562-09d0def993a6", "desert_pool": "1544984243-ec57ea16fe25",
    "airstream": "1523987355523-c7b5b0dd90a7", "living_coffered": "1598928506311-c55ded91a20c",
    "bedroom_classic": "1590490360182-c33d57733427", "resort_pool_house": "1582268611958-ebfd161ef9cf",
    "resort_night": "1571896349842-33c89424de2d", "tropical_pool": "1520250497591-112f2f40a3f4",
    "lake_dock": "1439066615861-d1af74d74000", "beach_aerial": "1505118380757-91f5f5632de0",
    "beach_palm": "1519046904884-53103b34b206", "beach_dusk": "1473116763249-2faaef81ccda",
    "beach_pink": "1507525428034-b723cf961d3e", "wheat_sun": "1500382017468-9049fed747ef",
    "green_valley": "1472214103451-9374bd1c798e", "bedroom_lamp": "1522771739844-6a9f6d5f14af",
    "loft_brick": "1505873242700-f289a29e1e0f", "loft_shelves": "1536376072261-38c75010e6c9",
}

AMENITIES = [
    ("Wifi", "wifi"), ("Kitchen", "cooking-pot"), ("Free parking", "car"), ("Pool", "waves"),
    ("Hot tub", "bath"), ("Air conditioning", "snowflake"), ("Heating", "flame"),
    ("Washer", "washing-machine"), ("Dedicated workspace", "laptop"), ("TV", "tv"),
    ("Fireplace", "flame-kindling"), ("Beach access", "umbrella"), ("Lake access", "sailboat"),
    ("Mountain view", "mountain"), ("Garden", "trees"), ("BBQ grill", "utensils"),
    ("Pets allowed", "paw-print"), ("Gym", "dumbbell"), ("EV charger", "plug-zap"),
    ("Breakfast included", "coffee"),
]

USERS = [  # (name, email-local, role, bio)
    ("Maya Chen", "maya", "guest", "Weekend wanderer who collects window seats and good coffee."),
    ("Lucas Moreau", "lucas", "host", "Architect turned host. Lucas curates design-led stays in cities and on coasts."),
    ("Priya Nair", "priya", "host", "Priya looks after mountain, lake and countryside retreats she has restored herself."),
]
REVIEWERS = [
    "Elena Rossi", "Daniel Kim", "Aisha Khan", "Tomás Herrera", "Hannah Berg", "Noah Williams", "Sofia Alvarez",
]

# fmt: off
# host, title, location, country, lat, lng, $night, $clean, guests, br, beds, ba, type, category, photos, amenities, description
LISTINGS = [
 ("lucas", "Glass-walled villa above the sea", "Marbella, Spain", "Spain", 36.5100, -4.8860, 420, 120, 8, 4, 5, 3.5, "Villa", "pools",
  ["villa_pool_white", "villa_infinity", "living_wood", "bedroom_orange", "kitchen_cook"],
  ["Wifi", "Kitchen", "Pool", "Air conditioning", "Free parking", "BBQ grill", "Garden", "TV"],
  "A white modernist villa built around a long turquoise pool, with sliding glass walls that open the living room to the terrace. Four en-suite bedrooms, an outdoor dining table for eight and a ten-minute drive to the beach."),
 ("lucas", "Palm-shaded house with a plunge pool", "Tulum, Mexico", "Mexico", 20.2114, -87.4654, 285, 90, 6, 3, 4, 2.5, "House", "pools",
  ["villa_pool_palm", "villa_cube_pool", "apt_red_chair", "bedroom_classic", "kitchen_dark"],
  ["Wifi", "Kitchen", "Pool", "Air conditioning", "Garden", "Pets allowed", "Washer", "Beach access"],
  "A two-storey tropical home with a wraparound balcony, a private pool and a garden full of palms. Bikes are included for the five-minute ride to the sea."),
 ("priya", "Hand-built log cabin in the pines", "Whistler, Canada", "Canada", 50.1163, -122.9574, 190, 60, 4, 2, 3, 1, "Cabin", "cabins",
  ["log_cabin", "cabin_forest", "kitchen_island", "dining_bay", "bedroom_orange"],
  ["Wifi", "Kitchen", "Fireplace", "Heating", "Free parking", "Hot tub", "Mountain view", "Pets allowed"],
  "A weathered timber cabin set deep in the forest, ten minutes from the lifts. Wood stove, deep bathtub and a covered porch for coffee in the quiet."),
 ("priya", "Little red house on the hillside", "Vík, Iceland", "Iceland", 63.4186, -19.0060, 165, 45, 2, 1, 1, 1, "Tiny home", "tiny-homes",
  ["red_tiny", "green_valley", "apt_plants", "kitchen_cook", "wheat_sun"],
  ["Wifi", "Heating", "Kitchen", "Mountain view", "Free parking"],
  "A snug one-room hideaway on a grassy ridge with a sleeping loft and views across the black-sand coast. Perfect for northern-lights season."),
 ("priya", "Boathouse retreat on an alpine lake", "Braies, Italy", "Italy", 46.6942, 12.0850, 310, 80, 4, 2, 3, 2, "Cabin", "lakefront",
  ["lake_boathouse", "lake_dock", "living_coffered", "bedroom_lamp", "kitchen_island"],
  ["Wifi", "Kitchen", "Lake access", "Mountain view", "Heating", "Free parking", "Breakfast included"],
  "A wooden boathouse reflected in the clear water of the Dolomites. Wake up to mountain views, swim off the dock and rent a rowing boat at the lodge."),
 ("priya", "Snow-lit chalet beside a glacial lake", "Banff, Canada", "Canada", 51.4254, -116.1773, 360, 100, 8, 4, 5, 3, "Cabin", "mountains",
  ["chalet_snow", "clouds_peaks", "living_wood", "kitchen_island", "bedroom_classic"],
  ["Wifi", "Fireplace", "Hot tub", "Mountain view", "Heating", "Kitchen", "Free parking", "Washer"],
  "A timber chalet at the water's edge with a stone fireplace, a hot tub on the deck and trails that start from the door."),
 ("lucas", "Thatched beach bungalow on the sand", "Nusa Dua, Indonesia", "Indonesia", -8.8008, 115.2318, 140, 40, 3, 1, 2, 1, "House", "beachfront",
  ["beach_hut", "beach_palm", "beach_aerial", "bedroom_lamp", "dining_bay"],
  ["Wifi", "Beach access", "Air conditioning", "Breakfast included", "Garden", "Kitchen"],
  "Step from the veranda straight onto soft white sand. A thatched-roof bungalow with a shaded dining deck and a hammock for lazy afternoons."),
 ("priya", "Cabin above the clouds", "Interlaken, Switzerland", "Switzerland", 46.6863, 7.8632, 275, 70, 5, 2, 3, 1.5, "Cabin", "amazing-views",
  ["cabin_sunset", "clouds_peaks", "valley_mtns", "kitchen_island", "bedroom_orange"],
  ["Wifi", "Mountain view", "Heating", "Fireplace", "Kitchen", "Free parking"],
  "A small alpine cabin on a ridge that sits above the morning cloud line. Floor-to-ceiling windows frame the peaks at sunrise."),
 ("lucas", "Desert-modern house with sunset pool", "Palm Springs, USA", "United States", 33.8303, -116.5453, 340, 110, 6, 3, 3, 2.5, "House", "design",
  ["desert_pool", "villa_cube_pool", "modern_dark", "living_wood", "kitchen_dark"],
  ["Wifi", "Pool", "Air conditioning", "Hot tub", "BBQ grill", "Dedicated workspace", "EV charger", "TV"],
  "A mid-century-inspired house with a pool that glows at dusk, a cantilevered roof and views of the San Jacinto mountains."),
 ("lucas", "Restored Airstream under the stars", "Marfa, USA", "United States", 30.3094, -104.0206, 125, 35, 2, 1, 1, 1, "Unique stay", "unique",
  ["airstream", "wheat_sun", "bedroom_lamp", "kitchen_cook", "green_valley"],
  ["Wifi", "Air conditioning", "BBQ grill", "Pets allowed", "Free parking"],
  "A polished vintage trailer with its own awning, outdoor kitchen and fire ring. Watch the desert sky from the steps."),
 ("lucas", "Warehouse loft with brick and big windows", "Brooklyn, USA", "United States", 40.7081, -73.9571, 230, 75, 4, 2, 2, 2, "Loft", "design",
  ["loft_brick", "loft_shelves", "kitchen_dark", "bedroom_lamp", "apt_blue_sofa"],
  ["Wifi", "Kitchen", "Air conditioning", "Dedicated workspace", "Washer", "TV", "Gym"],
  "Double-height ceilings, exposed brick and a mezzanine bedroom in a converted factory building. Five minutes to the subway and the best pizza in the neighbourhood."),
 ("lucas", "Sunlit apartment with herringbone floors", "Paris, France", "France", 48.8566, 2.3522, 195, 55, 3, 1, 2, 1, "Apartment", "design",
  ["apt_blue_sofa", "apt_red_chair", "living_bay", "bedroom_lamp", "kitchen_island"],
  ["Wifi", "Kitchen", "Heating", "Dedicated workspace", "TV", "Washer"],
  "A bright fourth-floor apartment with tall windows, a velvet sofa and a quiet courtyard. Cafés and the metro are a minute away."),
 ("priya", "Wraparound-porch farmhouse", "Stowe, USA", "United States", 44.4654, -72.6874, 245, 85, 8, 4, 5, 2.5, "House", "countryside",
  ["farmhouse", "wheat_sun", "kitchen_island", "dining_bay", "bedroom_classic"],
  ["Wifi", "Kitchen", "Garden", "Fireplace", "Pets allowed", "Free parking", "BBQ grill", "Washer"],
  "A classic white farmhouse with a deep porch, a sloping lawn and a kitchen made for long family dinners. Autumn colour is spectacular."),
 ("priya", "Timber lodge at twilight", "Aspen, USA", "United States", 39.1911, -106.8175, 480, 140, 10, 5, 6, 4, "House", "mountains",
  ["lodge_dusk", "clouds_peaks", "living_wood", "kitchen_cook", "bedroom_orange"],
  ["Wifi", "Hot tub", "Fireplace", "Mountain view", "Heating", "Kitchen", "Free parking", "Gym", "EV charger"],
  "A warm, glowing lodge with a double-height great room, a ski room and a hot tub beneath the stars."),
 ("priya", "Forest house with a wide deck", "Black Forest, Germany", "Germany", 48.2000, 8.2000, 175, 50, 5, 2, 3, 1, "Cabin", "cabins",
  ["deck_house", "cabin_forest", "log_cabin", "dining_bay", "bedroom_lamp"],
  ["Wifi", "Kitchen", "Fireplace", "Garden", "Pets allowed", "Free parking"],
  "A timber home among tall trees with a deck that wraps around two sides. Hiking trails and a thermal spa are close by."),
 ("lucas", "White-cube house with Aegean views", "Mykonos, Greece", "Greece", 37.4467, 25.3289, 390, 100, 6, 3, 4, 3, "Villa", "amazing-views",
  ["white_house", "villa_pool_white", "living_art", "bedroom_classic", "kitchen_cook"],
  ["Wifi", "Air conditioning", "Pool", "Kitchen", "Beach access", "BBQ grill"],
  "Sculptural white architecture, a sunbaked terrace and sea views from every bedroom. Dinner in town is a short walk downhill."),
 ("lucas", "Jungle villa with an infinity pool", "Ubud, Indonesia", "Indonesia", -8.5069, 115.2625, 210, 60, 6, 3, 3, 3, "Villa", "pools",
  ["tropical_pool", "resort_pool_house", "resort_night", "bedroom_classic", "living_coffered"],
  ["Wifi", "Pool", "Air conditioning", "Breakfast included", "Garden", "Gym", "Kitchen"],
  "Pavilions arranged around a palm-fringed pool above the rice terraces. Daily breakfast, yoga on the deck and a driver on request."),
 ("lucas", "Beachfront apartment with sunset balcony", "Lagos, Portugal", "Portugal", 37.1028, -8.6730, 155, 50, 4, 2, 3, 1, "Apartment", "beachfront",
  ["beach_dusk", "beach_pink", "apt_red_chair", "bedroom_lamp", "kitchen_island"],
  ["Wifi", "Beach access", "Air conditioning", "Kitchen", "Washer", "TV"],
  "Wake to the sound of waves in a bright apartment steps from the sand. The west-facing balcony is made for sunsets."),
 ("priya", "Stone cottage in the green glen", "Isle of Skye, Scotland", "United Kingdom", 57.5359, -6.2755, 150, 45, 4, 2, 2, 1, "Cottage", "countryside",
  ["green_valley", "valley_mtns", "dining_bay", "bedroom_lamp", "kitchen_cook"],
  ["Wifi", "Heating", "Fireplace", "Kitchen", "Pets allowed", "Mountain view"],
  "A cosy cottage surrounded by rolling emerald hills. Peat-warm fireplace, wool blankets and a window seat built for rainy days."),
 ("priya", "Dockside cabin on a quiet lake", "Lake Tahoe, USA", "United States", 39.0968, -120.0324, 260, 75, 6, 3, 4, 2, "Cabin", "lakefront",
  ["lake_dock", "lake_boathouse", "cabin_forest", "kitchen_island", "bedroom_orange"],
  ["Wifi", "Lake access", "Fireplace", "Kitchen", "BBQ grill", "Free parking", "Pets allowed", "Hot tub"],
  "A pine-wrapped lake house with its own dock, kayaks and a firepit overlooking the water. Mornings here are glassy and quiet."),
]
# fmt: on

COMMENTS = [
    (5, "Exactly as pictured. The space was spotless and the host's recommendations were spot on."),
    (5, "One of the best stays we've had. We didn't want to leave and are already planning a return trip."),
    (5, "Beautiful, quiet and thoughtfully equipped. The photos really do it justice."),
    (4, "Lovely place with great light. Check-in was easy; the Wi-Fi was a touch slow in the evenings."),
    (5, "Perfect for a long weekend. Comfortable beds, a great kitchen and a wonderful setting."),
    (4, "Great location and very comfortable. We'd stay again, ideally for longer than two nights."),
    (5, "Stunning views and a really welcoming host. Highly recommended."),
    (3, "Gorgeous setting but a little smaller than I expected. Still a pleasant stay."),
    (4, "Cosy, clean and well stocked. A few steps from everything we wanted to see."),
]


def run(reset: bool = False) -> None:
    if reset:
        Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    with SessionLocal() as db:
        # users
        users: dict[str, User] = {}
        for name, local, role, bio in USERS:
            email = f"{local}{DEMO}"
            u = db.scalar(select(User).where(User.email == email))
            if not u:
                # No stock face photos for fictional people: the UI shows initials instead.
                u = User(name=name, email=email, role=role, bio=bio, avatar_url=None)
                db.add(u)
            users[local] = u
        reviewers = []
        for i, name in enumerate(REVIEWERS):
            email = f"{name.split()[0].lower()}.{i}@reviewers.example"
            r = db.scalar(select(User).where(User.email == email))
            if not r:
                r = User(name=name, email=email, role="guest", avatar_url=None)
                db.add(r)
            reviewers.append(r)
        db.flush()

        # amenities
        amen: dict[str, Amenity] = {}
        for name, icon in AMENITIES:
            a = db.scalar(select(Amenity).where(Amenity.name == name))
            if not a:
                a = Amenity(name=name, icon=icon)
                db.add(a)
            amen[name] = a
        db.flush()

        # listings (+ reviews for newly created ones only)
        created: list[Listing] = []
        for idx, row in enumerate(LISTINGS):
            (host, title, loc, country, lat, lng, price, clean, guests, br, beds, ba, ptype, cat, photos, ams, desc) = row
            existing = db.scalar(select(Listing).where(Listing.title == title, Listing.host_id == users[host].id))
            if existing:
                continue
            listing = Listing(
                host_id=users[host].id, title=title, description=desc, location=loc, country=country,
                latitude=lat, longitude=lng, price_per_night_cents=price * 100,
                cleaning_fee_cents=clean * 100, max_guests=guests, bedrooms=br, beds=beds,
                bathrooms=ba, property_type=ptype, category=cat,
                images=[ListingImage(image_url=img(P[p]), position=i) for i, p in enumerate(photos)],
                amenities=[amen[a] for a in ams],
            )
            db.add(listing)
            db.flush()
            created.append(listing)
            # deterministic reviews: 3-6 per listing, spread over past months
            n = 3 + (idx % 4)
            for k in range(n):
                rating, comment = COMMENTS[(idx * 3 + k * 2) % len(COMMENTS)]
                db.add(Review(
                    listing_id=listing.id, guest_id=reviewers[(idx + k) % len(reviewers)].id,
                    rating=rating, comment=comment,
                    created_at=date.today() - timedelta(days=20 + 37 * k + idx),
                ))
        db.flush()

        by_title = {l.title: l for l in db.scalars(select(Listing))}

        # favourites (idempotent via primary key)
        for title in ("Hand-built log cabin in the pines", "Beachfront apartment with sunset balcony",
                      "Glass-walled villa above the sea"):
            l = by_title.get(title)
            if l and not db.get(Favorite, (users["maya"].id, l.id)):
                db.add(Favorite(user_id=users["maya"].id, listing_id=l.id))

        # bookings: only when the table is empty so re-runs never duplicate / drift
        if not db.scalar(select(func.count()).select_from(Booking)):
            today = date.today()
            plan = [  # guest, title, start offset, nights, guests, status
                ("maya", "Hand-built log cabin in the pines", 24, 4, 2, "confirmed"),
                ("maya", "Thatched beach bungalow on the sand", 60, 6, 2, "confirmed"),
                ("maya", "Sunlit apartment with herringbone floors", -45, 3, 2, "confirmed"),
                ("maya", "Warehouse loft with brick and big windows", 35, 3, 2, "cancelled"),
            ]
            for guest, title, offset, nights, g, status in plan:
                l = by_title[title]
                ci, co = today + timedelta(days=offset), today + timedelta(days=offset + nights)
                q = make_quote(l, ci, co)
                db.add(Booking(
                    listing_id=l.id, guest_id=users[guest].id, check_in=ci, check_out=co, guests=g,
                    nightly_subtotal_cents=q.nightly_subtotal_cents, cleaning_fee_cents=q.cleaning_fee_cents,
                    service_fee_cents=q.service_fee_cents, total_price_cents=q.total_price_cents, status=status,
                ))
            # a few bookings from other guests so hosts have activity and some dates are blocked
            for rev_i, title, offset, nights, g in [
                (0, "Glass-walled villa above the sea", 14, 5, 4),
                (1, "Timber lodge at twilight", 20, 4, 6),
                (2, "Dockside cabin on a quiet lake", 10, 3, 3),
                (3, "Cabin above the clouds", 28, 4, 2),
            ]:
                l = by_title[title]
                ci, co = today + timedelta(days=offset), today + timedelta(days=offset + nights)
                q = make_quote(l, ci, co)
                db.add(Booking(
                    listing_id=l.id, guest_id=reviewers[rev_i].id, check_in=ci, check_out=co, guests=g,
                    nightly_subtotal_cents=q.nightly_subtotal_cents, cleaning_fee_cents=q.cleaning_fee_cents,
                    service_fee_cents=q.service_fee_cents, total_price_cents=q.total_price_cents,
                    status="confirmed",
                ))
        db.commit()
        n_list = db.scalar(select(func.count()).select_from(Listing))
        print(f"Seed complete: {n_list} listings, {len(created)} newly created.")


if __name__ == "__main__":
    run(reset="--reset" in sys.argv)
