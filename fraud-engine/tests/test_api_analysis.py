from datetime import datetime

from fastapi.testclient import TestClient

from app.core.config import Settings
from app.core.model_registry import ModelBundle
from app.main import app
from app.services.analysis_service import AnalysisService
from app.services.container import get_analysis_service

client = TestClient(app)

TRANSACTION_PAYLOAD = {
    "transactionId": "11111111-1111-1111-1111-111111111111",
    "accountId": "22222222-2222-2222-2222-222222222222",
    "customerId": "33333333-3333-3333-3333-333333333333",
    "amount": 1250000,
    "currency": "COP",
    "merchant": "Example Store",
    "country": "CO",
    "city": "Santa Marta",
    "ipAddress": "127.0.0.1",
    "deviceId": "device-123",
    "timestamp": "2026-09-24T10:30:00Z",
}


def setup_module() -> None:
    fake_service = AnalysisService(Settings(), ModelBundle(is_trained=False))
    app.dependency_overrides[get_analysis_service] = lambda: fake_service


def teardown_module() -> None:
    app.dependency_overrides.clear()


def test_analyze_returns_the_documented_contract_shape():
    response = client.post("/api/v1/analyze", json=TRANSACTION_PAYLOAD)

    assert response.status_code == 200
    body = response.json()
    assert body["transactionId"] == TRANSACTION_PAYLOAD["transactionId"]
    assert body["riskLevel"] in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
    assert body["decision"] in {"APPROVE", "REVIEW", "BLOCK"}
    assert "signals" in body and "reasons" in body
    assert body["modelVersion"] == "untrained"


def test_features_endpoint_returns_the_full_feature_vector():
    response = client.post("/api/v1/features", json=TRANSACTION_PAYLOAD)

    assert response.status_code == 200
    body = response.json()
    assert body["transaction_amount"] == 1250000


def test_predict_and_anomaly_endpoints_return_neutral_scores_when_untrained():
    predict_response = client.post("/api/v1/predict", json=TRANSACTION_PAYLOAD)
    anomaly_response = client.post("/api/v1/anomaly", json=TRANSACTION_PAYLOAD)

    assert predict_response.json() == {"mlScore": 0.0}
    assert anomaly_response.json() == {"anomalyScore": 0.0}


def test_model_endpoint_reports_not_trained():
    response = client.get("/api/v1/model")

    assert response.status_code == 200
    assert response.json()["status"] == "not_trained"


def test_health_endpoint_still_works():
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "UP"}
