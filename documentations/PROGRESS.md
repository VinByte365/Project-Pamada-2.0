# System Progress

**Project:** FarmSystem — "BUONG PAPEL": Integrated IoT and Machine Learning-Based System for Enhanced Aloe Vera Farming
**Current Phase:** Phase 5 — Backend (complete), Phase 1 — Mobile Foundation (in progress)
**Last Updated:** October 8, 2026

---

## Planning & Documentation

- Extracted requirements from the BUONG PAPEL academic paper, including scope, delimitations, methodology, and a mapping to engineering docs.
- Authored the full engineering documentation suite: master system plan, 9-phase roadmap, project/frontend/backend structure specs, hardware/IoT spec, and sync specification.
- Defined scope & delimitations: Aloe Barbadensis only, externally visible disease only, no automated actuation.
- Recorded key architectural decision: **offline-first** (deviates from the paper's internet-required design).

## Repository & Conventions

- Single git repository established with a clean, versioned history.
- Set coding conventions: TypeScript strict mode, PEP 8 for Python, component/naming rules.
- Set secrets and configuration policy (env-based config, no committed secrets).

## Mobile Foundation (Phase 1)

- Built with Expo SDK 57 + React Native + TypeScript.
- Full navigation with 5 tabs: Home, Farms, Plants, Sensors, Settings.
- Feature screens: leaf diagnosis scan, maturity scan, post-harvest grading scan, reports, and community.
- Custom glassmorphic floating tab bar with SF Symbol icons.
- Root setup: custom font loading, splash screen control, React Query data fetching, smooth fade transitions.
- Complete design system:
  - Dark-first color palette (OLED black with emerald/violet accents) plus light/dark themes
  - Typography scale using CabinetGrotesk, Satoshi, and SpaceMono
  - Consistent spacing and radius tokens
- Reusable UI components: entrance animations, section eyebrows, screen shells, stub screens, themed text, theme hooks.
- Animated Home dashboard: hero with CTAs, module stat cards (plants, farms, sensors, reports, sync), 3-step procedure (Scan → Diagnose → Act), scroll-reveal/scrub animations, glassmorphic cards, footer.
- State management: local profile and account status (`local_only` / `synced`) via zustand.
- API client configured with an environment-based base URL.
- Offline-identity modal — first working interactive feature (creates a local profile ID).
- Placeholder screens covering all planned features: farms, plants, sensors, settings, diagnosis, maturity, grading, reports, community.
- Prepared scaffolding for the local database, ML inference, and sync layers.

## Backend (Phase 5 — Complete)

- Built with FastAPI, uvicorn, Pydantic v2, and async MongoDB (motor).
- Environment-driven configuration via `.env`; secrets never committed.
- Async MongoDB connection and shared dependencies (auth, DB session).
- Layered architecture separating routers, services, document models, and API schemas.
- MongoDB document models for: users, farms, plants, diagnoses, maturity, gradings, sensor readings, profit reports, community posts, and comments.
- Authentication: backend-issued JWT supporting local-only and registered (synced) user states, with password hashing and current-user dependency injection.
- Full REST API covering auth, users, farms, plants, diagnoses, gradings, sensors, reports, community, and sync.
- Business logic (auth, sync) separated from HTTP concerns.
- Structured JSON errors, consistent status codes, and CORS for the mobile and future web clients.
- Automated test suite (pytest).

## Database

- Local SQLite schema specified (11 tables): local profile, farms, plants, diagnoses, maturity assessments, gradings, sensor readings, profit reports, community drafts, sync queue, cached posts — **not yet implemented** (Phase 2).
- MongoDB (10 collections) implemented in the backend as the source of truth for synchronized data.

## Not Yet Started

- Phase 2 — SQLite local persistence
- Phase 3 — ML training, ONNX conversion, on-device inference
- Phase 4 — Raspberry Pi + 6-in-1 sensor integration (data-flow Option A vs. B undecided)
- Phase 6 — Sync queue and conflict resolution
- Phase 7 — Profitability/ROI reporting logic
- Phase 8 — Community module
- Phase 9 — Web client
- CI/CD and deployment configuration

---

## Summary

Planning and documentation are mature and complete, and the backend is done (auth, CRUD endpoints, sync endpoints, tests). Mobile work currently consists of a polished, animated UI shell with one working interaction (local profile creation). Remaining: SQLite persistence, ML on-device inference, IoT hardware integration, sync, reporting, community, and the web client.
