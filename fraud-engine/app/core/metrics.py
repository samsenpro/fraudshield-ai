from prometheus_client import Counter, Histogram

AI_ANALYSIS_LATENCY = Histogram(
    "ai_analysis_latency_seconds",
    "Time spent running the full /analyze pipeline (features + rules + ML + anomaly)",
)

ML_PREDICTION_LATENCY = Histogram(
    "ml_prediction_latency_seconds",
    "Time spent in the classifier's predict_proba call",
)

PYTHON_REQUEST_ERRORS_TOTAL = Counter(
    "python_request_errors_total",
    "Unhandled exceptions raised while serving a request",
    labelnames=("path",),
)
