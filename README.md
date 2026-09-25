**🇪🇸 Español** | [🇬🇧 English](README.en.md)

# FraudShield AI — Plataforma inteligente de detección de fraude y análisis de riesgo

Plataforma distribuida de detección de fraude que combina un **backend empresarial en Java 21 + Spring Boot** con un **servicio especializado de Machine Learning en Python + FastAPI**, y una **consola de analistas en Angular**.

Cada transacción pasa por ingeniería de variables, reglas de negocio, detección de anomalías y un clasificador de ML; un motor de riesgo combina las señales en un puntaje, y Java toma la decisión final (aprobar, revisar o bloquear), genera alertas y permite gestionar casos de fraude.

![Version](https://img.shields.io/badge/version-1.0-blue)
![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1-brightgreen)
![Python](https://img.shields.io/badge/Python-3.12-3776ab)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)
![Angular](https://img.shields.io/badge/Angular-18-dd0031)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## Índice

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Stack](#stack)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Ejecución local](#ejecución-local)
- [API](#api)
- [Consola de analistas](#consola-de-analistas)
- [Pipeline de análisis](#pipeline-de-análisis)
- [Resiliencia y observabilidad](#resiliencia-y-observabilidad)
- [Tests](#tests)
- [Datos y privacidad](#datos-y-privacidad)
- [Autor](#autor)
- [Licencia](#licencia)

## Características

- **Multi-organización con JWT**: registro de organizaciones, login y roles `ADMIN`, `ANALYST`, `REVIEWER` y `USER` con autorización por endpoint.
- **Análisis asíncrono de transacciones**: la transacción se registra al instante y se analiza en segundo plano; el cliente consulta el resultado.
- **Motor de fraude en Python**: variables de comportamiento, cuatro reglas (velocidad, monto inusual, dispositivo nuevo, cambio de ubicación), `IsolationForest` para anomalías y `RandomForestClassifier` para la probabilidad de fraude, con explicabilidad de las señales.
- **Decisión final en Java**: umbrales configurables; un riesgo `CRITICAL` nunca puede resolverse como `APPROVE`.
- **Alertas y casos de fraude**: las transacciones de riesgo alto y crítico generan alertas; desde una alerta se abre un caso que se asigna a un revisor y se resuelve con una decisión y notas.
- **Analítica**: totales, distribución de riesgo, alertas por severidad, casos por estado y actividad de los últimos 14 días.
- **Auditoría** de inicios de sesión, análisis y alertas.
- **Consola de analistas** en Angular con tema oscuro, diseño responsive e interfaz en inglés y español.

## Arquitectura

```text
                           ┌─────────────────────┐
                           │      Angular        │
                           │ Consola de analistas│
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
               PostgreSQL           Redis       Análisis asíncrono
                                                        │ HTTP + API key
                                                        ▼
                                              ┌──────────────────┐
                                              │  Python FastAPI  │
                                              │  Fraud Engine    │
                                              └────────┬─────────┘
                                     ┌─────────────────┼────────────────┐
                                     ▼                 ▼                ▼
                                   Reglas         Anomalías        Modelo ML
                                     └─────────────────┼────────────────┘
                                                       ▼
                                            Motor de riesgo → Puntaje
```

Java es el dueño de la lógica de negocio, la seguridad, la persistencia y todo lo empresarial (usuarios, organizaciones, clientes, transacciones, alertas, casos, auditoría). Python es un servicio de análisis especializado y sin estado: nunca accede a datos de usuarios, autenticación u organizaciones. Java es la única fuente de verdad.

## Stack

| Capa | Tecnologías |
| --- | --- |
| Backend | Java 21, Spring Boot 4.1, Spring Security, JWT (jjwt), Spring Data JPA, Flyway, Resilience4j |
| Motor de fraude | Python 3.12, FastAPI, scikit-learn, pandas, NumPy, Pydantic |
| Frontend | Angular 18 (standalone, signals), SCSS, i18n propio EN/ES |
| Datos | PostgreSQL 16, Redis 7 |
| Observabilidad | Micrometer + Prometheus, Grafana, logs con correlation ID |
| Tests | JUnit 5, Mockito, Testcontainers, pytest, Karma/Jasmine |
| Infraestructura | Docker, Docker Compose, nginx |

## Estructura del repositorio

```text
backend-java/       API de negocio con Spring Boot (Java 21)
fraud-engine/       Servicio de análisis de fraude con FastAPI (Python)
frontend/           Consola de analistas en Angular
infrastructure/     Configuración de Prometheus y Grafana
docker-compose.yml  Orquestación local de todos los servicios
```

## Ejecución local

```bash
cp .env.example .env
docker compose up -d --build
```

| Servicio | URL |
| --- | --- |
| Consola (Angular + nginx) | http://localhost:4200 |
| API Java | http://localhost:8080 (`/actuator/health`) |
| Motor de fraude | http://localhost:8000 (`/api/v1/health`) |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |

La primera vez, el motor genera un dataset sintético y entrena los modelos antes de arrancar.

Para empezar, crea una organización desde la pantalla de login (**Create organization**): el primer usuario queda como `ADMIN`.

Sin Docker, cada servicio puede ejecutarse por separado:

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

Todas las rutas (salvo autenticación y health) requieren `Authorization: Bearer <token>`.

| Método | Ruta | Descripción | Roles |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | Crea una organización y su primer usuario ADMIN | público |
| POST | `/api/v1/auth/login` | Devuelve un JWT | público |
| POST | `/api/v1/transactions` | Registra una transacción y lanza su análisis | ADMIN, ANALYST, USER |
| GET | `/api/v1/transactions` | Lista paginada de transacciones | autenticado |
| GET | `/api/v1/transactions/{id}` | Detalle de una transacción | autenticado |
| GET | `/api/v1/transactions/{id}/risk` | Evaluación de riesgo de la transacción | autenticado |
| GET | `/api/v1/alerts` | Lista paginada de alertas | ADMIN, REVIEWER |
| GET | `/api/v1/alerts/{id}` | Detalle de una alerta | ADMIN, REVIEWER |
| POST | `/api/v1/fraud-cases` | Abre un caso desde una alerta | ADMIN, REVIEWER |
| GET | `/api/v1/fraud-cases` | Lista paginada de casos | ADMIN, REVIEWER |
| GET | `/api/v1/fraud-cases/{id}` | Detalle de un caso | ADMIN, REVIEWER |
| POST | `/api/v1/fraud-cases/{id}/review` | Asigna el caso al revisor actual | ADMIN, REVIEWER |
| PATCH | `/api/v1/fraud-cases/{id}` | Resuelve el caso con una decisión | ADMIN, REVIEWER |
| GET | `/api/v1/analytics` | Métricas agregadas de la organización | ADMIN, ANALYST, REVIEWER |

El motor de fraude expone `/api/v1/analyze`, `/api/v1/features`, `/api/v1/predict`, `/api/v1/anomaly`, `/api/v1/model`, `/api/v1/health` y `/metrics`. Las rutas de análisis exigen la cabecera de API key compartida con Java.

## Consola de analistas

Angular 18 con componentes standalone y signals, sin librerías de UI externas: el design system (tokens, botones, tablas, formularios, modales, badges, gráficos SVG) está implementado en el propio proyecto.

- **Siete secciones**: Panel, Transacciones, Detección de fraude y alertas (con casos), Análisis de riesgo, Modelos / IA, Informes y Configuración, además del login y los detalles de transacción y de caso.
- **Sidebar contraíble** que recuerda su estado y se convierte en un cajón lateral en móvil; diseño adaptado a escritorio, tablet y móvil.
- **Flujos completos**: crear transacciones, seguir su análisis en tiempo real, abrir casos desde alertas, tomarlos para revisión y resolverlos.
- **Estados de carga, vacío y error**, notificaciones, exportación a CSV y accesibilidad por teclado (focus visible, modales con trampa de foco).
- **Inglés y español**: inglés por defecto; el idioma se cambia desde el header, el login o Configuración, y fechas, números y monedas siguen el idioma elegido.
- Si la API no responde o la organización aún no tiene datos, las pantallas muestran datos de ejemplo claramente señalados. Los paneles sin backend (categorías de fraude, riesgo por región, registro de modelos, informes y equipo) usan siempre datos de ejemplo.

## Pipeline de análisis

1. **Variables** (12): monto y su desviación frente al promedio del cliente, frecuencia, tiempo desde la última transacción, transacciones en la última hora y el último día, cambios de país, ciudad, dispositivo e IP, y frecuencia del comercio.
2. **Reglas**: velocidad alta, monto inusual, dispositivo nuevo y cambio de ubicación, cada una con su severidad.
3. **Anomalías**: `IsolationForest` sobre el comportamiento del cliente.
4. **Clasificador**: `RandomForestClassifier` entrenado con datos sintéticos etiquetados.
5. **Motor de riesgo**: `puntaje = ML·w₁ + anomalía·w₂ + reglas·w₃`, con pesos y umbrales configurables.
6. **Decisión en Java**: niveles `LOW ≤ 0.29 < MEDIUM ≤ 0.59 < HIGH ≤ 0.84 < CRITICAL`; `CRITICAL` siempre bloquea y los niveles altos generan alertas.

## Resiliencia y observabilidad

- Llamadas al motor con **circuit breaker, reintentos con backoff exponencial y time limiter** (Resilience4j), en un pool de hilos propio.
- **Correlation ID** propagado de Java a Python y presente en todos los logs.
- Métricas de negocio y técnicas en `/actuator/prometheus` (Java) y `/metrics` (Python), recogidas por Prometheus y visualizadas en Grafana.

## Tests

```bash
# Java (JUnit 5 + Testcontainers; requiere Docker)
cd backend-java && ./mvnw test

# Python
cd fraud-engine && pytest

# Angular
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless
```

## Datos y privacidad

El sistema trabaja exclusivamente con datos sintéticos. En ningún lugar del proyecto se usan números de tarjeta, identidades ni información financiera reales. El modelo y el dataset son demostrativos y no están pensados para decisiones financieras reales.

## Autor

- **LinkedIn:** [samuel-martinez-beleno](https://www.linkedin.com/in/samuel-martinez-beleno/)
- **GitHub:** [samsenpro](https://github.com/samsenpro)

## Licencia

Distribuido bajo la licencia [MIT](LICENSE).
