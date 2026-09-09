# FarmSystem — Master System Plan

> **Working title:** FarmSystem
> **Academic basis:** "BUONG PAPEL" (Capstone) — an enhancement of the previous **PAMADA** system.
> **Purpose:** This document is the master source of truth for the system's overall architecture, decisions, features, and phased build order. All other documentation files in this repo derive from this plan.

---

## 1. Problem Statement

Aloe vera (*Aloe Barbadensis Miller*) is a high-value medicinal plant widely used in cosmetics, pharmaceuticals, and health products. Its quality and economic value depend heavily on **proper monitoring of plant health and accurate timing of harvest**. In the Philippines and other farming regions, growers often rely on **manual observation and traditional decision-making**, which leads to:

- Delayed disease and pest detection.
- Inaccurate maturity / harvest-readiness assessment.
- Inconsistent post-harvest grading.
- Poor environmental awareness (soil moisture, NPK, pH, EC, temperature, humidity).
- Limited visibility into profitability.

The **previous PAMADA system** used AI/computer vision on images to detect disease and estimate maturity, but was limited to visual data — it lacked **environmental monitoring** and **post-harvest analysis**.

FarmSystem enhances PAMADA by adding **IoT environmental sensing, embedded processing, post-harvest grading, and profitability analysis**, while remaining **usable offline** for farmers who operate in areas with slow or unstable internet.

---

## 2. Core Architectural Pillars

1. **Offline-first** — Core farming features (monitoring, scanning, records) must work without internet. Connectivity is an enhancement, not a requirement.
2. **On-device intelligence** — ML models (disease, maturity, grading) run on the mobile device via ONNX so analysis works offline.
3. **Local-first data handling** — Farm data is written locally and synchronized when connectivity is available.
4. **Separation of responsibilities** — Each technology (mobile, IoT/embedded, ML, backend, DB) has a single clear role.
5. **Optional connected modules** — Community and cloud sync are optional/secondary; they must never block core offline use.

> Note: The academic paper originally states "System operation requires an active internet connection." The project decision is to **change this to offline-first**, because the target audience is farmers with slow internet.

---

## 3. Technology Stack

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
| Online DB | MongoDB | Central shared storage (optional/secondary) |
| Future web client | Next.js + TypeScript | Additional client of the same API |

### Decision notes
- **Mobile app is the primary user-facing platform.** The paper says "web-based or app-based"; we prioritize the mobile app now, with a future web client possible.
- ML runs **on-device (ONNX), offline**, per the original system plan.
- IoT sensor data flow (Pi → local → mobile vs Pi → cloud → mobile) is **undecided**; both modes are documented as options in the hardware doc and resolved in a later phase.
- Backend uses FastAPI + Motor (async). Pydantic v2 for schemas.
- Existing Expo scaffold (SDK 57, expo-router, TypeScript, zustand, React Query, axios) is retained as the mobile foundation.

---

## 4. System Overview

```
                MOBILE APPLICATION (primary client)
              React Native + Expo + TypeScript
                          │
        ┌─────────────────┼──────────────────┐
        ▼                 ▼                  ▼
  Local SQLite      Local ML (ONNX)      Sync Manager
  (records)       (disease/maturity/     (optional)
                     grading)
        └─────────────────┼──────────────────┘
                          │
                         offline-first
                          │
        ┌─────────────────┴──────────────────┐
        ▼                                    ▼
  IoT / Raspberry Pi                     FastAPI API
  6-in-1 sensor                            (optional)
  (moisture,N,P,K,EC,pH)                     │
                                            MongoDB
        └─────────────────┬──────────────────┘
                          │
                   (optional: community,
                    cloud backup, sync)
```

- **SQLite** = local / offline storage.
- **MongoDB** = central shared storage (optional).
- The mobile app never talks to MongoDB directly; it goes through FastAPI when online.

---

## 5. System Requirements (scraped from the paper + offline-first change)

### 5.1 Core features
- **AI image-based disease & pest detection** — single-plant photo scanning against a trained dataset.
- **Plant maturity / harvest-readiness estimation** — age and harvest timing from visual features (leaf count, structure).
- **IoT environmental monitoring** — 6-in-1 NPK/Moisture sensor measuring moisture, nitrogen (N), phosphorus (P), potassium (K), electrical conductivity (EC), and pH.
- **Integrated analysis** — combine soil sensor data with image analysis for better decisions.
- **Post-harvest grading** — classify harvested aloe vera leaves by external quality (size, shape, visible surface quality).
- **Profitability analysis** — yield estimates and return-on-investment (ROI) reports from user inputs and current estimated market values.
- **Embedded deployment** — Raspberry Pi for real-time farm processing.
- **Monitoring, alerts, recommendations, reports** — knowledge-based preventive treatment suggestions and farm reports; final decisions remain with the user.
- **Single-plant image scanning** for detection, maturity, and grading.

### 5.2 Delimitations (non-goals)
- Exclusively **Aloe Barbadensis Miller** (true Aloe vera); no other species/crops.
- **Internal diseases** without visible external symptoms are not detected.
- **No automatic actuation** — no auto irrigation, fertilization, pesticide spraying, or harvesting.
- AI accuracy depends entirely on training-data quality/quantity/diversity.
- **No future market price prediction**, supply-chain, or automated marketing.
- Treatment recommendations are **knowledge-based only** and do not replace professional agricultural consultation.

---

## 6. Local Database (SQLite)

Primary tables / entities:

- `local_profile` — local-only identity.
- `farms` — farm records.
- `plants` — individual plant records (single-plant scanning).
- `diagnoses` — ML diagnosis history.
- `maturity_assessments` — harvest-readiness results.
- `gradings` — post-harvest grading results.
- `sensor_readings` — cached IoT/environmental data.
- `profit_reports` — profitability / ROI report history.
- `community_drafts` — draft community posts (optional).
- `sync_queue` — records waiting for upload (optional).
- `cached_posts` — cached community content (optional).

SQLite is the **local write target** for offline operation; it is not the authority for shared data.

---

## 7. Online Database (MongoDB) — Optional

Collections (used only when sync/community is enabled):

- `users`
- `farms`
- `plants`
- `diagnoses`
- `maturity_assessments`
- `gradings`
- `sensor_readings`
- `profit_reports`
- `community_posts`
- `comments`

MongoDB is the **central source of truth for synchronized data** when connectivity is available.

---

## 8. Authentication

Two user states (from the original system plan):

- **Local-only:** farmer uses a local UUID profile; all core features work offline.
- **Registered (synced):** local profile is associated with a server account; JWT protects synced/community endpoints.

Authentication is handled by the backend; SQLite is not the authority for shared identity.

---

## 9. Feature Modules

| Module | Offline-capable | Online (optional) |
|--------|-----------------|-------------------|
| Farm / plant records | Yes | Sync + backup |
| Disease & pest detection | Yes (on-device) | Model updates |
| Maturity / harvest readiness | Yes (on-device) | Sync history |
| Post-harvest grading | Yes (on-device) | Sync history |
| IoT / sensor monitoring | Cached locally (mode-dependent) | Live pull if cloud route |
| Profitability / ROI | Yes (local inputs) | Sync reports |
| Alerts & recommendations | Yes (knowledge-based local) | Updated content |
| Community (optional) | Draft offline | Publish/sync when online |
| Account & sync (optional) | — | Registration, backup, sync |

---

## 10. Machine Learning

- Developed separately with Python + PyTorch.
- Pipeline: training → evaluation → optimization → ONNX export → mobile model.
- Models: **disease/pest detection**, **maturity/harvest estimation**, **post-harvest grading**.
- Inference runs **on-device via ONNX** so predictions work offline.
- Model size/accuracy/speed/memory are balanced (quantization, compression).
- AI accuracy depends on the training dataset (see delimitations).

This is **Phase 3** (ML) and is planned separately.

---

## 11. IoT / Embedded (Raspberry Pi)

- Raspberry Pi runs the farm monitoring node with a **6-in-1 NPK/Moisture sensor**.
- Measures: soil moisture, nitrogen (N), phosphorus (P), potassium (K), electrical conductivity (EC), pH.
- Data flow to the mobile app is **undecided** (see hardware doc):
  - **Option A (offline-friendly):** Pi serves readings over the local network; mobile caches locally, syncs later.
  - **Option B (online):** Pi pushes readings to the backend; mobile pulls from the API.
- Full detail in `HARDWARE_IOT.md`.

---

## 12. Community Feature (Optional)

- Create posts, upload images, comment, react, filter by crop, report content.
- Requires a registered (synced) account.
- Content created offline is saved as a draft and becomes public only after sync.

---

## 13. Phased Build Order

Detailed in `ROADMAP.md`. Summary:

1. **Phase 1 — Mobile Foundation:** Expo app, navigation, basic UI, structure.
2. **Phase 2 — Local Data:** SQLite, local profile, farms, plants, records.
3. **Phase 3 — Machine Learning:** dataset, training, evaluation, ONNX, mobile inference (disease, maturity, grading).
4. **Phase 4 — IoT / Embedded:** Raspberry Pi + 6-in-1 sensor integration.
5. **Phase 5 — Backend:** FastAPI, auth, user/farm/plant/diagnosis APIs (optional sync/community).
6. **Phase 6 — Synchronization:** connectivity, sync queue, upload/download, retry, conflicts (optional).
7. **Phase 7 — Profitability & Reporting:** yield/ROI module.
8. **Phase 8 — Community (optional):** posts, images, comments, reactions, moderation.
9. **Phase 9 — Web Application (future):** Next.js client of the same API.

---

## 14. Summary

FarmSystem is a **mobile-first, offline-first Aloe vera (Aloe Barbadensis Miller) smart-farming platform** that enhances the previous PAMADA system with **IoT environmental sensing, post-harvest grading, and profitability analysis**, while retaining its AI-based image detection and maturity estimation — all running on-device so farmers can work without a reliable internet connection.

> **Local when offline. Intelligent on the device. Connected through the cloud.**

Community and cloud sync remain optional enhancements, never requirements for core use.
