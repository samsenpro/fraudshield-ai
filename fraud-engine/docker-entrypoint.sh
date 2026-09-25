#!/bin/sh
set -e

# The trained model isn't committed to the repo (it's a build artifact, not
# source) — train it once on first startup so `docker compose up` works on a
# fresh clone without a manual step. Skips if a previous run already trained one.
if [ ! -f models/metadata.json ]; then
  echo "No trained model found — generating dataset and training..."
  python -m scripts.generate_dataset
  python -m scripts.train_model
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
