import hashlib
from uuid import uuid4

import psycopg
import pytest
from fastapi import HTTPException
from psycopg.rows import dict_row

from app.auth import authenticate


def test_token_validation(db_url):
    user = uuid4()
    valid, revoked, expired = (uuid4().hex for _ in range(3))
    with psycopg.connect(db_url, row_factory=dict_row) as conn:
        conn.execute("INSERT INTO users VALUES (%s, 'test-user')", (user,))
        for token, lifetime, revoked_at in [
            (valid, "1 hour", None),
            (revoked, "1 hour", "now"),
            (expired, "-1 hour", None),
        ]:
            conn.execute(
                "INSERT INTO access_tokens VALUES (%s, %s, now() + %s::interval, %s::timestamptz)",
                (hashlib.sha256(token.encode()).digest(), user, lifetime, revoked_at),
            )
        assert authenticate(conn, valid) == user
        for invalid in [revoked, expired, "unknown"]:
            with pytest.raises(HTTPException) as error:
                authenticate(conn, invalid)
            assert error.value.status_code == 401


def test_foreign_key_rejects_dataset_from_another_workspace(db_url):
    first, second, project, private_project, dataset = (uuid4() for _ in range(5))
    with psycopg.connect(db_url) as conn:
        conn.execute("INSERT INTO workspaces VALUES (%s, 'first'), (%s, 'second')", (first, second))
        conn.execute("INSERT INTO projects VALUES (%s, %s, 'first'), (%s, %s, 'second')", (
            project, first, private_project, second,
        ))
        conn.execute("INSERT INTO datasets VALUES (%s, %s, 'private', 'v1')", (dataset, private_project))
        with pytest.raises(psycopg.errors.ForeignKeyViolation), conn.transaction():
            conn.execute(
                """
                INSERT INTO runs (id, project_id, dataset_id, name, duration_ms, estimated_cost_usd)
                VALUES (%s, %s, %s, 'Cross-workspace run', 0, 0)
                """,
                (uuid4(), project, dataset),
            )
