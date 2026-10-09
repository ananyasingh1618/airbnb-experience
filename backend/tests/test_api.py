from datetime import date, timedelta
from concurrent.futures import ThreadPoolExecutor

from .conftest import LUCAS, MAYA, PRIYA


def d(offset: int) -> str:
    return (date.today() + timedelta(days=offset)).isoformat()


def book(client, listing_id, a, b, guests=2, headers=MAYA):
    return client.post(
        "/api/bookings",
        json={"listing_id": listing_id, "check_in": d(a), "check_out": d(b), "guests": guests},
        headers=headers,
    )


# Listing 17 (Ubud villa, host Lucas) has no seeded bookings; use far-future windows per test.


def test_health_and_seed(client):
    assert client.get("/api/health").json() == {"status": "ok"}
    page = client.get("/api/listings?page_size=48").json()
    assert page["total"] == 20 and len(page["items"]) == 20


def test_seed_is_idempotent():
    import seed
    seed.run()
    from app.database import SessionLocal
    from sqlalchemy import func, select
    from app.models import Listing, Booking
    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(Listing)) == 20
        assert db.scalar(select(func.count()).select_from(Booking)) == 8


def test_filters_combine_and_paginate(client):
    r = client.get("/api/listings?q=CANADA&category=cabins&max_price=250").json()
    assert {i["location"] for i in r["items"]} == {"Whistler, Canada"}
    r = client.get("/api/listings?amenities=Pool,Hot tub").json()
    assert r["total"] >= 1 and all("Pool" in [a["name"] for a in i["amenities"]] for i in r["items"])
    p1 = client.get("/api/listings?page=1&page_size=5&sort=price_desc").json()
    assert p1["items"][0]["price_per_night_cents"] >= p1["items"][-1]["price_per_night_cents"]
    assert client.get("/api/listings?guests=10").json()["total"] >= 1


def test_search_hides_unavailable_and_returns_quote(client):
    r = client.get(f"/api/listings?check_in={d(14)}&check_out={d(19)}&page_size=48").json()
    assert 1 not in [i["id"] for i in r["items"]]  # seeded booking blocks Marbella villa
    assert r["items"][0]["quote"]["nights"] == 5


def test_not_found_and_validation(client):
    assert client.get("/api/listings/9999").status_code == 404
    r = client.get("/api/listings?check_in=2020-01-01&check_out=2020-01-03")
    assert r.status_code == 422 and r.json()["error"]["code"] == "check_in_in_past"
    r = client.post("/api/listings", json={"title": "x"}, headers=LUCAS)
    assert r.status_code == 422 and "fields" in r.json()["error"]


def test_invalid_reservations_rejected(client):
    assert book(client, 17, -2, 3).status_code == 422          # past check-in
    assert book(client, 17, 100, 100).status_code == 422       # zero nights
    assert book(client, 17, 105, 101).status_code == 422       # reversed
    assert book(client, 17, 100, 103, guests=0).status_code == 422
    r = book(client, 17, 100, 103, guests=99)                  # over capacity (6)
    assert r.status_code == 422 and r.json()["error"]["code"] == "too_many_guests"
    assert book(client, 9999, 100, 103).status_code == 404
    assert client.post("/api/bookings", json={}, headers=MAYA).status_code == 422
    assert book(client, 17, 100, 103, headers={}).status_code == 401
    assert book(client, 17, 100, 103, headers={"X-Demo-User": "9999"}).status_code == 401
    assert book(client, 17, 100, 103, headers=LUCAS).status_code == 403  # host owns listing


def test_overlap_rejected_adjacent_allowed_and_persisted(client):
    first = book(client, 17, 200, 205)
    assert first.status_code == 201, first.text
    body = first.json()
    assert body["nightly_subtotal_cents"] == 5 * 21000
    assert body["service_fee_cents"] == 10500
    assert body["total_price_cents"] == 105000 + 6000 + 10500

    assert book(client, 17, 202, 207).status_code == 409   # overlaps tail
    assert book(client, 17, 198, 201).status_code == 409   # overlaps head
    assert book(client, 17, 201, 203).status_code == 409   # inside
    assert book(client, 17, 199, 210).status_code == 409   # surrounds
    assert book(client, 17, 205, 207, headers={"X-Demo-User": "1"}).status_code == 201  # starts on checkout day
    assert book(client, 17, 198, 200).status_code == 201   # ends on check-in day

    mine = client.get("/api/bookings/mine", headers=MAYA).json()
    assert any(b["id"] == body["id"] for b in mine)
    assert client.get(f"/api/bookings/{body['id']}", headers=MAYA).json()["reference"].startswith("HM")
    av = client.get(f"/api/listings/17/availability?check_in={d(201)}&check_out={d(204)}&guests=2").json()
    assert av["available"] is False


def test_duplicate_submit_is_idempotent(client):
    a = book(client, 19, 300, 303)
    b = book(client, 19, 300, 303)
    assert a.status_code == 201 and b.status_code == 200 and a.json()["id"] == b.json()["id"]


def test_cancel_frees_dates_and_keeps_history(client):
    r = book(client, 20, 400, 404)
    bid = r.json()["id"]
    assert book(client, 20, 401, 403, headers=PRIYA).status_code == 403  # Priya owns #20
    assert client.post(f"/api/bookings/{bid}/cancel", headers=LUCAS).status_code == 403
    c = client.post(f"/api/bookings/{bid}/cancel", headers=MAYA)
    assert c.status_code == 200 and c.json()["status"] == "cancelled"
    assert client.get(f"/api/bookings/{bid}", headers=MAYA).json()["status"] == "cancelled"
    # now rebookable by another guest (use Lucas, who doesn't own #20)
    assert book(client, 20, 400, 404, headers=LUCAS).status_code == 201


def test_concurrent_bookings_cannot_double_book(client):
    def attempt(_):
        return book(client, 16, 500, 504).status_code, book(client, 16, 500, 504, headers=LUCAS).status_code

    with ThreadPoolExecutor(8) as ex:
        codes = [c for pair in ex.map(attempt, range(8)) for c in pair]
    # exactly one confirmed booking exists no matter how many raced
    av = client.get("/api/listings/16/availability").json()
    assert sum(1 for r in av["booked"] if r["check_in"] == d(500)) == 1
    assert codes.count(201) == 1


def test_host_crud_ownership_and_delete_rules(client):
    payload = {
        "title": "Test hideaway", "description": "A long enough description for validation.",
        "location": "Testville, Testland", "price_per_night_cents": 12000, "cleaning_fee_cents": 2000,
        "max_guests": 3, "bedrooms": 1, "beds": 2, "bathrooms": 1, "property_type": "Cabin",
        "category": "cabins", "image_urls": ["https://example.com/a.jpg"], "amenity_ids": [1, 2],
    }
    assert client.post("/api/listings", json=payload, headers=MAYA).status_code == 403  # guest
    created = client.post("/api/listings", json=payload, headers=LUCAS)
    assert created.status_code == 201
    lid = created.json()["id"]
    assert [a["id"] for a in created.json()["amenities"]] == [1, 2]
    assert client.get("/api/listings?q=hideaway").json()["total"] == 1

    assert client.patch(f"/api/listings/{lid}", json={"title": "Hijack"}, headers=PRIYA).status_code == 403
    up = client.patch(f"/api/listings/{lid}", json={"title": "Renamed hideaway", "price_per_night_cents": 15000}, headers=LUCAS)
    assert up.status_code == 200 and up.json()["title"] == "Renamed hideaway" and up.json()["price_per_night_cents"] == 15000
    assert client.delete(f"/api/listings/{lid}", headers=PRIYA).status_code == 403

    assert book(client, lid, 600, 602).status_code == 201
    blocked = client.delete(f"/api/listings/{lid}", headers=LUCAS)
    assert blocked.status_code == 409 and blocked.json()["error"]["code"] == "listing_has_bookings"

    other = client.post("/api/listings", json={**payload, "title": "Disposable cabin"}, headers=LUCAS).json()["id"]
    assert client.delete(f"/api/listings/{other}", headers=LUCAS).status_code == 204
    assert client.get(f"/api/listings/{other}").status_code == 404

    hb = client.get("/api/host/bookings", headers=LUCAS).json()
    assert any(b["listing_id"] == lid for b in hb)
    assert client.get("/api/host/listings", headers=MAYA).status_code == 403


def test_favorites_roundtrip(client):
    assert client.post("/api/favorites", json={"listing_id": 5}, headers=MAYA).status_code == 201
    assert client.post("/api/favorites", json={"listing_id": 5}, headers=MAYA).status_code == 201  # idempotent
    assert 5 in client.get("/api/favorites", headers=MAYA).json()
    assert client.get("/api/listings/5", headers=MAYA).json()["is_favorite"] is True
    assert client.get("/api/listings/5", headers=LUCAS).json()["is_favorite"] is False
    assert client.delete("/api/favorites/5", headers=MAYA).status_code == 204
    assert 5 not in client.get("/api/favorites", headers=MAYA).json()
    assert client.post("/api/favorites", json={"listing_id": 9999}, headers=MAYA).status_code == 404


def test_db_trigger_blocks_overlap_even_without_app_check():
    import sqlite3
    from app.database import DATABASE_URL
    conn = sqlite3.connect(DATABASE_URL.replace("sqlite:///", ""))
    row = conn.execute("select listing_id, check_in, check_out from bookings where status='confirmed' limit 1").fetchone()
    try:
        conn.execute(
            "insert into bookings(listing_id,guest_id,check_in,check_out,guests,nightly_subtotal_cents,cleaning_fee_cents,"
            "service_fee_cents,total_price_cents,status,created_at) values (?,?,?,?,1,1,0,0,1,'confirmed','2026-01-01')",
            (row[0], 1, row[1], row[2]),
        )
        raised = False
    except sqlite3.IntegrityError as e:
        raised = "booking_overlap" in str(e)
    assert raised


def _preflight(client, origin):
    return client.options(
        "/api/listings",
        headers={"Origin": origin, "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "x-demo-user"},
    )


def test_cors_allows_configured_and_local_origins_only(client):
    for ok_origin in ("https://frontend.example.app", "https://other.example.app", "http://localhost:3000"):
        r = _preflight(client, ok_origin)
        assert r.status_code == 200 and r.headers["access-control-allow-origin"] == ok_origin, ok_origin
    bad = _preflight(client, "https://evil.example.com")
    assert bad.status_code == 400 and "access-control-allow-origin" not in bad.headers
    # never a wildcard
    assert _preflight(client, "https://frontend.example.app").headers["access-control-allow-origin"] != "*"


def test_health_and_root_behaviour(client):
    assert client.get("/api/health").json() == {"status": "ok"}
    assert client.get("/docs").status_code == 200


def test_root_identifies_the_service_as_an_unaffiliated_demo(client):
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert "not affiliated" in body["about"].lower() and "simulated" in body["about"].lower()
    assert body["docs"] == "/docs" and body["health"] == "/api/health"
    assert "/" not in client.get("/openapi.json").json()["paths"]  # kept out of the public schema


def test_no_endpoint_accepts_card_or_password_data(client):
    """The API schema has no card/password fields (demo payments are never collected)."""
    schema = client.get("/openapi.json").text.lower()
    for word in ("password", "card_number", "cardnumber", "cvv", "cvc", "iban", "expiry"):
        assert word not in schema, word


def test_google_verification_file_is_served_byte_for_byte(client):
    from pathlib import Path

    expected = (Path(__file__).resolve().parent.parent / "static" / "googlea11c4320d64e9163.html").read_bytes()
    r = client.get("/googlea11c4320d64e9163.html")
    assert r.status_code == 200
    assert r.content == expected
    assert r.content == b"google-site-verification: googlea11c4320d64e9163.html"
    assert r.headers["content-type"].startswith("text/html")
    # only this exact file is exposed: no other files under static/ and no listing in the API schema
    assert client.get("/static/googlea11c4320d64e9163.html").status_code == 404
    assert "/googlea11c4320d64e9163.html" not in client.get("/openapi.json").json()["paths"]
