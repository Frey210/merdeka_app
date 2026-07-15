from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Gema Kemerdekaan RI API"
    app_env: str = "development"
    app_public_base_url: str = "http://localhost:5173"
    database_url: str = "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/merdeka_app"
    photo_storage_path: str = "./data/photos"
    download_token_secret: str = Field(default="development-only-change-me-32-chars")
    cloudflare_access_team_domain: str = ""
    cloudflare_access_audience: str = ""

    @field_validator("database_url")
    @classmethod
    def use_psycopg3(cls, value: str) -> str:
        if value.startswith("postgresql+psycopg2://"):
            return value.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)
        return value

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
