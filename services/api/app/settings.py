from typing import Literal

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="PLATFORM_", env_file=".env", extra="ignore")

    environment: Literal["development", "test", "production"] = "production"
    cors_origins: list[AnyHttpUrl] = []

    @field_validator("cors_origins")
    @classmethod
    def require_origins(cls, urls: list[AnyHttpUrl]) -> list[AnyHttpUrl]:
        for url in urls:
            if url.path not in (None, "/") or url.query or url.fragment or url.username or url.password:
                raise ValueError("CORS entries must be HTTP(S) origins")
        return urls
