import logging

from fastapi import FastAPI, Request
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from app.api import analysis, health
from app.core.correlation import CorrelationIdMiddleware
from app.core.logging_config import configure_logging
from app.core.metrics import PYTHON_REQUEST_ERRORS_TOTAL

configure_logging()
logger = logging.getLogger(__name__)

app = FastAPI(title="FraudShield Fraud Engine", version="0.1.0")

app.add_middleware(CorrelationIdMiddleware)

app.include_router(health.router, prefix="/api/v1")
app.include_router(analysis.router)


@app.middleware("http")
async def count_unhandled_errors(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception:
        PYTHON_REQUEST_ERRORS_TOTAL.labels(path=request.url.path).inc()
        logger.exception("Unhandled error while serving %s", request.url.path)
        raise


@app.get("/metrics")
def metrics() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
