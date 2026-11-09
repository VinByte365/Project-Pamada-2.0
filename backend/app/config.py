from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "FarmSystem API"
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "farmsystem"
    supabase_url: str = ""
    supabase_jwt_secret: str = ""
    supabase_service_role_key: str = ""
    secret_key: str = "change-me"
    cors_origins: list[str] = ["*"]

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)


settings = Settings()
