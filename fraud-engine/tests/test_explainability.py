from app.rules.base import RuleSignal
from app.services.explainability import build_reasons


def test_reasons_come_from_actual_signals():
    signals = [RuleSignal(code="NEW_DEVICE", score=0.25, severity="MEDIUM")]

    reasons = build_reasons(signals, ml_score=0.1, anomaly_score=0.1)

    assert reasons == ["New device detected"]


def test_reasons_include_ml_and_anomaly_contributions():
    reasons = build_reasons([], ml_score=0.9, anomaly_score=0.8)

    assert any("Machine learning" in r for r in reasons)
    assert any("Anomaly" in r for r in reasons)


def test_falls_back_to_a_no_signals_message():
    reasons = build_reasons([], ml_score=0.0, anomaly_score=0.0)

    assert reasons == ["No specific risk signals were detected"]
