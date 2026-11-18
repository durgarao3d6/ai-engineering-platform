from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import demo, reads
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

    return application


app = create_app()
