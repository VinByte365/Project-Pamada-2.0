from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    app_name: str = "FarmSystem API"
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "farmsystem"
    supabase_url: str = ""
    supabase_jwt_secret: str = ""
    supabase_service_role_key: str = ""
    secret_key: str = "change-me"
    cors_origins: list[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=[str(BASE_DIR / ".env"), ".env"],
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
