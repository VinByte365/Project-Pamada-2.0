# Backend Structure

**Stack:** Python · FastAPI · uvicorn · Pydantic v2 · motor (async MongoDB)
**Location:** `backend/`

The `backend/` directory is currently empty; this document defines the intended structure and conventions to be implemented in **Phase 5**.

## Role

The backend is **optional** for core use — the mobile app works fully offline. The backend enables:
- Account registration / authentication.
- Cloud backup & data synchronization.
- Optional community features.
- Serving synchronized data (farms, plants, diagnoses, maturity, grading, sensor readings, profit reports).

---

## 1. Recommended Layout

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py               # FastAPI app factory, router registration, lifespan
│   ├── config.py             # Settings via pydantic-settings; .env
│   ├── database.py           # Motor client & MongoDB connection
│   ├── dependencies.py       # Shared FastAPI dependencies (auth, db session)
│   ├── models/               # MongoDB document models
│   │   ├── user.py
│   │   ├── farm.py
│   │   ├── plant.py
│   │   ├── diagnosis.py
│   │   ├── maturity.py
│   │   ├── grading.py
│   │   ├── sensor_reading.py
│   │   ├── profit_report.py
│   │   ├── community_post.py
│   │   └── comment.py
│   ├── schemas/              # Pydantic v2 request/response schemas
│   │   ├── user.py
│   │   ├── farm.py
│   │   ├── plant.py
│   │   ├── diagnosis.py
│   │   ├── grading.py
│   │   ├── sensor.py
│   │   └── community.py
│   ├── routers/              # API route modules
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── farms.py
│   │   ├── plants.py
│   │   ├── diagnoses.py
│   │   ├── gradings.py
│   │   ├── sensors.py
│   │   ├── reports.py
│   │   ├── community.py
│   │   └── sync.py
│   ├── services/             # Business logic (separated from routes)
│   │   ├── auth_service.py
│   │   ├── sync_service.py
│   │   └── ...
│   └── core/                 # Cross-cutting: security, auth dependencies
│       └── security.py       # Password hashing, JWT encode/decode
├── tests/                    # pytest tests
├── requirements.txt          # or pyproject.toml / uv
├── .env.example
└── .gitignore
```

---

## 2. Core Decisions

### 2.1 Framework
- **FastAPI** for the API.
- **uvicorn** ASGI server.
- Async **motor** for MongoDB (no blocking I/O).
- **Pydantic v2** schemas.

### 2.2 Separation of responsibilities
- **routers/** → HTTP concerns (parsing, status codes, response models).
- **services/** → business logic (validation, sync, auth).
- **models/** → MongoDB document shapes.
- **schemas/** → API input/output contracts.

### 2.3 Configuration
- App settings via pydantic-settings from environment / `.env`.
- `.env` gitignored; ship `.env.example` with placeholders.
- Never commit secrets.

---

## 3. MongoDB Collections (optional layer)

| Collection | Purpose |
|------------|---------|
| `users` | Registered accounts |
| `farms` | Farm records |
| `plants` | Individual plant records |
| `diagnoses` | ML disease/pest diagnosis history |
| `maturity` | Maturity / harvest-readiness history |
| `gradings` | Post-harvest grading history |
| `sensor_readings` | IoT/environmental data |
| `profit_reports` | Profitability / ROI reports |
| `community_posts` | Community posts (optional) |
| `comments` | Post comments (optional) |

MongoDB is the central source of truth for **synchronized** data (not required for offline use). Document shapes are flexible (see `system_plan.md` §7).

---

## 4. Authentication

- Backend-issued **JWT** for authenticated requests.
- Two user states (from `system_plan.md` §8):
  - **Local-only:** the client operates with a local UUID; no server identity.
  - **Registered (synced):** local profile associated with a server `user`; JWT protects synced/community endpoints.
- Password hashing and JWT handling in `core/security.py`.
- Auth dependency (current user from token) in `dependencies.py`.

---

## 5. API Conventions

- RESTful resource paths:
  - `/auth/*` — register, login, refresh.
  - `/users/*`
  - `/farms/*`, `/plants/*`, `/diagnoses/*`, `/gradings/*`, `/sensors/*`, `/reports/*`
  - `/community/posts`, `/community/posts/{id}/comments` — optional.
  - `/sync/*` — synchronization endpoints (see `SYNC_SPEC.md`).
- Pydantic response models declare the public contract.
- Dependency injection for DB sessions and auth (async generator dependencies).
- Structured JSON errors; consistent documented status codes.
- CORS configured for the mobile app and future web client.

---

## 6. ML Note

ML models run **on-device** on the mobile app; the ML development pipeline (PyTorch → ONNX) is **Phase 3** and separate. The backend does not need to host models for core offline operation.
