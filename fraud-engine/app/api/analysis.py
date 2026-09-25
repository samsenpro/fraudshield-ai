from fastapi import APIRouter, HTTPException, status

from app.core.config import get_settings

router = APIRouter(prefix="/api/v1", tags=["fraud-analysis"])

_NOT_IMPLEMENTED = "Not implemented yet — pending fraud engine implementation phase."


@router.post("/analyze")
def analyze(transaction: dict) -> dict:
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, _NOT_IMPLEMENTED)


@router.post("/features")
def extract_features(transaction: dict) -> dict:
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, _NOT_IMPLEMENTED)


@router.post("/predict")
def predict(features: dict) -> dict:
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, _NOT_IMPLEMENTED)


@router.post("/anomaly")
def detect_anomaly(features: dict) -> dict:
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, _NOT_IMPLEMENTED)


@router.get("/model")
def model_info() -> dict:
    return {"modelVersion": get_settings().model_version, "status": "not_trained"}
