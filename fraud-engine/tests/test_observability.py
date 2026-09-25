from fastapi.testclient import TestClient

from app.core.config import Settings
from app.core.model_registry import ModelBundle
from app.main import app
from app.services.analysis_service import AnalysisService
from app.services.container import get_analysis_service

client = TestClient(app)


def setup_module() -> None:
    app.dependency_overrides[get_analysis_service] = lambda: AnalysisService(
        Settings(), ModelBundle(is_trained=False)
    )


def teardown_module() -> None:
    app.dependency_overrides.clear()


def test_correlation_id_is_echoed_back_when_provided():
    response = client.get("/api/v1/health", headers={"X-Correlation-Id": "test-correlation-123"})

    assert response.headers["X-Correlation-Id"] == "test-correlation-123"


def test_a_correlation_id_is_generated_when_missing():
    response = client.get("/api/v1/health")

    assert response.headers["X-Correlation-Id"]  # non-empty, some UUID was minted


def test_metrics_endpoint_exposes_prometheus_format():
    # Exercise /analyze once so the histograms have at least one observation.
    client.post(
        "/api/v1/analyze",
        json={
            "transactionId": "11111111-1111-1111-1111-111111111111",
            "accountId": "22222222-2222-2222-2222-222222222222",
            "customerId": "33333333-3333-3333-3333-333333333333",
            "amount": 100,
            "currency": "COP",
            "merchant": "SuperMarket",
            "country": "CO",
            "city": "Bogota",
            "timestamp": "2026-09-24T10:30:00Z",
        },
    )

    response = client.get("/metrics")

    assert response.status_code == 200
    body = response.text
    assert "ai_analysis_latency_seconds" in body
    assert "ml_prediction_latency_seconds" in body
    assert "python_request_errors_total" in body
