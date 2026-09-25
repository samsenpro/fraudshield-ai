"""Evaluates the currently persisted model against the test split (see docs/project-brief.md #16).

Independent from train_model.py: reloads the serialized classifier from disk
and re-scores it, rather than trusting the metrics captured at training time.
Uses the same random_state/test_size so the split is reproducible.
"""

import pandas as pd
from sklearn.model_selection import train_test_split

from app.core import model_registry
from app.core.config import get_settings
from app.features.extractor import FEATURE_NAMES
from app.ml.evaluation import compute_classification_metrics
from scripts.train_model import RANDOM_STATE


def evaluate_model() -> dict:
    settings = get_settings()
    dataset_path = settings.data_dir / "synthetic_transactions.csv"
    bundle = model_registry.load_latest(settings)

    if not bundle.is_trained:
        raise RuntimeError("No trained model found — run scripts/train_model.py first.")
    if not dataset_path.exists():
        raise FileNotFoundError(
            f"{dataset_path} not found — run scripts/generate_dataset.py first."
        )

    df = pd.read_csv(dataset_path)
    X = df[FEATURE_NAMES]
    y = df["is_fraud"]

    _X_train, X_test, _y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    y_pred = bundle.classifier.predict(X_test)
    y_proba = bundle.classifier.predict_proba(X_test)[:, 1]

    return compute_classification_metrics(y_test, y_pred, y_proba)


def main() -> None:
    metrics = evaluate_model()
    for key, value in metrics.items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    main()
