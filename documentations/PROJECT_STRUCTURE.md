# Project Structure & Conventions

**App:** FarmSystem (working title) — Aloe vera IoT + ML smart-farming system (enhancement of PAMADA)
**Language for all docs:** English

---

## 1. Repository Layout

```
SYSTEM/
├── frontend/                 # Mobile app (primary client) — Expo SDK 57 + React Native + TypeScript
├── backend/                  # FastAPI + Motor (async MongoDB) — optional cloud/sync/community
├── hardware/                 # (future) Raspberry Pi + 6-in-1 sensor node code
├── ml/                       # (future) ML training/eval/ONNX export (Phase 3)
├── documentations/
│   ├── system_plan.md        # Master source of truth (read this first)
│   ├── PROJECT_STRUCTURE.md  # This file
│   ├── FRONTEND_STRUCTURE.md
│   ├── BACKEND_STRUCTURE.md
│   ├── HARDWARE_IOT.md
│   ├── SYNC_SPEC.md
│   ├── ROADMAP.md
│   └── paper/                # Academic paper content (BUONG PAPEL) — kept separate from dev docs
│       └── REQUIREMENTS_INDEX.md
└── (root git repo)
```

Each subsystem lives in its own top-level directory. `system_plan.md` is the authoritative entry point for system-level decisions; the other docs expand specific areas.

---

## 2. Shared Conventions

### 2.1 Documentation
- Written in **English**.
- **Concise and decision-focused**: record decisions, structure, and conventions — avoid excessive prose.
- Feature/structure decisions are derived from `system_plan.md`; update the plan first when a system-level decision changes, then propagate to specific docs.
- **Academic paper content and developer docs are kept separate:**
  - `documentations/paper/` holds the extracted BUONG PAPEL requirements index.
  - Developer docs in `documentations/` root reference it but do not duplicate the full paper.

### 2.2 Version control
- Single git repository at the `SYSTEM/` root.
- Commit messages: concise, imperative mood (e.g. `add aloe diagnosis screen`, `refactor auth router`).
- Only commit when explicitly requested. Stage only intended files; never commit secrets or keys.
- Work on feature/topic branches; merge to the default branch after review. Keep the default branch deployable.

### 2.3 Secrets & config
- Never commit secrets, API keys, or tokens.
- Use environment variables / `.env` files (excluded via `.gitignore`) for runtime configuration.
- Provide `.env.example` templates instead of committing real values.

---

## 3. Frontend Conventions

Configuration files and dependencies live entirely under `frontend/`. See `FRONTEND_STRUCTURE.md` for the detailed layout.

- TypeScript in **strict mode** (`"strict": true`).
- Path alias `@/*` → `frontend/*`.
- **State management rule:**
  - **zustand** → local / transient client state (UI, device, scans, drafts, offline queue).
  - **React Query** → server / synchronized data.
  - **axios** → HTTP client for the FastAPI backend.
- Navigation via **expo-router** file-based routes.
- **Offline-first** by default: writes go to SQLite first; network calls never block core features.
- Expo SDK 57: before writing code, read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ (see `frontend/AGENTS.md`).

---

## 4. Backend Conventions

The `backend/` directory is empty and will be built per `BACKEND_STRUCTURE.md`.

- Python + FastAPI.
- Async MongoDB via **motor**.
- Pydantic v2 schemas.
- uvicorn ASGI server.
- Backend is **optional** for core offline use; it enables account/sync/community and cloud features.

---

## 5. Hardware / IoT Conventions

- Raspberry Pi farm node + 6-in-1 NPK/Moisture sensor (moisture, N, P, K, EC, pH).
- Code future under `hardware/`. See `HARDWARE_IOT.md`.
- IoT data flow (local vs cloud) is **undecided**; both modes documented as options.

---

## 6. ML Conventions

- Python + PyTorch for training; ONNX for mobile inference.
- Models: disease/pest detection, maturity estimation, post-harvest grading.
- Models run **on-device** (offline). See `system_plan.md` §10.

---

## 7. Naming & Code Style

- **Backend (Python):** PEP 8 — `snake_case` for functions/variables/files; `PascalCase` for classes/schemas; `UPPER_SNAKE` for constants.
- **Frontend (TypeScript):** components in `PascalCase`; files/functions/variables in `camelCase`; route file names in lowercase (kebab where multi-word).
- **Hardware/ML (Python):** PEP 8 naming as backend.
- Keep components and modules small and single-purpose; colocate tests with the code they test where applicable.
- No unnecessary comments; add comments only to clarify non-obvious intent.
