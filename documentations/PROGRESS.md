# System Progress

**Project:** FarmSystem — "BUONG PAPEL": Integrated IoT and Machine Learning-Based System for Enhanced Aloe Vera Farming
**Current State:** Backend Phase 5 complete; mobile Phase 1 interactive foundation in progress
**Last Updated:** October 23, 2026

---

## Product Scope

- Covers Aloe barbadensis Miller cultivation records in a single field companion.
- Supports three field decisions: visible-leaf disease diagnosis, harvest maturity, and post-harvest grading.
- Operates offline by design; core record keeping does not require an account or connection.
- Exposes market and margin context without automating any physical farm action.
- Keeps cloud participation optional.

## Mobile Foundation (Phase 1 — In Progress)

- Provides five primary destinations: Home, Farms, Plants, Sensors, Settings.
- Uses a floating glass navigation dock with blur, translucency, a hairline border, an active capsule, responsive sizing, and a tinted fallback when blur is unavailable.
- Applies a Field Ledger visual identity: warm paper surfaces, ink typography, moss and persimmon accents, editorial rules, oversized headings, double-bezel cards, and asymmetric layouts.
- Uses a three-family type hierarchy with responsive display sizes.
- Home presents a direct scanner entry point, local-only status, a specimen plate, current field counts, and a Scan → Diagnose → Act field narrative.
- Farms presents an in-session registration draft and a current-session farm list without cloud persistence.
- Plants presents status counts, status filters, specimen states, and designed empty states.
- Provides a shared camera-first interface for diagnosis, maturity, and grading modes, including mode switching, framing guidance, an animated scan line, and capture feedback.
- Labels scan capture as preview-only; no image is stored or analyzed yet.
- Reports presents a designed empty state and an explicitly labeled sample report.
- Sensors presents node-pairing status, an inactive instrument panel, and clearly labeled preview readings.
- Community presents a draft field-note composer, disabled scan attachment, disabled publishing, and an optional-participation notice.
- Settings presents local identity creation, sync behavior toggles, scan retention, haptic preference, and accessible switch states.
- Creates a local identity without email, password, or connection; the identity is scoped to the current app session.
- Covers stack destinations for scan modes, reports, community, identity, and unknown routes.
- Provides accessible control roles and labels, visible keyboard focus states, and responsive layouts down to 320 px.
- Uses purposeful opacity and transform motion with consistent easing for entrances and everyday interactions.
- Includes designed empty, preview, and sample states that never present sample values as live data.

## Backend (Phase 5 — Complete)

- Supports JWT authentication for local-only and registered account states, including password hashing.
- Provides create, read, update, and delete capabilities for users, farms, plants, diagnoses, maturity assessments, gradings, sensor readings, profit reports, community posts, and comments.
- Persists synchronized records in the cloud.
- Provides synchronization endpoints between locally created records and the cloud.
- Returns structured JSON errors with consistent status codes.
- Allows cross-origin access for the mobile client and a future web client.
- Includes automated test coverage for backend behavior.

## Data State

- Cloud persistence is available for synchronized records.
- Mobile identity, farm drafts, community drafts, report previews, scan previews, and preference changes are session-scoped.
- Durable local storage, offline queues, conflict handling, and cached community content are not yet active.

## Capabilities Pending

- Durable offline storage for mobile records.
- On-device inference for diagnosis, maturity, and grading.
- Camera image capture and retention.
- Raspberry Pi sensor pairing and live readings.
- Mobile sync queue execution and conflict resolution.
- Profitability and return calculations.
- Community publishing, comments, and scan attachments.
- Web client.
- Automated deployment pipeline.

## Summary

- Backend Phase 5 is complete across authentication, record APIs, synchronization, and automated tests.
- The mobile client currently delivers a polished, responsive field interface with session-local interactions and explicit preview states.
- Remaining work is durable offline data, on-device intelligence, sensor integration, mobile synchronization, real reporting, community publishing, and the web client.
