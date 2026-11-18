from collections.abc import Iterator
from contextlib import contextmanager

import psycopg
from fastapi import HTTPException
from psycopg.rows import dict_row
from pydantic import SecretStr


@contextmanager
def connection(database_url: SecretStr | None) -> Iterator[psycopg.Connection]:
    if database_url is None:
        raise HTTPException(503, "Database unavailable")
    try:
        with psycopg.connect(database_url.get_secret_value(), row_factory=dict_row, connect_timeout=5) as conn:
            yield conn
    except psycopg.OperationalError:
        raise HTTPException(503, "Database unavailable") from None
