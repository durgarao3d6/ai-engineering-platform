from pathlib import Path

import psycopg

from .settings import Settings

MIGRATIONS = Path(__file__).resolve().parent.parent / "migrations"


def migrate(conn: psycopg.Connection) -> None:
    with conn.transaction():
        conn.execute("SELECT pg_advisory_xact_lock(674317211)")
        conn.execute("CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY)")
        applied = {row[0] for row in conn.execute("SELECT version FROM schema_migrations")}
        for path in sorted(MIGRATIONS.glob("*.sql")):
            if path.name in applied:
                continue
            conn.execute(path.read_text())
            conn.execute("INSERT INTO schema_migrations (version) VALUES (%s)", (path.name,))


if __name__ == "__main__":
    settings = Settings()
    if settings.database_url is None:
        raise SystemExit("Set PLATFORM_DATABASE_URL before running migrations.")
    with psycopg.connect(settings.database_url.get_secret_value(), connect_timeout=5) as connection:
        migrate(connection)
