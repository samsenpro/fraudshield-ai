from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="FRAUD_ENGINE_", env_file=".env")

    api_key: str = "change-me"
    model_version: str = "fraud-model-1.0"
    risk_threshold_low: float = 0.29
    risk_threshold_medium: float = 0.59
    risk_threshold_high: float = 0.84


@lru_cache
def get_settings() -> Settings:
    return Settings()
