import os
import tempfile

# Must be set before the app is imported so tests use a throwaway database.
_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import seed  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _seeded():
    seed.run(reset=True)


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


MAYA, LUCAS, PRIYA = {"X-Demo-User": "1"}, {"X-Demo-User": "2"}, {"X-Demo-User": "3"}
