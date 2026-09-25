"""Trains and serializes the fraud detection model (see docs/project-brief.md #15).

Two models, each earning its place (section 13's "no usar ambos sin justificar
su funcion"): a RandomForestClassifier learns from the *labeled* synthetic
fraud cases, while an IsolationForest is fit only on NORMAL transactions so it
can flag anomalies that don't look like anything the classifier was trained on
— a safety net for fraud patterns the labeled data never saw.
"""

from datetime import datetime, timezone

import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.model_selection import train_test_split

from app.core import model_registry
from app.core.config import get_settings
from app.features.extractor import FEATURE_NAMES
from app.ml.evaluation import compute_classification_metrics

DATASET_VERSION = "synthetic-v1"
RANDOM_STATE = 42


def train_model() -> dict:
    settings = get_settings()
    dataset_path = settings.data_dir / "synthetic_transactions.csv"
    if not dataset_path.exists():
        raise FileNotFoundError(
            f"{dataset_path} not found — run scripts/generate_dataset.py first."
        )

    df = pd.read_csv(dataset_path)
    X = df[FEATURE_NAMES]
    y = df["is_fraud"]

    X_train, X_test, y_train, y_test, label_train, _label_test = train_test_split(
        X, y, df["label"], test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    classifier = RandomForestClassifier(
        n_estimators=200, max_depth=8, class_weight="balanced", random_state=RANDOM_STATE
    )
    classifier.fit(X_train, y_train)

    normal_only = X_train[label_train == "NORMAL"]
    anomaly_model = IsolationForest(n_estimators=200, contamination="auto", random_state=RANDOM_STATE)
    anomaly_model.fit(normal_only)

    raw_scores = -anomaly_model.score_samples(normal_only)
    anomaly_scale = {"min": float(raw_scores.min()), "max": float(raw_scores.max())}

    y_pred = classifier.predict(X_test)
    y_proba = classifier.predict_proba(X_test)[:, 1]
    metrics = compute_classification_metrics(y_test, y_pred, y_proba)

    metadata = {
        "modelVersion": settings.model_version,
        "modelType": "RandomForestClassifier+IsolationForest",
        "datasetVersion": DATASET_VERSION,
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "features": FEATURE_NAMES,
        "metrics": metrics,
        "anomalyScale": anomaly_scale,
    }

    model_registry.save(settings, classifier, anomaly_model, metadata)
    return metadata


def main() -> None:
    metadata = train_model()
    print(f"Trained {metadata['modelVersion']} ({metadata['modelType']})")
    print(f"Metrics: {metadata['metrics']}")


if __name__ == "__main__":
    main()
