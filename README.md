# PAMADA v2

> **Working title:** PAMADA v2 — a mobile-first, offline-first Aloe vera (*Aloe Barbadensis Miller*) smart-farming platform.
> **Academic basis:** "BUONG PAPEL" (Capstone) — an enhancement of the previous **PAMADA v1** system.
> **Repository:** [VinByte365/Project-Pamada-2.0](https://github.com/VinByte365/Project-Pamada-2.0)

## Overview

Aloe vera is a high-value medicinal plant whose quality and economic value depend on proper monitoring of plant health and accurate harvest timing. In many farming regions, growers rely on manual observation and traditional decision-making, leading to delayed disease/pest detection, inaccurate maturity assessment, inconsistent post-harvest grading, poor environmental awareness, and limited visibility into profitability.

The previous **PAMADA v1** system used AI/computer vision on images to detect disease and estimate maturity, but was limited to visual data — it lacked environmental monitoring and post-harvest analysis. **PAMADA v2** enhances PAMADA v1 by adding **IoT environmental sensing, embedded processing, post-harvest grading, and profitability analysis**, while remaining **usable offline** for farmers in areas with slow or unstable internet.

> **Local when offline. Intelligent on the device. Connected through the cloud.**

## Core Architectural Pillars

1. **Offline-first** — Core farming features (monitoring, scanning, records) work without internet. Connectivity is an enhancement, not a requirement.
2. **On-device intelligence** — ML models (disease, maturity, grading) run on the mobile device via ONNX so analysis works offline.
3. **Local-first data handling** — Farm data is written locally and synchronized when connectivity is available.
4. **Separation of responsibilities** — Each technology (mobile, IoT/embedded, ML, backend, DB) has a single clear role.
5. **Optional connected modules** — Community and cloud sync are optional/secondary; they never block core offline use.

## Key Features

- **AI image-based disease & pest detection** — single-plant photo scanning against a trained dataset.
- **Plant maturity / harvest-readiness estimation** — age and harvest timing from visual features (leaf count, structure).
- **IoT environmental monitoring** — 6-in-1 NPK/Moisture sensor measuring moisture, nitrogen (N), phosphorus (P), potassium (K), electrical conductivity (EC), and pH.
- **Integrated analysis** — combine soil sensor data with image analysis for better decisions.
- **Post-harvest grading** — classify harvested aloe vera leaves by external quality (size, shape, visible surface quality).
- **Profitability analysis** — yield estimates and return-on-investment (ROI) reports from user inputs and current estimated market values.
- **Embedded deployment** — Raspberry Pi for real-time farm processing.
- **Monitoring, alerts, recommendations, reports** — knowledge-based preventive treatment suggestions and farm reports; final decisions remain with the user.
- **Single-plant image scanning** for detection, maturity, and grading.

### Delimitations (non-goals)

- Exclusively **Aloe Barbadensis Miller** (true Aloe vera); no other species/crops.
- Internal diseases without visible external symptoms are not detected.
- No automatic actuation — no auto irrigation, fertilization, pesticide spraying, or harvesting.
- AI accuracy depends entirely on training-data quality/quantity/diversity.
- No future market price prediction, supply-chain, or automated marketing.
- Treatment recommendations are knowledge-based only and do not replace professional agricultural consultation.

## Technology Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Mobile (primary client) | React Native + Expo (SDK 57) + TypeScript | Farmers view data, scan plants, run ML, get reports |
| Mobile navigation | expo-router (file-based tabs + stack) | App structure |
| Mobile state | zustand | Local / transient client state |
| Mobile data | React Query + axios | Server/synced data caching & HTTP |
| Local DB | SQLite | Offline / on-device storage |
| Local ML | ONNX model (+ PyTorch for dev) | On-device inference (disease, maturity, grading) |
| IoT / embedded | Raspberry Pi + 6-in-1 NPK/Moisture sensor | Environmental sensing & real-time farm monitoring |
| Backend | Python + FastAPI | API / business logic / auth / optional sync |
| Backend DB driver | motor (async) | Async MongoDB access |
| Identity / auth | Supabase Auth | User authentication and identity management for registered/synced users; FastAPI verifies Supabase JWTs |
| Online DB | MongoDB | Central shared storage (optional/secondary) |
| Future web client | Next.js + TypeScript | Additional client of the same API |

## Repository Layout

```
SYSTEM/
├── frontend/                 # Mobile app (primary client) — Expo SDK 57 + React Native + TypeScript
├── backend/                  # FastAPI + Motor (async MongoDB) — optional cloud/sync/community
├── hardware/                 # (future) Raspberry Pi + 6-in-1 sensor node code
├── ml/                       # (future) ML training/eval/ONNX export (Phase 3)
├── documentations/           # Project docs (system plan, structure, roadmap, etc.)
│   ├── system_plan.md        # Master source of truth
│   ├── PROJECT_STRUCTURE.md
│   ├── FRONTEND_STRUCTURE.md
│   ├── BACKEND_STRUCTURE.md
│   ├── HARDWARE_IOT.md
│   ├── SYNC_SPEC.md
│   ├── ROADMAP.md
│   └── paper/                # Academic paper content (BUONG PAPEL)
└── (root git repo)
```

## Getting Started

### Prerequisites

- Node.js (for the Expo frontend)
- Python 3.11+ (for the FastAPI backend)
- Expo CLI / `npx expo`
- (Optional) MongoDB instance for cloud sync/community
- (Optional) Supabase project for authentication

### Run everything (Windows)

```bat
start.bat
```

This launches the FastAPI backend (port 8000) and the Expo mobile app in separate terminals.

### Backend (manual)

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate.bat
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend (manual)

```bash
cd frontend
npm install
npx expo start
```

## Documentation

- `documentations/system_plan.md` — master source of truth.
- `documentations/PROJECT_STRUCTURE.md` — repository layout & conventions.
- `documentations/FRONTEND_STRUCTURE.md` — frontend layout.
- `documentations/BACKEND_STRUCTURE.md` — backend layout.
- `documentations/HARDWARE_IOT.md` — IoT/sensor details.
- `documentations/SYNC_SPEC.md` — synchronization spec.
- `documentations/ROADMAP.md` — phased build order.
- `documentations/paper/REQUIREMENTS_INDEX.md` — academic paper requirements index.

## Phased Build Order

1. **Phase 1 — Mobile Foundation:** Expo app, navigation, basic UI, structure.
2. **Phase 2 — Local Data:** SQLite, local profile, farms, plants, records.
3. **Phase 3 — Machine Learning:** dataset, training, evaluation, ONNX, mobile inference (disease, maturity, grading).
4. **Phase 4 — IoT / Embedded:** Raspberry Pi + 6-in-1 sensor integration.
5. **Phase 5 — Backend:** FastAPI, auth, user/farm/plant/diagnosis APIs (optional sync/community).
6. **Phase 6 — Synchronization:** connectivity, sync queue, upload/download, retry, conflicts (optional).
7. **Phase 7 — Profitability & Reporting:** yield/ROI module.
8. **Phase 8 — Community:** posts, images, comments, reactions, moderation.

## License

See `frontend/LICENSE`.