# Roamly — an Airbnb-inspired stays marketplace

Roamly is an independent, photo-forward accommodation marketplace built as a full-stack assignment. Guests can search, filter, view listings, pick dates, check out (with a **simulated** payment) and see their trips; hosts can create, edit and delete listings and see reservations. It reproduces familiar marketplace interaction patterns but is **not** affiliated with Airbnb and uses no Airbnb code or assets.

> **Demo content notice:** all listings, hosts, guests, reviews and bookings are fictional seed data. Payments are simulated — nothing is charged and no card details are collected. Photos are from [Unsplash](https://unsplash.com).

## Features

- **Explore:** photo-led responsive grid (4 / 3 / 2 / 1 columns), 10 categories, sorting, pagination, skeleton / empty / error states.
- **Search & filters:** destination (case-insensitive, partial, multi-word), dates, guests, price range, property type, amenities, category, "saved only". All state lives in the URL (shareable, refresh-safe); removable filter chips and *Reset filters*. Searching with dates hides listings that are already booked and shows the stay total on each card.
- **Listing page:** 1 + 4 photo gallery (swipeable on mobile, full "Show all photos" viewer), host, capacity, amenities, availability calendar (booked nights struck through), reviews, map, sticky booking card.
- **Booking:** date range + guest selector → server-calculated price → checkout → confirmation (`RM-000123` reference) → **My Trips** (upcoming / past / cancelled, with cancel).
- **Host mode:** dashboard with owned listings, reservations table, create / edit / delete (delete is blocked with an explanation when a listing has booking history), ownership enforced on the backend.
- **Favorites:** optimistic toggle persisted per demo user, synced across every card and detail page, rolled back on error.
- **Demo accounts:** switch between a guest and two hosts from the account menu.
- Accessibility: semantic buttons/links, native `<dialog>` modals, visible focus rings, labelled controls, `aria-live` toasts, reduced-motion support.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · lucide-react · react-day-picker · date-fns |
| Backend | Python 3.13 · FastAPI · SQLAlchemy 2 · Pydantic 2 · Uvicorn |
| Database | SQLite (WAL mode, foreign keys enforced) |
| Tests | pytest (backend) · optional Playwright smoke script (`e2e/`) |

## Repository structure

```
backend/
  app/
    main.py          FastAPI app, CORS, structured error handlers
    database.py      engines (normal + BEGIN IMMEDIATE write engine), sessions
    models.py        SQLAlchemy models + DB-level overlap trigger
    schemas.py       Pydantic request/response models
    core.py          demo-user resolution, pricing, date validation, overlap clause
    serializers.py   ORM -> response schemas
    routers/         listings.py · bookings.py · misc.py (health, meta, host, favorites, reviews)
  seed.py            idempotent seed (20 listings)
  tests/             pytest suite
frontend/
  app/               routes: / · listings/[id] · checkout/[id] · booking-confirmation/[id] · trips · host · host/listings/new · host/listings/[id]/edit
  components/        layout · search · listings · booking · host · ui
  lib/               api client, URL<->search state, formatting, providers (demo user, favorites)
e2e/e2e.mjs          optional browser smoke test
render.yaml          Render blueprint for the API
```

## Local setup

Requirements: Python 3.11+ and Node 20+.

**Backend** (http://localhost:8000, docs at `/docs`):
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # optional; defaults work locally
python seed.py                  # creates roamly.db and seeds it (safe to re-run; `--reset` wipes first)
uvicorn app.main:app --reload --port 8000
```

**Frontend** (http://localhost:3000):
```bash
cd frontend
npm install
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Tables are also created automatically on API start; `seed.py` just fills them.

### Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | frontend | Base URL of the API (default `http://localhost:8000`) |
| `DATABASE_URL` | backend | SQLAlchemy URL, default `sqlite:///backend/roamly.db`. Use an absolute path on a persistent disk in production |
| `CORS_ORIGINS` | backend | Comma-separated deployed frontend origin(s); `http://localhost:3000` is always allowed |

## Demo users & role switching

Real authentication is out of scope. The account menu (top right) switches the **active demo user**; the frontend sends its id in an `X-Demo-User` header. The backend checks the user exists and enforces roles/ownership (hosts only for host endpoints, owners only for edit/delete, guests can't book their own listing), **but this is not authentication and gives no production security** — anyone can send any id.

| Account | Role |
|---|---|
| Maya Chen (id 1) | Guest — has seeded upcoming, past and cancelled trips and 3 favorites |
| Lucas Moreau (id 2) | Host — 10 listings (cities, coasts, design stays) |
| Priya Nair (id 3) | Host — 10 listings (mountains, lakes, countryside) |

## Database

Money is stored as **integer cents**; dates are ISO `DATE`s.

```
users(id, name, email UNIQUE, role, avatar_url, bio, created_at)
listings(id, host_id→users RESTRICT, title, description, location, country, latitude, longitude,
         price_per_night_cents, cleaning_fee_cents, max_guests, bedrooms, beds, bathrooms,
         property_type, category, created_at, updated_at)
listing_images(id, listing_id→listings CASCADE, image_url, position)
amenities(id, name UNIQUE, icon)          listing_amenities(listing_id, amenity_id)  -- both CASCADE
bookings(id, listing_id→listings RESTRICT, guest_id→users RESTRICT, check_in, check_out, guests,
         nightly_subtotal_cents, cleaning_fee_cents, service_fee_cents, total_price_cents,
         status 'confirmed'|'cancelled', created_at)
favorites(user_id, listing_id)  PK(user_id, listing_id)       -- CASCADE
reviews(id, listing_id, guest_id, rating 1-5, comment, created_at)  UNIQUE(listing_id, guest_id)
```
`bookings → listings` is `RESTRICT`: booking history is never silently destroyed, so deleting a listing that has bookings returns **409** with an explanation. Cancelling flips `status` instead of deleting.

## Booking integrity

1. **Rule:** half-open intervals — two stays conflict iff `existing.check_in < requested.check_out AND existing.check_out > requested.check_in`, so a stay may start on another guest's check-out day. Only `confirmed` bookings block dates; cancelled ones don't.
2. **Validation (server):** listing exists, caller isn't the owner, check-in not in the past, check-out after check-in, ≤ 90 nights, guests ≥ 1 and ≤ capacity.
3. **Atomicity:** the booking endpoint uses a dedicated engine whose transactions start with `BEGIN IMMEDIATE`, taking SQLite's write lock *before* the availability re-check and the `INSERT`. Concurrent requests for overlapping dates are serialised; the loser gets `409`.
4. **Defence in depth:** a `BEFORE INSERT` trigger on `bookings` aborts overlapping confirmed inserts at the database level.
5. **Authoritative pricing:** the backend ignores any client price. `nightly = price × nights`, `service fee = 10 %` (rounded half-up to the cent), `total = nightly + cleaning + service`; the breakdown is stored on the booking. The frontend never computes prices — it displays what `/availability` and `/bookings` return.
6. **Idempotency:** an identical confirmed booking by the same guest (double-click, retry) returns the existing record (200) rather than creating a duplicate; the checkout button also disables while submitting.

## Mock payment

Checkout shows a "Simulated payment" method. No payment provider is called and no card data is collected; confirming just creates the reservation in SQLite.

## API summary

Interactive docs: `GET /docs` (OpenAPI at `/openapi.json`). Identity header: `X-Demo-User: <id>`. Errors: `{"error": {"code", "message", "field?", "fields?"}}` with 401 / 403 / 404 / 409 / 422.

| Method & path | Notes |
|---|---|
| `GET /api/health` | liveness + DB check |
| `GET /api/meta` · `GET /api/demo-users` | categories, property types, amenities · switchable accounts |
| `GET /api/listings` | `q, check_in, check_out, guests, min_price, max_price` (dollars)`, property_type, category, amenities` (comma list, all required)`, favorites_only, sort` (`recommended\|rating\|price_asc\|price_desc\|newest`)`, page, page_size` |
| `GET /api/listings/{id}` | 404 if missing |
| `GET /api/listings/{id}/availability` | booked ranges; with dates also `available` + price `quote` |
| `POST /api/listings` · `PATCH` · `DELETE /api/listings/{id}` | host only; PATCH/DELETE owner only; DELETE → 409 if bookings exist |
| `GET /api/reviews/{listing_id}` | reviews + average |
| `POST /api/bookings` | 201 created / 200 idempotent repeat / 409 conflict / 422 invalid |
| `GET /api/bookings/mine` · `GET /api/bookings/{id}` | guest's bookings · guest or owning host only |
| `POST /api/bookings/{id}/cancel` | guest only, before check-in |
| `GET /api/host/listings` · `GET /api/host/bookings` | host only |
| `GET/POST /api/favorites` · `DELETE /api/favorites/{listing_id}` | per demo user |

## Tests

```bash
cd backend && source .venv/bin/activate && pytest -q        # 13 tests, throwaway temp DB
cd frontend && npm run lint && npm run build               # type-check + production build
```
The pytest suite covers: seeding (and idempotence), combined filters + pagination, hiding booked listings, 404/422 errors, invalid reservations (past, zero/negative nights, 0 guests, over capacity, missing user, owner booking), overlap rejection (tail/head/inside/surrounding), adjacent stays allowed, persisted bookings, idempotent resubmits, cancellation freeing dates, a concurrent-booking race, host CRUD + ownership + delete-blocked-by-bookings, favorites, and the DB trigger.

Optional browser smoke test (drives the real UI against running servers; needs Chrome and `npm i playwright-core` somewhere):
```bash
node e2e/e2e.mjs      # set CHROME_PATH if Chrome isn't auto-detected
```

## Deployment

* **Frontend → Vercel:** import the repo, set *Root Directory* to `frontend`, add `NEXT_PUBLIC_API_URL=<your API URL>`.
* **Backend → Render:** `render.yaml` defines the API with a 1 GB persistent disk at `/var/data` and `DATABASE_URL=sqlite:////var/data/roamly.db`. **Render's free tier has an ephemeral filesystem — SQLite data (including bookings) would be lost on every restart/deploy — so a persistent disk (paid instance) is required for durable data.** Set `CORS_ORIGINS` to the Vercel URL. The start command runs the idempotent `seed.py` first, so a fresh disk is populated and an existing one is left alone.
* Status: deployment configuration is prepared in this repo; see the hand-off notes for whether live URLs exist.

## Known limitations & assumptions

* Demo-header "auth" only (see above); no passwords, sessions or real authorization.
* Payments are simulated; no emails, messaging or host payouts.
* Single-process SQLite: great for a demo, not for horizontal scaling. Cancellation is the only booking mutation (no date changes).
* The map is an OpenStreetMap embed using seeded coordinates (needs internet; approximate area only).
* Listing images are remote URLs (Unsplash for seed data); broken URLs fall back to an icon placeholder. Seed photo IDs were checked to return HTTP 200 and visually reviewed when the seed was written, but remote availability can't be guaranteed.
* Seed bookings use dates relative to the day the seed first ran; re-running `seed.py --reset` regenerates them.
* Reviews can't be created through the UI (read-only seed data).
