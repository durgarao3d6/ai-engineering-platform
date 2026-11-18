import hashlib
from uuid import UUID

import psycopg
from fastapi import HTTPException
from fastapi.security import HTTPBearer

bearer = HTTPBearer(auto_error=False)


def unauthorized() -> HTTPException:
    return HTTPException(401, "Valid bearer credentials required", {"WWW-Authenticate": "Bearer"})


def authenticate(conn: psycopg.Connection, token: str) -> UUID:
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
