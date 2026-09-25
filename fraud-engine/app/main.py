from fastapi import FastAPI

from app.api import analysis, health

app = FastAPI(title="FraudShield Fraud Engine", version="0.1.0")

app.include_router(health.router, prefix="/api/v1")
app.include_router(analysis.router)
