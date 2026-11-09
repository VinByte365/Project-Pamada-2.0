# Synchronization Spec

**Intended for Phase 6 (optional layer).** This document specifies how local SQLite data synchronizes with the FastAPI backend + MongoDB when connectivity is available.

---

## 1. Goal

The system is **offline-first**: all writes happen locally at any time. When connectivity is available, individual records synchronize **between local SQLite and the central MongoDB** — not whole-database uploads. Synchronization is an **optional enhancement**, never a requirement for core use (consistent with `system_plan.md`).

---

## 2. Local Tables Involved

- `sync_queue` — operations waiting to be pushed to the server.
- All data tables (`farms`, `plants`, `diagnoses`, `maturity_assessments`, `gradings`, `sensor_readings`, `profit_reports`, `community_drafts`, ...) carry sync metadata (e.g. `server_id`, `last_synced`, `deleted_at`).

---

## 3. Sync Queue

Each pending operation is a row in `sync_queue`:

```json
{
  "recordId": 123,
  "entity": "diagnosis",
  "operation": "create",       // create | update | delete
  "status": "pending",         // pending | synced | failed
  "retryCount": 0,
  "payload": { },              // serialized record for the server
  "createdAt": "..."
}
```

### States

```
PENDING
   │
   ▼
Attempt synchronization
   │
   ├── Success ──► SYNCED
   │
   └── Failure ──► FAILED (or back to PENDING for retry)
```

- Failed operations remain queued and retry on the next sync attempt.
- `retryCount` caps repeated failures and routes them to a review/conflict path.

---

## 4. Connectivity Detection

- The app monitors connectivity (Expo `NetInfo` or equivalent).
- Connectivity changes trigger sync attempts:
  - **Online reached** → run sync.
  - **Offline** → operations keep writing to SQLite + `sync_queue` but are not pushed. Core features never block on network.

---

## 5. Upload Flow

```
Internet Detected
        │
        ▼
Read pending sync_queue rows
        │
        ▼
Call /sync/* endpoints (batch or per-entity)
        │
        ▼
FastAPI validates + writes to MongoDB
        │
        ▼
Server confirms (returns server ids / version)
        │
        ▼
Mark local record SYNCED + store server_id
```

### Dependencies
- A registered (synced) user may be required for some entities (especially community). If not registered, those uploads remain queued until the account is created.

---

## 6. Download Flow

```
MongoDB changes
        │
        ▼
FastAPI /sync endpoint (since a version/timestamp)
        │
        ▼
Mobile application
        │
        ▼
Apply changes to local SQLite
```

Download pulls server-side changes (e.g. community posts, other users' data) since the last sync point.

---

## 7. Conflict Handling

- Strategy to be finalized in Phase 6; current intent:
  - **Last-write-wins** by `updatedAt` as the default.
  - Detect conflicting edits (same record changed locally and on server).
  - Failed/conflicting operations surface for review rather than silently dropping data.
- `deleted` records: local delete is queued as `operation: "delete"`; server-side deletes propagate via download using tombstones where needed.

---

## 8. Open Items (resolve in Phase 6)

- Exact `/sync` endpoint shapes (batch vs per-entity) and payload contracts.
- Conflict resolution UI/behavior defaults.
- Idempotency keys on the server for safe retries.
- How ML images transfer (base64 vs object storage) and their sync metadata.
- Whether sensor readings sync up (Option B in `HARDWARE_IOT.md`) or only down.
