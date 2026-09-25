from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="FRAUD_ENGINE_", env_file=".env")

    api_key: str = "change-me"
    model_version: str = "fraud-model-1.0"

    risk_threshold_low: float = 0.29
    risk_threshold_medium: float = 0.59
    risk_threshold_high: float = 0.84

    # RiskEngine weights (section 18): finalScore = ml*w + anomaly*w + rule*w
    ml_weight: float = 0.60
    anomaly_weight: float = 0.25
    rule_weight: float = 0.15

    # Rule thresholds (section 41) — never hardcoded inside a rule class.
    max_transaction_amount: float = 5000.0
    max_transactions_per_hour: int = 10
    unusual_amount_deviation_factor: float = 3.0

    data_dir: Path = ROOT_DIR / "data"
    models_dir: Path = ROOT_DIR / "models"


@lru_cache
def get_settings() -> Settings:
    return Settings()
