# Build Roadmap

Derived from `system_plan.md` §13. Development is **incremental** — each phase is a stable milestone rather than a full parallel build.

---

## Phase 1 — Mobile Foundation
**Status:** In progress (base scaffold exists)

- React Native + Expo (SDK 57) + TypeScript.
- expo-router navigation (tabs + stack).
- Reorganize the default scaffold into the structure in `FRONTEND_STRUCTURE.md`.
- Base tabs: Home, Farms, Plants, Sensors, Settings.
- zustand + React Query + axios set up as the state/data foundation.
- Theme, constants, reusable components, path alias `@/*`.

**Exit criteria:** App builds and runs; core tabs navigate; state/data conventions in place.

---

## Phase 2 — Local Data
- SQLite integration (`lib/db/`).
- Local profile (`local_only` state).
- Farm records.
- Plant records (single-plant).
- Diagnosis / maturity / grading history (local storage).

**Exit criteria:** Farm and plant data are fully functional offline and persisted in SQLite.

---

## Phase 3 — Machine Learning
- Dataset preparation (disease/pest, maturity, grading).
- Model training (PyTorch).
- Model evaluation.
- Image preprocessing.
- Model optimization (quantization/compression).
- ONNX conversion.
- Mobile inference (on-device).

**Exit criteria:** Disease/pest detection, maturity estimation, and grading work offline via on-device ONNX.

---

## Phase 4 — IoT / Embedded
- Raspberry Pi farm node.
- 6-in-1 NPK/Moisture sensor integration (moisture, N, P, K, EC, pH).
- Data flow decision (local vs cloud — see `HARDWARE_IOT.md`).
- Sensor readings storage & display.

**Exit criteria:** Sensor readings reach the mobile app and are stored/displays, with offline handling.

---

## Phase 5 — Backend
- FastAPI + Motor project (`BACKEND_STRUCTURE.md`).
- Authentication (register/login, JWT).
- Farm, Plant, Diagnosis, Grading, Sensor, Reports APIs.
- MongoDB setup with central collections.

**Exit criteria:** APIs implemented and tested; account creation maps a local profile to a server user.

---

## Phase 6 — Synchronization (optional)
- Connectivity detection.
- Sync queue.
- Upload synchronization.
- Download synchronization.
- Retry mechanism.
- Conflict handling (see `SYNC_SPEC.md`).

**Exit criteria:** Local records sync up and server changes sync down reliably; conflicts handled.

---

## Phase 7 — Profitability & Reporting
- Yield estimates.
- ROI reports.
- User-input + estimated market values.
- Report history (local + optional sync).

**Exit criteria:** Profitability reports generate and display with ROI estimates.

---

## Phase 8 — Community (optional)
- Community posts.
- Images.
- Comments.
- Reactions.
- Crop categories.
- Reporting/moderation.

**Exit criteria:** Authenticated users create, view, and engage with community content (drafts sync to published when online).

---

## Phase 9 — Web Application (future)
Only after mobile + backend are stable.

- Next.js + TypeScript.
- Web authentication.
- Web dashboard.
- Community interface.
- Administrative functions.
- Other professor-required features.

**Exit criteria:** Web app consumes the same FastAPI API without a separate backend.

---

## Cross-cutting notes
- Update `system_plan.md` first whenever a system-level decision changes; then propagate to the relevant specific docs.
- Keep docs in sync with each completed phase (mark status, record decisions).
- Paper content lives separately in `documentations/paper/`; developer docs reference it rather than duplicating it.
