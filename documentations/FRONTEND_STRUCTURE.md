# Frontend Structure

**Stack:** Expo SDK 57 · React Native 0.86 · TypeScript · expo-router · zustand · React Query · axios
**Location:** `frontend/`
**Role:** Primary user-facing client — Aloe vera (Aloe Barbadensis Miller) smart-farming app.

---

## 1. Directory Layout

```
frontend/
├── app/                      # expo-router file-based routes
│   ├── _layout.tsx           # Root Stack layout (splash, fonts, ThemeProvider)
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Tab navigator definition
│   │   ├── index.tsx         # Home / dashboard tab
│   │   ├── farms.tsx         # Farms tab
│   │   ├── plants.tsx        # Plants (single-plant records) tab
│   │   ├── sensors.tsx       # IoT / environmental monitoring tab
│   │   └── settings.tsx      # Settings / profile / sync tab
│   ├── scan/                 # ML scanning flows (stack or modal)
│   │   ├── diagnosis.tsx     # Disease & pest detection
│   │   ├── maturity.tsx      # Harvest readiness / maturity
│   │   └── grading.tsx       # Post-harvest grading
│   ├── reports/              # Profitability / ROI reports
│   ├── community/            # Optional community module
│   ├── +html.tsx             # Web HTML shell
│   ├── +not-found.tsx        # 404 fallback
│   └── modal.tsx
├── components/               # Reusable UI components
│   └── useColorScheme.ts     # Theme color-scheme hook (scaffold)
├── constants/                # Static constants (e.g. Colors.ts, units, tags)
├── hooks/                    # Shared React hooks
├── lib/                      # Non-UI logic: api client, ml, storage, sync
│   ├── api/                  # axios client & typed API functions
│   ├── ml/                   # ONNX inference wrapper (Phase 3)
│   ├── db/                   # SQLite access (Phase 2)
│   └── sync/                 # Sync queue & connectivity (Phase 6, optional)
├── stores/                   # zustand stores (client/UI state)
├── assets/                   # Fonts, images
├── app.json
├── package.json
├── tsconfig.json
└── AGENTS.md                 # Expo v57 docs note (read before coding)
```

> The default two-tab scaffold will be reorganized into this structure. Routes are added as expo-router files under `app/`; a file's path **is** its route.

---

## 2. State & Data Management Rule

| Concern | Tool |
|---------|------|
| Local / transient client state (UI, device, scan-in-progress, drafts, offline queue) | **zustand** |
| Server / synchronized data (farms, plants, diagnoses, sensor data from backend) | **React Query** |
| HTTP transport to the FastAPI backend | **axios** |

- **React Query** owns data that ultimately lives on the backend (when online).
- **zustand** owns ephemeral app state (active profile, connectivity status, current scan).
- Local records that exist **only on-device** (SQLite) are read directly from `lib/db`; React Query is used for the online/synced view.

---

## 3. Navigation

- expo-router **file-based routing**.
- Root `app/_layout.tsx` renders a `Stack` with `(tabs)` as the initial route.
- `(tabs)/_layout.tsx` defines the tab bar.
- Scanning flows (`scan/`) and reports are pushed as stack/modal screens above the tabs.
- Optional modules (community) are added as routes but do not block core use.

---

## 4. Core Tabs (base set; expand later)

| Tab | Route | Purpose |
|-----|-------|---------|
| Home | `app/(tabs)/index.tsx` | Dashboard: summary, alerts, quick actions |
| Farms | `app/(tabs)/farms.tsx` | Farm records list + add/manage |
| Plants | `app/(tabs)/plants.tsx` | Individual plant records + scan entry |
| Sensors | `app/(tabs)/sensors.tsx` | IoT / environmental readings dashboard |
| Settings | `app/(tabs)/settings.tsx` | Profile, account status, sync, preferences |

> The concrete screen sub-structure is not final; these are the base tabs. Sub-screens expand as features are defined.

---

## 5. ML Scanning Flows (Phase 3)

- `scan/diagnosis.tsx` — capture single-plant photo → ONNX inference → disease/pest result.
- `scan/maturity.tsx` — capture photo → maturity / harvest-readiness estimate.
- `scan/grading.tsx` — capture harvested leaf photo → post-harvest grade.
- Models run **on-device via ONNX** so scanning works offline. Results saved to SQLite.

---

## 6. API Client (Phase 5+)

`lib/api/` holds a typed axios client pointing at the FastAPI backend, plus typed functions per resource and per sync operation. HTTP base URL comes from environment config (see `PROJECT_STRUCTURE.md` secrets rule).

---

## 7. Offline-First Data Layer (Phase 2)

`lib/db/` wraps SQLite for local persistence; `lib/sync/` drives the sync queue defined in `SYNC_SPEC.md`.

- Writes go to **SQLite first**.
- Synchronization pushes queued records to FastAPI when connectivity exists (optional).
- The UI always renders from local data; network is layered on top.
