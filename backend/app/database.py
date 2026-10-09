"""SQLite engines and session factories.

Two engines point at the same database file:

* ``engine``        - normal deferred transactions (reads and ordinary writes).
* ``write_engine``  - every transaction starts with ``BEGIN IMMEDIATE`` which takes
                      SQLite's write lock up-front. The booking endpoint uses it so the
                      availability check and the INSERT happen atomically and two
                      concurrent requests can never both reserve the same dates.
"""

import os
from collections.abc import Iterator
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_URL = f"sqlite:///{BACKEND_DIR / 'airbnb.db'}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_URL)


class Base(DeclarativeBase):
    pass


def _make_engine(immediate: bool) -> Engine:
    eng = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False, "timeout": 15},
    )

    @event.listens_for(eng, "connect")
    def _on_connect(dbapi_conn, _record):
        # Let SQLAlchemy own transaction boundaries (see its pysqlite docs).
        dbapi_conn.isolation_level = None
        cur = dbapi_conn.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.execute("PRAGMA journal_mode=WAL")
        cur.execute("PRAGMA busy_timeout=15000")
        cur.close()

    @event.listens_for(eng, "begin")
    def _on_begin(conn):
        conn.exec_driver_sql("BEGIN IMMEDIATE" if immediate else "BEGIN")

    return eng


engine = _make_engine(immediate=False)
write_engine = _make_engine(immediate=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
WriteSessionLocal = sessionmaker(bind=write_engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    with SessionLocal() as session:
        yield session


def get_write_db() -> Iterator[Session]:
    with WriteSessionLocal() as session:
        yield session
