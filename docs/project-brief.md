# FraudShield AI — Intelligent Fraud Detection & Risk Analysis Platform

Repository:

```text
fraudshield-ai
```

El objetivo es construir una plataforma de detección y análisis de fraude que combine:

* Java 21
* Spring Boot
* Spring Security
* JWT
* Python
* FastAPI
* Machine Learning
* REST APIs
* PostgreSQL
* Redis
* Docker
* procesamiento asíncrono
* comunicación Java ↔ Python
* observabilidad
* testing

La arquitectura debe representar un sistema empresarial real donde Java sea responsable de la lógica de negocio y Python sea un servicio especializado en análisis de riesgo y Machine Learning.

No quiero un simple CRUD. Quiero una arquitectura profesional de backend distribuido que pueda utilizar como proyecto destacado de portafolio.

---

# 1. ARQUITECTURA GENERAL

La arquitectura debe ser:

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

Separar claramente:

```text
backend-java/
fraud-engine/
frontend/
infrastructure/
docs/
```

---

# 2. RESPONSABILIDADES DE JAVA

Spring Boot será el backend principal y dueño de la lógica empresarial.

Debe encargarse de:

* autenticación
* autorización
* usuarios
* organizaciones
* clientes
* cuentas
* transacciones
* reglas de negocio
* estados de transacción
* resultados de análisis
* alertas
* casos de fraude
* auditoría
* comunicación con Python
* exposición de APIs
* persistencia

Java será la fuente principal de verdad para los datos empresariales.

---

# 3. RESPONSABILIDADES DE PYTHON

Python será el servicio especializado de detección de fraude.

Debe encargarse de:

* análisis de transacciones
* detección de anomalías
* extracción de características
* cálculo de señales de riesgo
* Machine Learning
* scoring
* clasificación
* explicación del resultado
* detección de patrones sospechosos

Python NO debe manejar:

* usuarios
* autenticación
* permisos
* organizaciones
* cuentas empresariales
* persistencia principal

---

# 4. FLUJO PRINCIPAL

Una transacción debe seguir este flujo:

```text
Cliente
   ↓
Spring Boot
   ↓
Validación
   ↓
Persistencia
   ↓
Fraud Analysis Job
   ↓
Python FastAPI
   ↓
Feature Extraction
   ↓
Rule Engine
   ↓
Anomaly Detection
   ↓
ML Model
   ↓
Risk Score
   ↓
Spring Boot
   ↓
Decision
   ↓
Approve / Review / Block
```

---

# 5. RESULTADO DE RIESGO

Python debe devolver una estructura similar a:

```json
{
  "transactionId": "uuid",
  "riskScore": 0.87,
  "riskLevel": "HIGH",
  "decision": "REVIEW",
  "confidence": 0.93,
  "signals": [
    {
      "code": "UNUSUAL_AMOUNT",
      "severity": "HIGH"
    },
    {
      "code": "UNUSUAL_LOCATION",
      "severity": "MEDIUM"
    }
  ],
  "modelVersion": "fraud-model-1.0",
  "processingTimeMs": 128
}
```

Los valores deben ser calculados por el sistema y no hardcodeados.

---

# 6. NIVELES DE RIESGO

Implementar:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Ejemplo conceptual:

```text
0.00 - 0.29 → LOW
0.30 - 0.59 → MEDIUM
0.60 - 0.84 → HIGH
0.85 - 1.00 → CRITICAL
```

Estos thresholds deben ser configurables.

No colocarlos directamente en el código.

---

# 7. DECISIONES

El motor debe poder producir:

```text
APPROVE
REVIEW
BLOCK
```

La decisión debe depender de:

* risk score
* reglas
* señales detectadas
* configuración de la organización
* tipo de transacción

Separar:

```text
RiskScore
```

de:

```text
DecisionEngine
```

para evitar acoplamiento.

---

# 8. MODELO DE DATOS

Crear como mínimo:

```text
User
Organization
Customer
Account
Transaction
RiskAssessment
RiskSignal
FraudCase
Alert
AuditLog
ModelVersion
```

Relaciones:

```text
Organization
    │
    ├── Users
    ├── Customers
    └── Accounts

Customer
    └── Accounts

Account
    └── Transactions

Transaction
    └── RiskAssessment

RiskAssessment
    └── RiskSignals

Transaction
    └── FraudCase

ModelVersion
    └── RiskAssessments
```

Utilizar:

* UUID
* timestamps
* índices
* foreign keys
* constraints

Evitar N+1 queries.

---

# 9. TRANSACTIONS

Crear endpoint:

```http
POST /api/v1/transactions
```

Ejemplo:

```json
{
  "accountId": "uuid",
  "amount": 1250000,
  "currency": "COP",
  "merchant": "Example Store",
  "country": "CO",
  "city": "Santa Marta",
  "ipAddress": "127.0.0.1",
  "deviceId": "device-123",
  "timestamp": "2026-09-24T10:30:00Z"
}
```

No utilizar información financiera real.

Todo debe funcionar con datos sintéticos.

---

# 10. TRANSACTION STATUS

Implementar:

```text
PENDING
ANALYZING
APPROVED
REVIEW
BLOCKED
FAILED
```

Flujo:

```text
PENDING
   ↓
ANALYZING
   ↓
APPROVED
```

o:

```text
ANALYZING
   ↓
REVIEW
```

o:

```text
ANALYZING
   ↓
BLOCKED
```

Controlar las transiciones para evitar estados inválidos.

---

# 11. FEATURE ENGINEERING

Python debe transformar una transacción en características.

Ejemplos:

```text
transaction_amount
transaction_frequency
average_amount
amount_deviation
time_since_last_transaction
country_change
city_change
device_change
ip_change
merchant_frequency
transactions_last_hour
transactions_last_day
```

Crear:

```text
FeatureExtractor
```

como componente independiente.

No mezclar feature engineering con el controller de FastAPI.

---

# 12. HISTORIAL DEL CLIENTE

Para detectar comportamiento anómalo, Python debe poder consultar información histórica relevante.

Ejemplos:

```text
average transaction amount
usual countries
usual cities
usual devices
usual transaction hours
transaction frequency
merchant patterns
```

Java debe proporcionar los datos necesarios mediante una API interna o un mecanismo claramente definido.

No permitir que Python tenga acceso directo indiscriminado a la base de datos de Java.

---

# 13. MACHINE LEARNING

Implementar inicialmente un modelo de Machine Learning utilizando datos sintéticos.

El objetivo no es crear un modelo financiero real, sino demostrar la arquitectura.

Utilizar Python con:

```text
pandas
numpy
scikit-learn
joblib
```

Crear un pipeline:

```text
Dataset
   ↓
Cleaning
   ↓
Feature Engineering
   ↓
Train/Test Split
   ↓
Model Training
   ↓
Evaluation
   ↓
Model Serialization
```

Utilizar un modelo apropiado para clasificación/anomaly detection.

Por ejemplo:

```text
RandomForestClassifier
```

y/o:

```text
IsolationForest
```

No utilizar ambos sin justificar su función.

---

# 14. DATASET SINTÉTICO

Crear un generador de transacciones sintéticas.

Debe generar casos:

```text
NORMAL
SUSPICIOUS
FRAUD
```

Variar:

* monto
* frecuencia
* ubicación
* dispositivo
* horario
* comercio
* comportamiento histórico

Crear:

```text
fraud-engine/data/
```

con datasets pequeños para desarrollo/testing.

No incluir datos personales reales.

---

# 15. MODEL TRAINING

Crear scripts:

```text
train_model.py
evaluate_model.py
generate_dataset.py
```

El modelo entrenado debe tener versionado.

Ejemplo:

```text
fraud-model-1.0
fraud-model-1.1
```

Guardar metadata:

```text
modelVersion
trainingDate
datasetVersion
metrics
features
```

---

# 16. MODEL EVALUATION

Mostrar métricas:

```text
accuracy
precision
recall
f1_score
confusion_matrix
roc_auc
```

Para fraude, prestar especial atención a:

```text
precision
recall
false positives
false negatives
```

Documentar las limitaciones del modelo.

No afirmar que el modelo representa un sistema antifraude real de producción financiera.

---

# 17. RULE ENGINE

Además del Machine Learning, crear reglas determinísticas.

Ejemplos:

```text
transaction amount > configured limit
too many transactions in short period
new country
new device
multiple failed attempts
unusual transaction hour
```

Crear:

```text
RuleEngine
```

y reglas individuales:

```text
UnusualAmountRule
VelocityRule
NewDeviceRule
LocationChangeRule
```

Cada regla debe devolver:

```json
{
  "code": "NEW_DEVICE",
  "score": 0.25,
  "severity": "MEDIUM"
}
```

---

# 18. RISK ENGINE

Combinar:

```text
ML score
+
Rule scores
+
Anomaly score
```

para producir:

```text
final risk score
```

Crear:

```text
RiskEngine
```

La fórmula debe ser configurable.

Por ejemplo:

```text
finalScore =
    mlScore * 0.60 +
    anomalyScore * 0.25 +
   ruleScore * 0.15
```

No hardcodear los pesos.

Utilizar configuración.

---

# 19. EXPLICABILIDAD

Cada evaluación debe explicar por qué se produjo el riesgo.

Ejemplo:

```json
{
  "riskScore": 0.91,
  "riskLevel": "CRITICAL",
  "reasons": [
    "Transaction amount is significantly higher than customer average",
    "Transaction originated from an unusual location",
    "New device detected",
    "High transaction velocity"
  ]
}
```

No generar explicaciones arbitrarias.

Las razones deben estar relacionadas con señales reales detectadas.

---

# 20. API DE PYTHON

Crear:

```http
POST /api/v1/analyze
POST /api/v1/features
POST /api/v1/predict
POST /api/v1/anomaly
GET  /api/v1/model
GET  /api/v1/health
```

El endpoint principal será:

```text
POST /api/v1/analyze
```

Debe devolver el análisis completo.

---

# 21. API DE JAVA

Crear:

```http
POST /api/v1/auth/register
POST /api/v1/auth/login

GET  /api/v1/transactions
POST /api/v1/transactions
GET  /api/v1/transactions/{id}

GET /api/v1/transactions/{id}/risk

GET /api/v1/alerts
GET /api/v1/fraud-cases

POST /api/v1/fraud-cases/{id}/review
PATCH /api/v1/fraud-cases/{id}

GET /api/v1/analytics

GET /actuator/health
GET /actuator/metrics
```

Usar:

```text
/api/v1/
```

como prefijo.

---

# 22. COMUNICACIÓN JAVA → PYTHON

No llamar Python directamente desde controllers.

Utilizar:

```text
Controller
   ↓
TransactionService
   ↓
RiskAssessmentService
   ↓
FraudEngineClient
   ↓
FastAPI
```

Crear:

```text
FraudEngineClient
```

como abstracción.

Configurar:

```text
timeout
retry
circuit breaker
correlation ID
logging
```

---

# 23. PROCESAMIENTO ASÍNCRONO

El análisis puede tardar más que una operación CRUD normal.

Implementar:

```text
Transaction
   ↓
PENDING
   ↓
Job
   ↓
Python
   ↓
Risk Assessment
   ↓
Decision
```

Redis puede utilizarse como infraestructura temporal para jobs.

La arquitectura debe permitir posteriormente reemplazar Redis por:

```text
RabbitMQ
Kafka
```

sin cambiar la lógica de negocio.

---

# 24. IDEMPOTENCIA

Una misma transacción no debe ser analizada accidentalmente varias veces.

Implementar:

```http
X-Idempotency-Key
```

Utilizar Redis para almacenar temporalmente las claves.

---

# 25. RESILIENCE4J

Implementar:

```text
Retry
CircuitBreaker
TimeLimiter
```

Si Python está temporalmente caído:

```text
Java
 ↓
Retry
 ↓
Retry
 ↓
CircuitBreaker
 ↓
Analysis unavailable
```

La transacción debe quedar en un estado coherente.

No bloquear indefinidamente la aplicación.

---

# 26. REDIS

Utilizar Redis para:

```text
idempotency
temporary jobs
risk cache
rate limiting
temporary analysis state
```

Ejemplos:

```text
idempotency:{key}

risk:{transactionId}

analysis:{transactionId}

rate-limit:{userId}
```

---

# 27. SEGURIDAD

Implementar:

```text
Spring Security
JWT
RBAC
```

Roles:

```text
ADMIN
ANALYST
REVIEWER
USER
```

Permisos:

```text
ADMIN
    → everything

ANALYST
    → transactions
    → risk assessments
    → analytics

REVIEWER
    → fraud cases
    → alerts
    → review decisions

USER
    → own transactions
```

Los endpoints internos de Python deben estar protegidos mediante API key o mecanismo equivalente.

---

# 28. MULTI-TENANCY

El sistema debe soportar múltiples organizaciones.

Cada organización debe tener:

```text
risk thresholds
rules
configuration
users
customers
transactions
```

Una organización jamás debe poder acceder a los datos de otra.

Crear:

```text
Organization
```

y utilizar `organizationId` en las entidades necesarias.

---

# 29. ALERTS

Cuando se detecte:

```text
HIGH
```

o:

```text
CRITICAL
```

crear una alerta.

Entidad:

```text
Alert
```

Campos:

```text
id
transactionId
organizationId
severity
status
reason
createdAt
resolvedAt
```

Estados:

```text
OPEN
INVESTIGATING
RESOLVED
DISMISSED
```

---

# 30. FRAUD CASES

Un analista debe poder convertir una alerta en un caso.

Flujo:

```text
Alert
 ↓
Investigation
 ↓
Fraud Case
 ↓
Review
 ↓
Resolution
```

Crear:

```text
FraudCase
```

con:

```text
status
assignedReviewer
notes
decision
createdAt
resolvedAt
```

Decisiones:

```text
CONFIRMED_FRAUD
FALSE_POSITIVE
UNDETERMINED
```

---

# 31. AUDITORÍA

Registrar:

```text
USER_LOGIN
TRANSACTION_CREATED
RISK_ANALYSIS_STARTED
RISK_ANALYSIS_COMPLETED
ALERT_CREATED
CASE_CREATED
CASE_ASSIGNED
CASE_RESOLVED
MODEL_UPDATED
RULE_UPDATED
```

Registrar:

```text
user
organization
action
timestamp
entity
entityId
metadata
```

---

# 32. ANALYTICS

Crear dashboard para analistas.

Mostrar:

```text
Transactions analyzed
Approved
Under review
Blocked
Fraud alerts
Fraud cases
False positives
Average risk score
Average analysis time
```

Gráficas:

```text
Transactions over time
Risk distribution
Alerts by severity
Fraud cases by status
```

---

# 33. OBSERVABILIDAD

Spring Boot:

```text
Actuator
Micrometer
Prometheus
```

Python:

```text
structured logging
metrics
request duration
model latency
prediction count
prediction errors
```

Métricas:

```text
transactions_analyzed_total
risk_analysis_failed_total
fraud_alerts_total
fraud_cases_total
ai_analysis_latency
ml_prediction_latency
python_request_errors_total
```

Utilizar:

```text
correlation_id
```

para seguir:

```text
Angular
 ↓
Java
 ↓
Python
 ↓
ML
 ↓
Java
```

---

# 34. RATE LIMITING

Aplicar rate limiting para:

```text
login
transaction creation
risk analysis
analytics
```

Especialmente endpoints que desencadenan procesamiento.

---

# 35. DOCKER

Crear:

```text
docker-compose.yml
```

Servicios:

```text
frontend
java-api
fraud-engine
postgres
redis
```

Opcional:

```text
prometheus
grafana
```

Ejecutar:

```bash
docker compose up -d
```

---

# 36. ESTRUCTURA

Utilizar:

```text
fraudshield-ai/
│
├── backend-java/
│   ├── src/
│   │   ├── main/java/com/fraudshield/
│   │   │   ├── auth/
│   │   │   ├── organization/
│   │   │   ├── user/
│   │   │   ├── customer/
│   │   │   ├── account/
│   │   │   ├── transaction/
│   │   │   ├── risk/
│   │   │   ├── alert/
│   │   │   ├── fraudcase/
│   │   │   ├── analytics/
│   │   │   ├── audit/
│   │   │   ├── ai/
│   │   │   ├── config/
│   │   │   └── exception/
│   │   └── test/
│   ├── pom.xml
│   └── Dockerfile
│
├── fraud-engine/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── services/
│   │   ├── features/
│   │   ├── rules/
│   │   ├── ml/
│   │   ├── anomaly/
│   │   └── main.py
│   │
│   ├── data/
│   ├── models/
│   ├── scripts/
│   │   ├── generate_dataset.py
│   │   ├── train_model.py
│   │   └── evaluate_model.py
│   │
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│
├── infrastructure/
│   ├── prometheus/
│   └── grafana/
│
├── docs/
│   ├── architecture.md
│   ├── fraud-detection.md
│   ├── machine-learning.md
│   ├── api.md
│   └── sequence-diagrams.md
│
├── docker-compose.yml
├── .env.example
├── README.md
└── LICENSE
```

---

# 37. TESTING

Java:

```text
JUnit 5
Mockito
Spring Boot Test
Testcontainers
```

Python:

```text
pytest
httpx
```

Testear:

```text
authentication
authorization
multi-tenancy
transaction creation
risk calculation
rules
ML prediction
anomaly detection
Java → Python communication
timeouts
retry
circuit breaker
Redis
PostgreSQL
fraud cases
alerts
```

Crear integration tests reales utilizando Testcontainers.

---

# 38. FRONTEND

Crear dashboard profesional con Angular.

Pantallas:

```text
Login
Dashboard
Transactions
Transaction Detail
Risk Assessment
Alerts
Fraud Cases
Analytics
Organizations
Settings
```

La pantalla de detalle de una transacción debe mostrar:

```text
Transaction
─────────────
Amount
Merchant
Location
Device
Timestamp

Risk Assessment
───────────────
Risk Score
Risk Level
Decision
Confidence

Signals
────────
Unusual Amount
New Device
Location Change
High Velocity

Model
─────
Model Version
Analysis Time
```

---

# 39. RISK VISUALIZATION

Mostrar visualmente:

```text
Risk Score: 0.87
```

y:

```text
HIGH
```

Mostrar las razones del resultado.

No limitar la explicación a un número.

---

# 40. MODEL VERSIONING

Cada evaluación debe registrar:

```text
modelVersion
modelType
datasetVersion
```

Ejemplo:

```text
fraud-model-1.0
```

Esto permite saber con qué modelo se realizó cada análisis.

---

# 41. CONFIGURABLE RULES

Las reglas deben ser configurables.

Por ejemplo:

```text
MAX_TRANSACTION_AMOUNT
MAX_TRANSACTIONS_PER_HOUR
NEW_DEVICE_THRESHOLD
LOCATION_CHANGE_THRESHOLD
```

No colocar estos valores directamente en el código.

Crear configuración por organización.

---

# 42. DOCUMENTACIÓN

Crear README profesional.

Debe explicar:

```text
Project Overview
Problem
Architecture
Java/Python responsibilities
Fraud Detection Pipeline
Machine Learning
Feature Engineering
Rule Engine
Risk Engine
API
Database
Security
Multi-tenancy
Docker
Testing
Observability
Model Versioning
```

Agregar diagramas:

```text
Architecture
Transaction flow
Fraud detection pipeline
Risk scoring
Fraud investigation
```

---

# 43. DATOS Y PRIVACIDAD

Utilizar exclusivamente datos sintéticos.

No incluir:

* números de tarjetas reales
* nombres reales
* documentos reales
* cuentas bancarias reales
* información financiera real

El README debe aclarar que el modelo y dataset son demostrativos y no están diseñados para decisiones financieras reales.

---

# 44. CALIDAD DEL CÓDIGO

Aplicar:

* SOLID
* Clean Architecture cuando aporte valor
* separación de responsabilidades
* DTOs
* dependency injection
* interfaces
* validación
* exception handling
* logging
* configuración externa

Evitar sobreingeniería.

Cada componente debe tener una responsabilidad clara.

---

# 45. OBJETIVO FINAL

El resultado debe parecer una plataforma real de análisis de fraude empresarial.

La separación debe ser evidente:

```text
JAVA
│
├── Business
├── Security
├── Transactions
├── Users
├── Organizations
├── Fraud Cases
├── Alerts
├── Persistence
└── APIs
```

y:

```text
PYTHON
│
├── Feature Engineering
├── Rule Analysis
├── Machine Learning
├── Anomaly Detection
├── Risk Scoring
└── Prediction
```

La comunicación:

```text
Angular
    ↓
Spring Boot
    ↓
REST / Async
    ↓
FastAPI
    ↓
ML + Rules + Anomaly Detection
    ↓
Risk Assessment
    ↓
Spring Boot
    ↓
Decision
```

Debe ser uno de los proyectos principales del portafolio y demostrar que puedo trabajar con **Java empresarial y Python especializado en Machine Learning**, integrándolos mediante APIs dentro de una arquitectura distribuida.

---

# 46. GIT Y VERSIONAMIENTO

Esta sección es obligatoria.

Al finalizar la implementación, configurar correctamente Git.

Crear exactamente estas ramas:

```text
main
dev
```

La rama:

```text
dev
```

será la rama principal de desarrollo.

Todos los cambios realizados durante el desarrollo deben registrarse mediante commits en `dev`.

Los commits deben tener mensajes claros y profesionales que expliquen:

```text
qué se modificó
```

y, cuando sea relevante:

```text
por qué se modificó
```

Ejemplos:

```text
feat: add transaction risk assessment pipeline

feat: integrate Python fraud detection service

fix: prevent duplicate transaction analysis

feat: add fraud alert management

test: add integration tests for risk assessment
```

La rama:

```text
main
```

debe contener únicamente versiones completas, estables y publicables del proyecto.

Cuando el proyecto esté terminado y listo para publicar:

```text
dev
  ↓
main
```

Publicar la primera versión como:

```text
1.0 - Initial complete release
```

o una descripción equivalente que explique claramente qué contiene esa versión.

Las siguientes versiones deben seguir el mismo esquema:

```text
1.1 - Description
1.2 - Description
2.0 - Description
```

No publicar en `main` funcionalidades incompletas o experimentales.

---

# 47. HISTORIAL DE COMMITS

MUY IMPORTANTE:

**Solo yo debo aparecer en el historial de commits del repositorio.**

No debe aparecer:

```text
Claude
Claude Code
Anthropic
AI
ChatGPT
OpenAI
```

como:

* autor
* committer
* coautor
* Co-authored-by
* contributor

No agregar líneas como:

```text
Co-authored-by: Claude
Co-authored-by: Claude Code
```

Todos los commits deben utilizar exclusivamente mi identidad de Git configurada en el entorno.

Antes de realizar commits, comprobar:

```bash
git config user.name
git config user.email
```

y verificar que correspondan únicamente a mi identidad.

Antes de publicar `main`, revisar:

```bash
git log
```

para comprobar que el historial de commits no contiene autores, committers o coautores relacionados con Claude, Claude Code, Anthropic, ChatGPT u otras herramientas de IA.

No modificar artificialmente el historial después de publicar una versión si no es necesario. La configuración correcta de identidad debe realizarse desde el inicio.

---

# 48. RESULTADO ESPERADO

Al finalizar quiero tener:

```text
fraudshield-ai/
```

con:

```text
Java 21
Spring Boot
Spring Security
JWT
Python
FastAPI
Machine Learning
scikit-learn
PostgreSQL
Redis
Docker
Angular
REST
Async Processing
Resilience4j
Prometheus
Grafana
JUnit
Mockito
pytest
Testcontainers
```

y una arquitectura que pueda explicar fácilmente en una entrevista técnica:

```text
¿Por qué Java?
→ Business backend y sistema principal.

¿Por qué Python?
→ Machine Learning y análisis especializado.

¿Cómo se comunican?
→ REST API + procesamiento asíncrono.

¿Cómo detectan fraude?
→ Rules + Feature Engineering + ML + Anomaly Detection.

¿Cómo calculan el riesgo?
→ Risk Engine combinando las diferentes señales.

¿Cómo manejan fallos?
→ Retry + Circuit Breaker + estados consistentes.

¿Cómo escalan?
→ Servicios desacoplados + procesamiento asíncrono.

¿Cómo protegen los datos?
→ JWT + RBAC + multi-tenancy + auditoría.

¿Cómo despliegan?
→ Docker Compose.

¿Cómo monitorean?
→ Actuator + Micrometer + Prometheus + Grafana.
```

Priorizar siempre calidad, arquitectura, seguridad, testing y claridad del código sobre cantidad de funcionalidades.
