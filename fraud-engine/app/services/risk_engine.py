from app.core.config import Settings

_LEVEL_TO_DECISION = {
    "LOW": "APPROVE",
    "MEDIUM": "REVIEW",
    "HIGH": "REVIEW",
    "CRITICAL": "BLOCK",
}


class RiskEngine:
    """Combines the three independent signals into one score (section 18):
    finalScore = mlScore * w_ml + anomalyScore * w_anomaly + ruleScore * w_rule.
    Weights and thresholds come from Settings, never hardcoded here."""

    def __init__(self, settings: Settings):
        self._settings = settings

    def combine(self, ml_score: float, anomaly_score: float, rule_score: float) -> float:
        s = self._settings
        score = ml_score * s.ml_weight + anomaly_score * s.anomaly_weight + rule_score * s.rule_weight
        return min(1.0, max(0.0, score))

    def risk_level(self, score: float) -> str:
        s = self._settings
        if score <= s.risk_threshold_low:
            return "LOW"
        if score <= s.risk_threshold_medium:
            return "MEDIUM"
        if score <= s.risk_threshold_high:
            return "HIGH"
        return "CRITICAL"

    def decision(self, risk_level: str) -> str:
        return _LEVEL_TO_DECISION[risk_level]
