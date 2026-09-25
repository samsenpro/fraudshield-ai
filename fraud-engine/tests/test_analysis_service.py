from datetime import datetime

import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier

from app.core.config import Settings
from app.core.model_registry import ModelBundle
from app.features.extractor import FEATURE_NAMES
from app.models.schemas import CustomerHistory, TransactionInput
from app.services.analysis_service import AnalysisService


def _transaction(amount: float) -> TransactionInput:
    return TransactionInput(
        transactionId="tx-1",
        accountId="acc-1",
        customerId="cust-1",
        amount=amount,
        currency="COP",
        merchant="SuperMarket",
        country="CO",
        city="Bogota",
        ipAddress="10.0.0.1",
        deviceId="device-1",
        timestamp=datetime(2026, 1, 1, 12, 0, 0),
        history=CustomerHistory(
            transactionCount=5,
            averageAmount=100.0,
            usualCountries=["CO"],
            usualCities=["Bogota"],
            usualDevices=["device-1"],
            usualIpAddresses=["10.0.0.1"],
        ),
    )


def _trained_bundle() -> ModelBundle:
    # Two trivial, clearly separable samples: a normal one and a fraud-shaped one.
    normal_row = {name: 0.0 for name in FEATURE_NAMES}
    normal_row["transaction_amount"] = 100.0
    fraud_row = {name: 1.0 for name in FEATURE_NAMES}
    fraud_row["transaction_amount"] = 5000.0

    # A DataFrame with named columns, matching what the classifier/detector build
    # at inference time — otherwise sklearn warns about the feature-name mismatch.
    X = pd.DataFrame([normal_row, fraud_row], columns=FEATURE_NAMES)
    y = [0, 1]

    # bootstrap=False: with only two training rows, bootstrap resampling would let
    # some trees see the same row twice and never learn the split — deterministic
    # full-data trees make this fixture reliable.
    classifier = RandomForestClassifier(n_estimators=10, random_state=42, bootstrap=False).fit(X, y)
    anomaly_model = IsolationForest(n_estimators=10, random_state=42).fit(X.iloc[[0]])
    raw_scores = -anomaly_model.score_samples(X)

    return ModelBundle(
        is_trained=True,
        version="test-model-0.1",
        model_type="RandomForestClassifier+IsolationForest",
        dataset_version="test",
        trained_at="2026-01-01T00:00:00Z",
        metrics={"accuracy": 1.0},
        feature_names=FEATURE_NAMES,
        classifier=classifier,
        anomaly_model=anomaly_model,
        anomaly_scale={"min": float(raw_scores.min()), "max": float(raw_scores.max())},
    )


def test_analyze_returns_low_risk_for_a_normal_transaction():
    service = AnalysisService(Settings(), _trained_bundle())

    response = service.analyze(_transaction(amount=100.0))

    assert response.risk_level in {"LOW", "MEDIUM"}
    assert response.decision in {"APPROVE", "REVIEW"}
    assert response.model_version == "test-model-0.1"
    assert response.processing_time_ms >= 0


def test_analyze_flags_a_fraud_shaped_transaction():
    service = AnalysisService(Settings(), _trained_bundle())
    transaction = _transaction(amount=5000.0)
    # A country/city/device the history has never seen actually triggers *_change=1;
    # an *empty* usual list is the cold-start case and produces no signal at all.
    transaction.history.usual_countries = ["MX"]
    transaction.history.usual_cities = ["Mexico City"]
    transaction.history.usual_devices = ["device-9"]
    transaction.history.usual_ip_addresses = ["9.9.9.9"]

    response = service.analyze(transaction)

    assert response.risk_score > 0.5
    assert response.risk_level in {"MEDIUM", "HIGH", "CRITICAL"}
    assert response.decision != "APPROVE"
    assert len(response.signals) > 0


def test_untrained_bundle_falls_back_to_rules_only():
    service = AnalysisService(Settings(), ModelBundle(is_trained=False))

    response = service.analyze(_transaction(amount=100.0))

    assert response.model_version == "untrained"
    assert response.confidence == 0.4
