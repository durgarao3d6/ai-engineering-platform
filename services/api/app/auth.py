import hashlib
import hmac
import re
import time
from uuid import UUID

import psycopg
from fastapi import HTTPException
from fastapi.security import HTTPBearer
from pydantic import SecretStr

bearer = HTTPBearer(auto_error=False)


def unauthorized() -> HTTPException:
    return HTTPException(401, "Valid bearer credentials required", {"WWW-Authenticate": "Bearer"})


def authenticate(
    conn: psycopg.Connection, token: str, signing_key: SecretStr | None = None
) -> UUID:
    if token.startswith("github-v1."):
        return authenticate_github(conn, token, signing_key)
    digest = hashlib.sha256(token.encode()).digest()
    row = conn.execute(
        """
        SELECT user_id FROM access_tokens
        WHERE token_hash = %s AND revoked_at IS NULL AND expires_at > now()
        """,
        (digest,),
    ).fetchone()
    if row is None:
        raise unauthorized()
    return row["user_id"]


def authenticate_github(
    conn: psycopg.Connection, assertion: str, signing_key: SecretStr | None
) -> UUID:
    match = re.fullmatch(
        r"github-v1\.([1-9][0-9]{0,14})\.([0-9]{1,12})\.([a-f0-9]{64})", assertion
    )
    if signing_key is None or match is None:
        raise unauthorized()

    github_id, expires, signature = match.groups()
    now = int(time.time())
    if not now < int(expires) <= now + 120:
        raise unauthorized()

    payload = f"github-v1.{github_id}.{expires}".encode()
    expected = hmac.new(signing_key.get_secret_value().encode(), payload, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise unauthorized()

    row = conn.execute(
        "SELECT id FROM users WHERE github_user_id = %s",
        (int(github_id),),
    ).fetchone()
    if row is None:
        raise unauthorized()
    return row["id"]
