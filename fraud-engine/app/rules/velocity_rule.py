from app.core.config import Settings
from app.rules.base import Rule, RuleSignal


class VelocityRule(Rule):
    """Fires when too many transactions happened in a short period (section 17)."""

    def __init__(self, settings: Settings):
        self._settings = settings

    def evaluate(self, features: dict[str, float]) -> RuleSignal | None:
        if features["transactions_last_hour"] > self._settings.max_transactions_per_hour:
            return RuleSignal(code="HIGH_VELOCITY", score=0.5, severity="HIGH")

        return None
