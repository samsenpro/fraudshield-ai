from app.rules.base import Rule, RuleSignal


class NewDeviceRule(Rule):
    """Fires when the transaction comes from a device not seen before for this customer."""

    def evaluate(self, features: dict[str, float]) -> RuleSignal | None:
        if features["device_change"] == 1.0:
            return RuleSignal(code="NEW_DEVICE", score=0.25, severity="MEDIUM")

        return None
