from app.rules.base import RuleSignal

_REASON_BY_CODE = {
    "UNUSUAL_AMOUNT": "Transaction amount is significantly higher than the customer's average",
    "UNUSUAL_LOCATION": "Transaction originated from an unusual location",
    "NEW_DEVICE": "New device detected",
    "HIGH_VELOCITY": "High transaction velocity",
}


def build_reasons(signals: list[RuleSignal], ml_score: float, anomaly_score: float) -> list[str]:
    """Builds human-readable reasons strictly from signals that actually fired —
    never an arbitrary explanation (section 19)."""

    reasons = [_REASON_BY_CODE.get(signal.code, f"Rule {signal.code} triggered") for signal in signals]

    if ml_score > 0.5:
        reasons.append("Machine learning model scored this transaction as high risk")
    if anomaly_score > 0.5:
        reasons.append("Anomaly detector flagged an unusual transaction pattern")
    if not reasons:
        reasons.append("No specific risk signals were detected")

    return reasons
