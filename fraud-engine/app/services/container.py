from functools import lru_cache

from app.core.config import get_settings
from app.core.model_registry import load_latest
from app.services.analysis_service import AnalysisService


@lru_cache
def get_analysis_service() -> AnalysisService:
    settings = get_settings()
    model_bundle = load_latest(settings)
    return AnalysisService(settings, model_bundle)
