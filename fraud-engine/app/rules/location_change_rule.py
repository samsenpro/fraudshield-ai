from app.rules.base import Rule, RuleSignal


class LocationChangeRule(Rule):
    """Fires when the transaction's country differs from the customer's usual ones.
    A same-country city change is treated as a softer signal."""

    def evaluate(self, features: dict[str, float]) -> RuleSignal | None:
        if features["country_change"] == 1.0:
            return RuleSignal(code="UNUSUAL_LOCATION", score=0.3, severity="MEDIUM")

        if features["city_change"] == 1.0:
            return RuleSignal(code="UNUSUAL_LOCATION", score=0.15, severity="LOW")

        return None
