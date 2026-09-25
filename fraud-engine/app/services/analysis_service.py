import logging
import time

from app.anomaly.detector import AnomalyDetector
from app.core.config import Settings
from app.core.metrics import AI_ANALYSIS_LATENCY
from app.core.model_registry import ModelBundle
from app.features.extractor import FeatureExtractor
from app.ml.classifier import FraudClassifier
from app.models.schemas import AnalyzeResponse, RiskSignalOut, TransactionInput
from app.rules.rule_engine import RuleEngine
from app.services.explainability import build_reasons
from app.services.risk_engine import RiskEngine

logger = logging.getLogger(__name__)


class AnalysisService:
    """Orchestrates the full pipeline (section 4): feature extraction, rules,
    ML + anomaly scoring, and the final risk decision. Kept out of the FastAPI
    controller so it can be unit tested without an HTTP layer."""

    def __init__(self, settings: Settings, model_bundle: ModelBundle):
        self._settings = settings
        self._model_bundle = model_bundle
        self._feature_extractor = FeatureExtractor()
        self._rule_engine = RuleEngine(settings)
        self._classifier = FraudClassifier(model_bundle)
        self._anomaly_detector = AnomalyDetector(model_bundle)
        self._risk_engine = RiskEngine(settings)

    def extract_features(self, transaction: TransactionInput) -> dict[str, float]:
        return self._feature_extractor.extract(transaction)

    def predict(self, features: dict[str, float]) -> float:
        return self._classifier.predict_proba(features)

    def anomaly_score(self, features: dict[str, float]) -> float:
        return self._anomaly_detector.score(features)

    def model_info(self) -> dict:
        bundle = self._model_bundle
        return {
            "modelVersion": bundle.version,
            "modelType": bundle.model_type,
            "datasetVersion": bundle.dataset_version,
            "trainedAt": bundle.trained_at,
            "metrics": bundle.metrics,
            "status": "trained" if bundle.is_trained else "not_trained",
        }

    def analyze(self, transaction: TransactionInput) -> AnalyzeResponse:
        start = time.perf_counter()

        with AI_ANALYSIS_LATENCY.time():
            features = self._feature_extractor.extract(transaction)
            rule_signals = self._rule_engine.evaluate(features)
            rule_score = RuleEngine.aggregate_score(rule_signals)
            ml_score = self._classifier.predict_proba(features)
            anomaly_score = self._anomaly_detector.score(features)

            final_score = self._risk_engine.combine(ml_score, anomaly_score, rule_score)
            risk_level = self._risk_engine.risk_level(final_score)
            decision = self._risk_engine.decision(risk_level)
            reasons = build_reasons(rule_signals, ml_score, anomaly_score)
            confidence = self._confidence(ml_score)

        processing_time_ms = int((time.perf_counter() - start) * 1000)
        logger.info(
            "analyzed transaction_id=%s risk_score=%s risk_level=%s decision=%s processing_time_ms=%s",
            transaction.transaction_id, round(final_score, 4), risk_level, decision, processing_time_ms,
        )

        return AnalyzeResponse(
            transaction_id=transaction.transaction_id,
            risk_score=round(final_score, 4),
            risk_level=risk_level,
            decision=decision,
            confidence=confidence,
            signals=[
                RiskSignalOut(code=s.code, severity=s.severity, score=s.score) for s in rule_signals
            ],
            reasons=reasons,
            model_version=self._model_bundle.version or "untrained",
            processing_time_ms=processing_time_ms,
        )

    def _confidence(self, ml_score: float) -> float:
        if not self._model_bundle.is_trained:
            return 0.4  # rules-only analysis: lower confidence, documented as such
        return round(min(1.0, 0.5 + abs(ml_score - 0.5)), 4)
