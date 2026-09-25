[🇪🇸 Español](README.md) | **🇬🇧 English**

# FraudShield AI — Intelligent Fraud Detection & Risk Analysis Platform

A distributed fraud detection platform that combines an **enterprise Java 21 + Spring Boot backend** with a **specialized Machine Learning service in Python + FastAPI** and an **Angular analyst console**.

Every transaction goes through feature engineering, business rules, anomaly detection and an ML classifier; a risk engine combines the signals into a score, and Java makes the final decision (approve, review or block), raises alerts and lets analysts manage fraud cases.

![Version](https://img.shields.io/badge/version-1.0-blue)
![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1-brightgreen)
![Python](https://img.shields.io/badge/Python-3.12-3776ab)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)
![Angular](https://img.shields.io/badge/Angular-18-dd0031)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Stack](#stack)
- [Repository layout](#repository-layout)
- [Running locally](#running-locally)
- [API](#api)
- [Analyst console](#analyst-console)
- [Analysis pipeline](#analysis-pipeline)
- [Resilience and observability](#resilience-and-observability)
- [Tests](#tests)
- [Data and privacy](#data-and-privacy)
- [Author](#author)
- [License](#license)

## Features

- **Multi-organization with JWT**: organization sign-up, login and `ADMIN`, `ANALYST`, `REVIEWER` and `USER` roles with per-endpoint authorization.
- **Asynchronous transaction analysis**: the transaction is recorded immediately and analyzed in the background; the client polls for the result.
- **Python fraud engine**: behavioral features, four rules (velocity, unusual amount, new device, location change), `IsolationForest` for anomalies and a `RandomForestClassifier` for fraud probability, with signal explainability.
- **Final decision in Java**: configurable thresholds; a `CRITICAL` risk can never resolve to `APPROVE`.
- **Alerts and fraud cases**: high and critical transactions raise alerts; an alert can be turned into a case that is assigned to a reviewer and resolved with a decision and notes.
- **Analytics**: totals, risk distribution, alerts by severity, cases by status and activity over the last 14 days.
- **Audit trail** for logins, analyses and alerts.
- **Analyst console** in Angular with a dark theme, responsive layout and an English/Spanish interface.

## Architecture

```text
                           ┌─────────────────────┐
                           │      Angular        │
                           │   Analyst console   │
                           └──────────┬──────────┘
                                      │ REST + JWT
                                      ▼
                           ┌─────────────────────┐
                           │   Spring Boot API   │
                           │       Java 21       │
                           └──────────┬──────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
               PostgreSQL           Redis        Async analysis
                                                        │ HTTP + API key
                                                        ▼
                                              ┌──────────────────┐
                                              │  Python FastAPI  │
                                              │  Fraud Engine    │
                                              └────────┬─────────┘
                                     ┌─────────────────┼────────────────┐
                                     ▼                 ▼                ▼
                                   Rules           Anomalies        ML model
                                     └─────────────────┼────────────────┘
                                                       ▼
                                              Risk engine → Score
```

Java owns business logic, security, persistence and every enterprise concern (users, organizations, customers, transactions, alerts, cases, audit). Python is a specialized, stateless analysis service: it never touches user, authentication or organization data. Java is the single source of truth.

## Stack

| Layer | Technologies |
| --- | --- |
| Backend | Java 21, Spring Boot 4.1, Spring Security, JWT (jjwt), Spring Data JPA, Flyway, Resilience4j |
| Fraud engine | Python 3.12, FastAPI, scikit-learn, pandas, NumPy, Pydantic |
| Frontend | Angular 18 (standalone, signals), SCSS, in-house EN/ES i18n |
| Data | PostgreSQL 16, Redis 7 |
| Observability | Micrometer + Prometheus, Grafana, correlation-ID logging |
| Tests | JUnit 5, Mockito, Testcontainers, pytest, Karma/Jasmine |
| Infrastructure | Docker, Docker Compose, nginx |

## Repository layout

```text
backend-java/       Spring Boot business API (Java 21)
fraud-engine/       FastAPI fraud analysis service (Python)
frontend/           Angular analyst console
infrastructure/     Prometheus and Grafana configuration
docker-compose.yml  Local orchestration of every service
```

## Running locally

```bash
cp .env.example .env
docker compose up -d --build
```

| Service | URL |
| --- | --- |
| Console (Angular + nginx) | http://localhost:4200 |
| Java API | http://localhost:8080 (`/actuator/health`) |
| Fraud engine | http://localhost:8000 (`/api/v1/health`) |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |

On first start the engine generates a synthetic dataset and trains its models before serving requests.

To get started, create an organization from the login screen (**Create organization**): the first user becomes its `ADMIN`.

Without Docker, each service can run on its own:

```bash
# backend-java
cd backend-java && ./mvnw spring-boot:run

# fraud-engine
cd fraud-engine && python -m venv .venv && . .venv/bin/activate \
  && pip install -r requirements.txt && uvicorn app.main:app --reload

# frontend
cd frontend && npm install && npm start
```

## API

Every route (except authentication and health) requires `Authorization: Bearer <token>`.

| Method | Route | Description | Roles |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | Creates an organization and its first ADMIN user | public |
| POST | `/api/v1/auth/login` | Returns a JWT | public |
| POST | `/api/v1/transactions` | Records a transaction and starts its analysis | ADMIN, ANALYST, USER |
| GET | `/api/v1/transactions` | Paginated list of transactions | authenticated |
| GET | `/api/v1/transactions/{id}` | Transaction detail | authenticated |
| GET | `/api/v1/transactions/{id}/risk` | Risk assessment of the transaction | authenticated |
| GET | `/api/v1/alerts` | Paginated list of alerts | ADMIN, REVIEWER |
| GET | `/api/v1/alerts/{id}` | Alert detail | ADMIN, REVIEWER |
| POST | `/api/v1/fraud-cases` | Opens a case from an alert | ADMIN, REVIEWER |
| GET | `/api/v1/fraud-cases` | Paginated list of cases | ADMIN, REVIEWER |
| GET | `/api/v1/fraud-cases/{id}` | Case detail | ADMIN, REVIEWER |
| POST | `/api/v1/fraud-cases/{id}/review` | Assigns the case to the current reviewer | ADMIN, REVIEWER |
| PATCH | `/api/v1/fraud-cases/{id}` | Resolves the case with a decision | ADMIN, REVIEWER |
| GET | `/api/v1/analytics` | Aggregated metrics for the organization | ADMIN, ANALYST, REVIEWER |

The fraud engine exposes `/api/v1/analyze`, `/api/v1/features`, `/api/v1/predict`, `/api/v1/anomaly`, `/api/v1/model`, `/api/v1/health` and `/metrics`. The analysis routes require the API key header shared with Java.

## Analyst console

Angular 18 with standalone components and signals, with no external UI library: the design system (tokens, buttons, tables, forms, dialogs, badges, SVG charts) is implemented in the project itself.

- **Seven sections**: Dashboard, Transactions, Fraud Detection & Alerts (with cases), Risk Analysis, Models / AI, Reports and Settings, plus login and transaction/case detail screens.
- **Collapsible sidebar** that remembers its state and becomes a drawer on mobile; layouts adapted to desktop, tablet and mobile.
- **End-to-end workflows**: create transactions, follow their analysis live, open cases from alerts, take them for review and resolve them.
- **Loading, empty and error states**, toasts, CSV export and keyboard accessibility (visible focus, focus-trapped dialogs).
- **English and Spanish**: English by default; the language can be switched from the header, the login screen or Settings, and dates, numbers and currencies follow it.
- When the API is unreachable or the organization has no data yet, screens show clearly labelled sample data. Panels with no backend yet (fraud categories, risk by region, model registry, reports and team) always use sample data.

## Analysis pipeline

1. **Features** (12): amount and its deviation from the customer's average, frequency, time since the last transaction, transactions in the last hour and day, country, city, device and IP changes, and merchant frequency.
2. **Rules**: high velocity, unusual amount, new device and location change, each with its own severity.
3. **Anomalies**: `IsolationForest` over the customer's behavior.
4. **Classifier**: `RandomForestClassifier` trained on labelled synthetic data.
5. **Risk engine**: `score = ML·w₁ + anomaly·w₂ + rules·w₃`, with configurable weights and thresholds.
6. **Decision in Java**: levels `LOW ≤ 0.29 < MEDIUM ≤ 0.59 < HIGH ≤ 0.84 < CRITICAL`; `CRITICAL` always blocks and high levels raise alerts.

## Resilience and observability

- Engine calls protected by a **circuit breaker, retries with exponential backoff and a time limiter** (Resilience4j), on a dedicated thread pool.
- **Correlation ID** propagated from Java to Python and present in every log line.
- Business and technical metrics on `/actuator/prometheus` (Java) and `/metrics` (Python), scraped by Prometheus and shown in Grafana.

## Tests

```bash
# Java (JUnit 5 + Testcontainers; requires Docker)
cd backend-java && ./mvnw test

# Python
cd fraud-engine && pytest

# Angular
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless
```

## Data and privacy

The system works exclusively with synthetic data. No real card numbers, identities or financial information are used anywhere in this project. The model and dataset are for demonstration only and are not meant to support real financial decisions.

## Author

- **LinkedIn:** [samuel-martinez-beleno](https://www.linkedin.com/in/samuel-martinez-beleno/)
- **GitHub:** [samsenpro](https://github.com/samsenpro)

## License

Distributed under the [MIT](LICENSE) license.
