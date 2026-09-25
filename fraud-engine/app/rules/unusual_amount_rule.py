from app.core.config import Settings
from app.rules.base import Rule, RuleSignal


class UnusualAmountRule(Rule):
    """Fires when the amount exceeds the org-wide ceiling, or deviates sharply
    from the customer's own historical average (section 6/41 thresholds)."""

    def __init__(self, settings: Settings):
        self._settings = settings

    def evaluate(self, features: dict[str, float]) -> RuleSignal | None:
        amount = features["transaction_amount"]
        deviation = features["amount_deviation"]

        if amount > self._settings.max_transaction_amount:
            return RuleSignal(code="UNUSUAL_AMOUNT", score=0.6, severity="HIGH")

        if deviation > self._settings.unusual_amount_deviation_factor:
            return RuleSignal(code="UNUSUAL_AMOUNT", score=0.3, severity="MEDIUM")

        return None
