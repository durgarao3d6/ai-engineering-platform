import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import create_app
from app.settings import Settings


def test_health():
    with TestClient(create_app(Settings(_env_file=None))) as client:
        assert client.get("/health").json() == {"status": "ok"}
        assert client.get("/openapi.json").status_code == 200
        assert client.get("/ready").status_code == 503


@pytest.mark.parametrize("origin,allowed", [
    ("http://localhost:3000", True),
    ("https://unknown.example", False),
])
def test_cors_allowlist(origin, allowed):
    settings = Settings(_env_file=None, cors_origins=["http://localhost:3000"])
    with TestClient(create_app(settings)) as client:
        response = client.options("/health", headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        })
    assert (response.headers.get("access-control-allow-origin") == origin) is allowed
    assert response.status_code == (200 if allowed else 400)


def test_cors_rejects_paths():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, cors_origins=["https://example.com/path"])


def test_readiness_requires_migrated_database(db_url):
    with TestClient(create_app(Settings(_env_file=None, database_url=db_url))) as client:
        assert client.get("/ready").json() == {"status": "ready"}
