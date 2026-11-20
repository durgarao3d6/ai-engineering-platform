import hashlib

import psycopg

from app.provision_workspace import issue_token


def test_retry_issues_a_new_token_for_the_same_project(db_url):
    with psycopg.connect(db_url) as conn:
        first = issue_token(conn, "local:pilot")
        second = issue_token(conn, "local:pilot")

        assert first != second
        assert conn.execute("SELECT count(*) FROM projects").fetchone() == (1,)
        assert conn.execute("SELECT role FROM memberships").fetchall() == [("reader",)]
        rows = conn.execute(
            """
            SELECT token_hash, expires_at > now()
            FROM access_tokens JOIN users ON id = user_id
            WHERE external_subject = 'local:pilot'
            """
        ).fetchall()
        assert set(rows) == {(hashlib.sha256(token.encode()).digest(), True) for token in (first, second)}
