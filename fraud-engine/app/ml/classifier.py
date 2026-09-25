import pandas as pd

from app.core.metrics import ML_PREDICTION_LATENCY
from app.core.model_registry import ModelBundle


class FraudClassifier:
    """Wraps the trained RandomForestClassifier (section 13): supervised, learns
    from the labeled synthetic dataset which feature combinations mean fraud."""

    def __init__(self, bundle: ModelBundle):
        self._bundle = bundle

    def predict_proba(self, features: dict[str, float]) -> float:
        if not self._bundle.is_trained or self._bundle.classifier is None:
            return 0.0

        with ML_PREDICTION_LATENCY.time():
            # A DataFrame with the training-time column names avoids sklearn's
            # "X does not have valid feature names" warning on every call.
            vector = pd.DataFrame([features], columns=self._bundle.feature_names)
            return float(self._bundle.classifier.predict_proba(vector)[0][1])
