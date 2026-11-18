import os
from uuid import uuid4

import psycopg
import pytest
from psycopg import sql
from psycopg.conninfo import make_conninfo

from app.migrate import migrate


@pytest.fixture
def db_url():
    url = os.environ.get("PLATFORM_TEST_DATABASE_URL")
    if not url:
        pytest.skip("Set PLATFORM_TEST_DATABASE_URL to run PostgreSQL integration tests.")
    schema = f"test_{uuid4().hex}"
    with psycopg.connect(url, autocommit=True) as conn:
        conn.execute(sql.SQL("CREATE SCHEMA {}").format(sql.Identifier(schema)))
        try:
            scoped_url = make_conninfo(url, options=f"-c search_path={schema}")
            with psycopg.connect(scoped_url) as scoped:
                migrate(scoped)
                migrate(scoped)
            yield scoped_url
        finally:
            conn.execute(sql.SQL("DROP SCHEMA {} CASCADE").format(sql.Identifier(schema)))
