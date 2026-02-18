from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    google_places_api_key: str = ""
    cache_ttl_days: int = 7
    scrape_timeout_ms: int = 30000

    class Config:
        env_file = ".env"


settings = Settings()
