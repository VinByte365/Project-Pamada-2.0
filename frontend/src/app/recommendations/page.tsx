"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppFrame } from "@/components/aloe-guard";
import { api, Diagnosis, DiseaseDetectionResult, ScanRecord, SensorReading } from "@/lib/api";

type CategoryFilter = "all" | "diseases" | "soil" | "harvest";

export default function RecommendationsPage() {
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [sensors, setSensors] = useState<SensorReading[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [diseaseCatalog, setDiseaseCatalog] = useState<Record<string, DiseaseDetectionResult>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const [diagData, sensorData, scansData, catalogData] = await Promise.all([
          api.diagnoses.list().catch(() => []),
          api.sensors.list().catch(() => []),
          api.scans.list().catch(() => []),
          api.vision.diseases().catch(() => ({ diseases: {} })),
        ]);
        setDiagnoses(diagData || []);
        setSensors(sensorData || []);
        setScans(scansData || []);
        setDiseaseCatalog(catalogData.diseases || {});
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load care recommendations.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter diagnoses that have active concerns
  const activeIssues = diagnoses.filter(
    (d) => d.diagnosis !== "Healthy" && d.severity !== "None"
  );

  const latestSensor = sensors[0];
  const lowNutrients = latestSensor
    ? Number(latestSensor.nitrogen) < 20 ||
      Number(latestSensor.potassium) < 150 ||
      Number(latestSensor.moisture) > 50
    : false;

  const harvestReadyScans = scans.filter((s) => s.readyForHarvest);

  return (
    <AppFrame active="Care guides">
      <section className="workspace">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">FARMSYSTEM <span>·</span> ACTIONABLE BOTANICAL CARE</p>
            <h1>Care &amp; Mitigation Protocols</h1>
            <p>
              Targeted treatments and agronomic mitigation guidelines derived from your live specimen scans and soil telemetry.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link href="/detect" className="primary-button">
              ＋ Scan Plant
            </Link>
            <Link href="/sensors" className="secondary-button">
              Soil Telemetry
            </Link>
          </div>
        </div>

        {error && (
          <div className="alert-banner error" role="alert">
            <span>{error}</span>
          </div>
        )}

        {/* Priority Alerts for Active Issues in User's Crops */}
        {activeIssues.length > 0 && (
          <div
            className="panel"
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              padding: "18px 22px",
              borderRadius: "8px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span style={{ fontSize: "20px" }}>⚠️</span>
              <h3 style={{ margin: 0, color: "#92400e", fontSize: "16px" }}>
                Active Attention Required ({activeIssues.length} specimen alerts)
              </h3>
            </div>
            <p style={{ margin: "4px 0 12px", fontSize: "13px", color: "#78350f" }}>
              Your recent plant scans detected conditions that require cultural mitigation to prevent spread across your farm plots.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {activeIssues.map((issue) => (
                <div
                  key={issue.id}
                  style={{
                    background: "#fff",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #fcd34d",
                    fontSize: "12px",
                  }}
                >
                  <strong>{issue.plant_name || "Specimen"}</strong>:{" "}
                  <span style={{ color: "#b45309", fontWeight: 600 }}>{issue.diagnosis}</span> (Severity: {issue.severity})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter Pills */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          <button
            type="button"
            className={`secondary-button ${filter === "all" ? "primary-button" : ""}`}
            onClick={() => setFilter("all")}
            style={{ fontSize: "12px", padding: "6px 14px" }}
          >
            All Protocols
          </button>
          <button
            type="button"
            className={`secondary-button ${filter === "diseases" ? "primary-button" : ""}`}
            onClick={() => setFilter("diseases")}
            style={{ fontSize: "12px", padding: "6px 14px" }}
          >
            Pathologies &amp; Pests ({Object.keys(diseaseCatalog).length || 9})
          </button>
          <button
            type="button"
            className={`secondary-button ${filter === "soil" ? "primary-button" : ""}`}
            onClick={() => setFilter("soil")}
            style={{ fontSize: "12px", padding: "6px 14px" }}
          >
            Soil &amp; NPK Nutrition
          </button>
          <button
            type="button"
            className={`secondary-button ${filter === "harvest" ? "primary-button" : ""}`}
            onClick={() => setFilter("harvest")}
            style={{ fontSize: "12px", padding: "6px 14px" }}
          >
            Harvest Guidance ({harvestReadyScans.length} ready)
          </button>
        </div>

        {/* Section 1: Pathology Treatment Protocols */}
        {(filter === "all" || filter === "diseases") && (
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "18px", color: "var(--forest)", marginBottom: "14px" }}>
              Disease Identification &amp; Treatment Catalog
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "20px" }}>
              {Object.entries(diseaseCatalog).map(([key, info]) => {
                if (key === "Healthy") return null;
                const isPresentInScans = activeIssues.some((a) => a.diagnosis === key);

                return (
                  <div
                    key={key}
                    className="panel"
                    style={{
                      padding: "20px",
                      borderRadius: "8px",
                      border: isPresentInScans ? "2px solid #f59e0b" : "1px solid #e2e8df",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: "var(--forest)" }}>
                        {info.name}
                      </h3>
                      <span className={`status-badge ${info.severity === "Severe" ? "attention" : "pending"}`}>
                        Severity: {info.severity}
                      </span>
                    </div>

                    <p style={{ fontSize: "12px", color: "#4b5563", lineHeight: 1.5, margin: "6px 0 12px" }}>
                      {info.description}
                    </p>

                    <div style={{ background: "#f8faf7", padding: "12px", borderRadius: "6px", margin: "10px 0" }}>
                      <strong style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--forest)", display: "block", marginBottom: "6px" }}>
                        Immediate Action Protocol:
                      </strong>
                      <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "#2d3748", lineHeight: 1.5 }}>
                        {info.treatments?.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "8px" }}>
                      <strong>Agronomic Prevention: </strong>
                      {info.prevention?.join("; ")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2: Soil & NPK Nutrition Protocols */}
        {(filter === "all" || filter === "soil") && (
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "18px", color: "var(--forest)", marginBottom: "14px" }}>
              Soil &amp; NPK Nutrient Management
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div className="panel" style={{ padding: "20px", borderRadius: "8px" }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "16px", color: "var(--forest)" }}>
                  Nitrogen (N) Guidance
                </h3>
                <p style={{ fontSize: "12px", color: "#4b5563", lineHeight: 1.5 }}>
                  Aloe Vera requires modest nitrogen (20–50 mg/kg). Excessive nitrogen creates soft, water-bloated foliage vulnerable to Bacterial Soft Rot and Mealy Bugs.
                </p>
                <div style={{ background: "#f8faf7", padding: "10px 14px", borderRadius: "6px", marginTop: "10px", fontSize: "12px" }}>
                  <strong>Optimal Range: </strong> 20 – 50 mg/kg · Use organic compost tea or light fish emulsion once in early spring.
                </div>
              </div>

              <div className="panel" style={{ padding: "20px", borderRadius: "8px" }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "16px", color: "var(--forest)" }}>
                  Potassium (K) &amp; Gel Density
                </h3>
                <p style={{ fontSize: "12px", color: "#4b5563", lineHeight: 1.5 }}>
                  Potassium directly regulates osmotic pressure and thickens the parenchymal gel core. It strengthens epidermal cell walls against fungal penetration.
                </p>
                <div style={{ background: "#f8faf7", padding: "10px 14px", borderRadius: "6px", marginTop: "10px", fontSize: "12px" }}>
                  <strong>Optimal Range: </strong> 150 – 300 mg/kg · Top-dress with kelp meal or sulfate of potash every 4 months.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Harvest Guidance */}
        {(filter === "all" || filter === "harvest") && (
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "18px", color: "var(--forest)", marginBottom: "14px" }}>
              Harvesting &amp; Post-Harvest Best Practices
            </h2>
            <div className="panel" style={{ padding: "22px", borderRadius: "8px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div>
                  <h4 style={{ margin: "0 0 8px", color: "var(--forest)", fontSize: "14px" }}>
                    Standard Harvesting Protocol
                  </h4>
                  <ol style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#374151", lineHeight: 1.7 }}>
                    <li>Select the outermost, lowest 3 to 4 leaves that are at least 14 mm thick at the base.</li>
                    <li>Sterilize a sharp utility knife with 70% isopropyl alcohol.</li>
                    <li>Make a shallow incision at the base of the leaf near the main stem; gently twist and pull clean.</li>
                    <li>Avoid slicing into adjacent inner leaves or damaging the central crown.</li>
                  </ol>
                </div>

                <div>
                  <h4 style={{ margin: "0 0 8px", color: "var(--forest)", fontSize: "14px" }}>
                    Aloin Draining &amp; Gel Storage
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#374151", lineHeight: 1.7 }}>
                    <li>Place freshly cut leaves upright in a beaker for 15 minutes to allow yellow bitter aloin resin to drain out.</li>
                    <li>Rinse cut leaf with clean water before filleting the clear inner aloe gel parenchyma.</li>
                    <li>Store fresh gel in an airtight glass container refrigerated at 4°C for up to 7 days, or freeze in cubes.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </AppFrame>
  );
}

