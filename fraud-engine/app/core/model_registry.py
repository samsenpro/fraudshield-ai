import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib

from app.core.config import Settings

METADATA_FILENAME = "metadata.json"
CLASSIFIER_FILENAME = "classifier.joblib"
ANOMALY_FILENAME = "anomaly.joblib"


@dataclass
class ModelBundle:
    is_trained: bool
    version: str | None = None
    model_type: str | None = None
    dataset_version: str | None = None
    trained_at: str | None = None
    metrics: dict[str, Any] | None = None
    feature_names: list[str] | None = None
    classifier: Any | None = None
    anomaly_model: Any | None = None
    anomaly_scale: dict[str, float] | None = None


def load_latest(settings: Settings) -> ModelBundle:
    models_dir: Path = settings.models_dir
    metadata_path = models_dir / METADATA_FILENAME

    if not metadata_path.exists():
        return ModelBundle(is_trained=False)

    metadata = json.loads(metadata_path.read_text())

    classifier = _load_if_exists(models_dir / CLASSIFIER_FILENAME)
    anomaly_model = _load_if_exists(models_dir / ANOMALY_FILENAME)

    return ModelBundle(
        is_trained=classifier is not None and anomaly_model is not None,
        version=metadata.get("modelVersion"),
        model_type=metadata.get("modelType"),
        dataset_version=metadata.get("datasetVersion"),
        trained_at=metadata.get("trainedAt"),
        metrics=metadata.get("metrics"),
        feature_names=metadata.get("features"),
        classifier=classifier,
        anomaly_model=anomaly_model,
        anomaly_scale=metadata.get("anomalyScale"),
    )


def save(
    settings: Settings,
    classifier: Any,
    anomaly_model: Any,
    metadata: dict[str, Any],
) -> None:
    models_dir: Path = settings.models_dir
    models_dir.mkdir(parents=True, exist_ok=True)

    joblib.dump(classifier, models_dir / CLASSIFIER_FILENAME)
    joblib.dump(anomaly_model, models_dir / ANOMALY_FILENAME)
    (models_dir / METADATA_FILENAME).write_text(json.dumps(metadata, indent=2))


def _load_if_exists(path: Path) -> Any | None:
    return joblib.load(path) if path.exists() else None
