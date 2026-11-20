from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from psycopg.errors import InsufficientPrivilege, UndefinedColumn, UndefinedTable

from . import demo, reads
from .db import connection
from .settings import Settings


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()
    application = FastAPI(title="AI Engineering Platform API", version="1.0.0")
    application.state.settings = settings
    application.include_router(reads.router)
    if settings.environment == "development":
        application.include_router(demo.router)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[str(url).rstrip("/") for url in settings.cors_origins],
        allow_methods=["GET"],
        allow_headers=["Authorization"],
    )

    @application.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @application.get("/ready")
    def ready() -> dict[str, str]:
        try:
            with connection(settings.database_url) as conn:
                conn.read_only = True
                conn.execute("SELECT 1 FROM access_tokens LIMIT 0")
                if settings.workspace_login_signing_key is not None:
                    conn.execute("SELECT id, github_user_id FROM users LIMIT 0")
        except (UndefinedTable, UndefinedColumn, InsufficientPrivilege):
            raise HTTPException(503, "Database unavailable") from None
        return {"status": "ready"}

    return application


app = create_app()
