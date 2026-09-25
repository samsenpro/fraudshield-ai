from fastapi import APIRouter, Depends

from app.models.schemas import AnalyzeResponse, TransactionInput
from app.services.analysis_service import AnalysisService
from app.services.container import get_analysis_service

router = APIRouter(prefix="/api/v1", tags=["fraud-analysis"])


@router.post("/analyze", response_model=AnalyzeResponse, response_model_by_alias=True)
def analyze(
    transaction: TransactionInput, service: AnalysisService = Depends(get_analysis_service)
) -> AnalyzeResponse:
    return service.analyze(transaction)


@router.post("/features")
def extract_features(
    transaction: TransactionInput, service: AnalysisService = Depends(get_analysis_service)
) -> dict[str, float]:
    return service.extract_features(transaction)


@router.post("/predict")
def predict(
    transaction: TransactionInput, service: AnalysisService = Depends(get_analysis_service)
) -> dict[str, float]:
    features = service.extract_features(transaction)
    return {"mlScore": service.predict(features)}


@router.post("/anomaly")
def detect_anomaly(
    transaction: TransactionInput, service: AnalysisService = Depends(get_analysis_service)
) -> dict[str, float]:
    features = service.extract_features(transaction)
    return {"anomalyScore": service.anomaly_score(features)}


@router.get("/model")
def model_info(service: AnalysisService = Depends(get_analysis_service)) -> dict:
    return service.model_info()
