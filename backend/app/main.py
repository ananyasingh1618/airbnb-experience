import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

from . import models  # noqa: F401  (register tables)
from .core import ApiError
from .database import Base, engine
from .routers import bookings, listings, misc


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(engine)
    yield


app = FastAPI(
    title="Roamly API",
    version="1.0.0",
    description="Airbnb-inspired marketplace API. Demo identity via the `X-Demo-User` header "
    "(user id) - not real authentication.",
    lifespan=lifespan,
)

# Local dev origins plus anything in CORS_ORIGINS (comma separated, e.g. the Vercel URL).
origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
origins += [o.strip().rstrip("/") for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-Demo-User"],
)


@app.exception_handler(ApiError)
async def api_error_handler(_req: Request, exc: ApiError):
    body = {"code": exc.code, "message": exc.message}
    if exc.field:
        body["field"] = exc.field
    return JSONResponse({"error": body}, status_code=exc.status)


@app.exception_handler(RequestValidationError)
async def validation_handler(_req: Request, exc: RequestValidationError):
    fields: dict[str, str] = {}
    for err in exc.errors():
        loc = [str(p) for p in err["loc"] if p not in ("body", "query", "path")]
        fields.setdefault(".".join(loc) or "request", err["msg"].removeprefix("Value error, "))
    first = next(iter(fields.items()))
    return JSONResponse(
        {"error": {"code": "validation_error", "message": f"{first[0]}: {first[1]}", "fields": fields}},
        status_code=422,
    )


@app.exception_handler(OperationalError)
async def db_busy_handler(_req: Request, _exc: OperationalError):
    return JSONResponse(
        {"error": {"code": "database_busy", "message": "The database is busy. Please try again."}},
        status_code=503,
    )


app.include_router(listings.router)
app.include_router(bookings.router)
app.include_router(misc.router)
