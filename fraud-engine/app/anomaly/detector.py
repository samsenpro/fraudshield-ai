import pandas as pd

from app.core.model_registry import ModelBundle


class AnomalyDetector:
    """Wraps the trained IsolationForest (section 13): unsupervised, so it can
    flag transactions that don't look like anything in the labeled training data —
    a complement to the supervised classifier, not a duplicate of it."""

    def __init__(self, bundle: ModelBundle):
        self._bundle = bundle

    def score(self, features: dict[str, float]) -> float:
        if not self._bundle.is_trained or self._bundle.anomaly_model is None:
            return 0.0

        vector = pd.DataFrame([features], columns=self._bundle.feature_names)
        raw = -self._bundle.anomaly_model.score_samples(vector)[0]

        scale = self._bundle.anomaly_scale or {"min": raw, "max": raw + 1.0}
        span = max(scale["max"] - scale["min"], 1e-9)
        normalized = (raw - scale["min"]) / span
        return float(min(max(normalized, 0.0), 1.0))
