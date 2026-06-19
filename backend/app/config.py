from functools import lru_cache

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


def _default_content_root() -> str:
    backend_dir = Path(__file__).resolve().parent.parent
    return str(backend_dir.parent / "frontend" / "public" / "content")


_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql://learn:learn@localhost:5432/learn"
    secret_key: str = "change-me-in-local-dev"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24
    seed_accounts_path: str = "seed/training_accounts.json"
    auth_enabled: bool = False
    authoring_enabled: bool = False
    content_root: str = _default_content_root()
    seed_on_startup: bool = False
    cors_origins: str = (
        "http://localhost:5173,"
        "http://127.0.0.1:5173,"
        "https://mekcuka.github.io"
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
