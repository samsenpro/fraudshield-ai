from app.core.config import Settings
from app.rules.base import Rule, RuleSignal
from app.rules.location_change_rule import LocationChangeRule
from app.rules.new_device_rule import NewDeviceRule
from app.rules.unusual_amount_rule import UnusualAmountRule
from app.rules.velocity_rule import VelocityRule


class RuleEngine:
    """Runs every deterministic rule and aggregates their scores into one
    rule_score in [0, 1], one of the three inputs to the RiskEngine (section 18)."""

    def __init__(self, settings: Settings):
        self._rules: list[Rule] = [
            UnusualAmountRule(settings),
            VelocityRule(settings),
            NewDeviceRule(),
            LocationChangeRule(),
        ]

    def evaluate(self, features: dict[str, float]) -> list[RuleSignal]:
        signals = [rule.evaluate(features) for rule in self._rules]
        return [signal for signal in signals if signal is not None]

    @staticmethod
    def aggregate_score(signals: list[RuleSignal]) -> float:
        return min(1.0, sum(signal.score for signal in signals))
