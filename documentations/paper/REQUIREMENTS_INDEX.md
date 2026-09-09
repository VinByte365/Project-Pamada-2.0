# Requirements Index — BUONG PAPEL

> This folder keeps the **academic paper content separate** from the developer docs in `documentations/`.
> This file is the extracted index of system requirements from `BUONG PAPEL.docx`, cross-referenced to the developer documentation. The original paper document remains the authoritative source; this index summarizes it for engineering use.

**Paper title (topic):** Integrated IoT and Machine Learning-Based System for Enhanced Aloe Vera Farming (enhancement of the PAMADA system)
**Group:** Group 3, BSIT-NS-3A — Catuera, Dadivas, Elumba, Sacay
**Submitted to:** Prof. Julius Delfin A. Silang

---

## 1. Context

- Target crop: **Aloe vera (Aloe Barbadensis Miller)** — high-value medicinal plant.
- Previous **PAMADA** system: AI/computer-vision for disease detection & maturity estimation (image-only).
- This study **enhances PAMADA** by adding **IoT sensors, embedded processing, post-harvest grading, and profitability analysis** for end-to-end farm intelligence.

---

## 2. Core System Requirements (from paper)

### 2.1 AI / Image Analysis
- Detect diseases and pests visible on plant images (single-plant based), from a trained dataset.
- Estimate plant maturity / harvest readiness from visual features such as **leaf count** and structure.
- Operate on a **single-plant** basis for detection, maturity, and grading.

### 2.2 IoT / Environmental Monitoring
- Integrate a **6-in-1 NPK/Moisture sensor** measuring:
  - Soil moisture
  - Nitrogen (N)
  - Phosphorus (P)
  - Potassium (K)
  - Electrical conductivity (EC)
  - pH balance
- Monitor environmental conditions that affect plant health (soil, plus general environment).

### 2.3 Integrated Analysis
- **Combine soil sensor data** with image analysis to improve decision-making.

### 2.4 Post-Harvest Grading
- Automatically grade harvested aloe vera leaves based on external quality attributes:
  - Size
  - Shape
  - Visible surface quality
- Internal chemical composition / gel content / medicinal potency are **not** assessed.

### 2.5 Profitability Analysis
- Generate profitability reports and **return-on-investment (ROI)** estimates.
- Based on **user-provided inputs** and **current estimated market values**.

### 2.6 Embedded Deployment
- Deploy on an embedded platform (**Raspberry Pi**) for real-time processing.

### 2.7 Monitoring, Alerts, Recommendations, Reports
- Monitoring and analysis of plants/sensors.
- Alerts.
- **Knowledge-based preventive treatment recommendations** (predefined; does not replace professional consultation).
- Farm reports.
- Final farm management decisions remain with the user.

### 2.8 Platform
- **Web-based or app-based** access for user interaction.
- Internet requirement noted in paper (changed to offline-first per project decision — see `system_plan.md`).

---

## 3. Scope / Delimitation Summary (non-goals)

- Exclusively **Aloe Barbadensis Miller**; no other species or crops.
- Only externally visible diseases/pests are detected; no internal-disease detection.
- **No automatic actuation** (no auto irrigation, fertilization, pesticide spraying, or harvesting).
- AI accuracy depends entirely on the training dataset.
- No future market price prediction, supply chain, or automated marketing.
- Treatment recommendations are knowledge-based, not a professional-consultation substitute.
- Prototype is for small-scale testing, not large-scale commercial deployment.

---

## 4. Methodology (for reference)

- **Design:** developmental + experimental; iterative build; evaluation in a real farm environment.
- **Respondents:** aloe vera farmers, farm managers, agricultural operators; IT students/faculty.
- **Sampling:** purposive.
- **Instruments:** system prototype (sensors, camera, embedded device), questionnaire (usability/effectiveness/satisfaction), observation checklist (performance/response time/reliability), system data logs.

---

## 5. Mapping to Developer Docs

| Requirement | Developer Doc |
|-------------|---------------|
| Offline-first decision | `system_plan.md` §2, §5 |
| Mobile app platform | `FRONTEND_STRUCTURE.md` |
| ML (disease/maturity/grading) | `system_plan.md` §10, `FRONTEND_STRUCTURE.md` §5 |
| IoT / Raspberry Pi / sensor | `HARDWARE_IOT.md` |
| Backend / auth / sync | `BACKEND_STRUCTURE.md`, `SYNC_SPEC.md` |
| Profitability / ROI | `system_plan.md` §5.1, `FRONTEND_STRUCTURE.md` (reports) |
| Community (optional) | `system_plan.md` §12, `BACKEND_STRUCTURE.md` |
| Phases | `ROADMAP.md` |
