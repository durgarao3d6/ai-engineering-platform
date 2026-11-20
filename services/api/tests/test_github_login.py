import hashlib
import hmac
import time

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.provision_workspace import issue_token, link_github_account
from app.settings import Settings

SIGNING_KEY = "test-signing-key-only-for-local-postgresql"


def assertion(account: int, seconds: int = 60, key: str = SIGNING_KEY) -> str:
    payload = f"github-v1.{account}.{int(time.time()) + seconds}"
    signature = hmac.new(key.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{signature}"


def test_github_sign_in_preserves_workspace_permissions(db_url):
    with psycopg.connect(db_url) as conn:
        fallback = issue_token(conn, "local:pilot")
        issue_token(conn, "local:another-pilot")
        link_github_account(conn, "local:pilot", 42)
        link_github_account(conn, "local:pilot", 42)
        with pytest.raises(ValueError):
            link_github_account(conn, "local:pilot", 43)

    settings = Settings(_env_file=None, database_url=db_url, workspace_login_signing_key=SIGNING_KEY)
    with TestClient(create_app(settings)) as api:
        assert api.get("/ready").status_code == 200
        legacy = api.get("/v1/projects", headers={"Authorization": f"Bearer {fallback}"})
        projects = api.get("/v1/projects", headers={"Authorization": f"Bearer {assertion(42)}"})
        assert projects.status_code == 200
        assert projects.json() == legacy.json()
        assert len(projects.json()["data"]) == 1

        for invalid in (assertion(99), assertion(42, -10), assertion(42, 300), assertion(42, key="wrong key")):
            assert api.get("/v1/projects", headers={"Authorization": f"Bearer {invalid}"}).status_code == 401

        with psycopg.connect(db_url) as conn:
            conn.execute("DELETE FROM memberships WHERE user_id IN (SELECT id FROM users WHERE github_user_id = 42)")
        revoked = api.get("/v1/projects", headers={"Authorization": f"Bearer {assertion(42)}"})
        assert revoked.json() == {"source": "workspace", "data": []}


def test_without_github_config_assertions_are_rejected(db_url):
    settings = Settings(_env_file=None, database_url=db_url)
    with TestClient(create_app(settings)) as api:
        assert api.get("/v1/projects", headers={"Authorization": f"Bearer {assertion(42)}"}).status_code == 401
