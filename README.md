# FraudShield AI — Intelligent Fraud Detection & Risk Analysis Platform

Distributed fraud detection and risk analysis platform combining an enterprise
Java backend with a specialized Python machine learning service.

> **Status: scaffolding phase.** The architecture below is in place and the
> individual services build/run, but the fraud-detection business logic
> (rules, ML pipeline, risk engine, dashboard screens) is still being built
> incrementally. See [`docs/project-brief.md`](docs/project-brief.md) for the
> full specification driving this project.

## Architecture

```text
                           ┌─────────────────────┐
                           │      Angular        │
                           │    Dashboard UI     │
                           └──────────┬──────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │   Spring Boot API   │
                           │       Java 21       │
                           └──────────┬──────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
               PostgreSQL          Redis          Event / Queue
                                                        │
                                                        ▼
                                              ┌──────────────────┐
                                              │ Python FastAPI   │
                                              │ Fraud Detection  │
                                              └────────┬─────────┘
                                                       │
                                     ┌─────────────────┼────────────────┐
                                     ▼                 ▼                ▼
                              Anomaly Detection   ML Model       Risk Engine
                                     │                 │                │
                                     └─────────────────┼────────────────┘
                                                       ▼
                                                  Risk Score
```

Java owns business logic, security, persistence and every enterprise concern
(users, organizations, customers, transactions, alerts, fraud cases, audit).
Python is a specialized, stateless analysis service: feature engineering,
rule evaluation, anomaly detection, ML scoring and explainability. Python
never touches user/auth/organization data directly — Java is the single
source of truth.

## Repository layout

```text
backend-java/     Spring Boot 3+ business API (Java 21)
fraud-engine/      FastAPI fraud analysis service (Python)
frontend/          Angular analyst dashboard
infrastructure/    Prometheus / Grafana configuration
docs/              Architecture and design documentation
docker-compose.yml Local orchestration of every service
```

## Tech stack

Java 21 · Spring Boot · Spring Security · JWT · Python · FastAPI ·
scikit-learn · PostgreSQL · Redis · Docker · Angular · Resilience4j ·
Prometheus/Grafana · JUnit5/Mockito/Testcontainers · pytest

## Running locally

```bash
cp .env.example .env
docker compose up -d
```

- Java API: http://localhost:8080 (`/actuator/health`)
- Fraud engine: http://localhost:8000 (`/api/v1/health`)
- Frontend: http://localhost:4200

Without Docker, each service can also run standalone:

```bash
# backend-java
cd backend-java && ./mvnw spring-boot:run

# fraud-engine
cd fraud-engine && python3 -m venv --without-pip .venv && ... && uvicorn app.main:app --reload

# frontend
cd frontend && npm start
```

## Data & privacy

The system works exclusively with synthetic data. No real card numbers, real
identities or real financial information are used anywhere in this project.
The ML model and dataset are demonstrative and are not designed to support
real financial decisions.

## License

MIT — see [LICENSE](LICENSE).
