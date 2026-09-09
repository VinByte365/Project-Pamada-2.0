# Hardware & IoT (Raspberry Pi)

**Planned for Phase 4.** This document defines the embedded farm-monitoring node and the 6-in-1 NPK/Moisture sensor integration.

---

## 1. Overview

The system adds **environmental monitoring** to the on-device AI analysis. A **Raspberry Pi** runs the farm-monitoring node and reads a **6-in-1 NPK/Moisture sensor** that measures:

- Soil **moisture**
- **Nitrogen (N)**
- **Phosphorus (P)**
- **Potassium (K)**
- **Electrical conductivity (EC)**
- **pH balance**

This data complements image-based analysis for more informed decision-making, in line with the study's objective to combine soil sensor data and image analysis.

---

## 2. Components

| Component | Role |
|-----------|------|
| Raspberry Pi | Embedded node; reads sensor, performs real-time processing |
| 6-in-1 NPK/Moisture sensor | Measures moisture, N, P, K, EC, pH |
| (optional) power/enclosure | On-farm deployment |

This is a **monitoring-only** system. The paper's delimitation states **no automatic actuation** — no automatic irrigation, fertilization, pesticide spraying, or harvesting.

---

## 3. Data Flow (OPEN DECISION)

Two modes are documented; the routing to the mobile app is **undecided** and finalized in Phase 4.

### Option A — Pi → Local network → Mobile (offline-friendly)
```
Raspberry Pi (sensor)
        │  reads + serves readings over local network
        ▼
Farmer's mobile app (same network / cached locally)
        │
        ▼
SQLite (cached)  ──sync when online──►  backend
```
- Works without internet when the mobile app is on the farm's local network.
- Readings cached in SQLite and synced later.

### Option B — Pi → Cloud → Mobile (online-dependent sensing)
```
Raspberry Pi (sensor)
        │  pushes to backend over internet
        ▼
FastAPI backend
        │
        ▼
MongoDB
        │
        ▼
Mobile app pulls readings via API
```
- Sensing depends on internet, but the rest of the app remains offline-capable.

> The docs keep both options open (per project alignment). Recommend evaluating Option A to preserve offline-first behavior.

---

## 4. Real-Time Processing

The Raspberry Pi may perform low-level sensor processing (reading, filtering, formatting) locally before sending data onward. Heavy ML (disease/maturity/grading) runs **on the mobile device** per `system_plan.md` §10.

---

## 5. Repo Location

Future code lives under `hardware/`. Language: Python (PEP 8), consistent with backend/ML conventions (see `PROJECT_STRUCTURE.md`).

---

## 6. Open Items (resolve in Phase 4)

- Actual data routing (Option A vs B, or hybrid).
- Sensor communication protocol (I2C/Serial) and reading cadence.
- Local network discovery between Pi and mobile app (if Option A).
- Data format/schema for sensor readings shared with the backend and app.
