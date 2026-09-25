from app.core.config import Settings
from app.services.risk_engine import RiskEngine


def _engine() -> RiskEngine:
    return RiskEngine(Settings())


def test_combine_applies_configured_weights():
    engine = _engine()

    score = engine.combine(ml_score=1.0, anomaly_score=0.0, rule_score=0.0)

    assert score == 0.60  # ml_weight default


def test_combine_is_clamped_to_one():
    engine = _engine()

    score = engine.combine(ml_score=1.0, anomaly_score=1.0, rule_score=1.0)

    assert score == 1.0


def test_risk_level_boundaries_match_the_spec_example():
    engine = _engine()

    assert engine.risk_level(0.29) == "LOW"
    assert engine.risk_level(0.30) == "MEDIUM"
    assert engine.risk_level(0.59) == "MEDIUM"
    assert engine.risk_level(0.60) == "HIGH"
    assert engine.risk_level(0.84) == "HIGH"
    assert engine.risk_level(0.85) == "CRITICAL"


def test_decision_mapping():
    engine = _engine()

    assert engine.decision("LOW") == "APPROVE"
    assert engine.decision("MEDIUM") == "REVIEW"
    assert engine.decision("HIGH") == "REVIEW"
    assert engine.decision("CRITICAL") == "BLOCK"
