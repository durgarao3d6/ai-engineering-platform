from typing import Literal

from pydantic import AnyHttpUrl, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="PLATFORM_", env_file=".env", extra="ignore")

    environment: Literal["development", "test", "production"] = "production"
    cors_origins: list[AnyHttpUrl] = []
    database_url: SecretStr | None = None
    workspace_login_signing_key: SecretStr | None = None

    @field_validator("workspace_login_signing_key")
    @classmethod
    def require_signing_key(cls, key: SecretStr | None) -> SecretStr | None:
        if key is not None and len(key.get_secret_value().encode()) < 32:
            raise ValueError("The workspace login signing key must be at least 32 bytes")
        return key

    @field_validator("cors_origins")
    @classmethod
    def require_origins(cls, urls: list[AnyHttpUrl]) -> list[AnyHttpUrl]:
        for url in urls:
            if url.path not in (None, "/") or url.query or url.fragment or url.username or url.password:
                raise ValueError("CORS entries must be HTTP(S) origins")
        return urls
