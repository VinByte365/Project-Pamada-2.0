"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppFrame } from "@/components/aloe-guard";
import { api, Plant, Farm, Diagnosis, MaturityAssessment, Grading } from "@/lib/api";

export default function PlantDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [plant, setPlant] = useState<Plant | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [maturity, setMaturity] = useState<MaturityAssessment[]>([]);
  const [gradings, setGradings] = useState<Grading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");

  useEffect(() => {
    if (!id) return;

    const loadDetails = async () => {
      try {
        setLoading(true);
        setError("");

        let currentPlant: Plant | null = null;
        try {
          currentPlant = await api.plants.get(id);
        } catch {
          // Fallback if accessed via older scan ID
          const scanRes = await fetch("/api/scans");
          if (scanRes.ok) {
            const scanData = await scanRes.json();
            const found = (scanData.scans || []).find((s: { id: string }) => s.id === id);
            if (found) {
              currentPlant = {
                id: found.id,
                name: found.plantName || `Plant ${found.id.slice(-6)}`,
                variety: "Aloe Barbadensis Miller",
                stage: "Vegetative",
                health_status: found.diagnosis || "Healthy",
                notes: (found.recommendations || []).join(", "),
                image_url: found.imageUrl,
                created_at: found.createdAt,
              };
            }
          }
        }

        if (!currentPlant) {
          throw new Error("This plant record could not be found in the database.");
        }

        setPlant(currentPlant);

        // Load farm if assigned
        if (currentPlant.farm_id) {
          try {
            const farmData = await api.farms.get(currentPlant.farm_id);
            setFarm(farmData);
          } catch {
            // Farm may have been deleted or unassigned
          }
        }

        // Load associated diagnoses, maturity, and gradings
        const [diagList, matList, gradeList] = await Promise.all([
          api.diagnoses.list({ plant_id: id }).catch(() => []),
          api.maturity.list({ plant_id: id }).catch(() => []),
          api.gradings.list({ plant_id: id }).catch(() => []),
        ]);

        setDiagnoses(diagList || []);
        setMaturity(matList || []);
        setGradings(gradeList || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load plant details.");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [id, router]);

  const handleDeletePlant = async () => {
    if (!plant || !confirm(`Are you sure you want to delete ${plant.name}?`)) return;
    try {
      await api.plants.delete(plant.id);
      router.push("/plants");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete plant.");
    }
  };

  return (
    <AppFrame active="Plants">
      <section className="workspace">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">FARMSYSTEM <span>·</span> SPECIMEN PROFILE</p>
            <h1>{plant?.name || "Plant Details"}</h1>
            <p>Comprehensive growth lifecycle, health assessments, quality inspection, and farm assignment.</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link href="/plants" className="secondary-button">
              ← Back to Inventory
            </Link>
            <button className="danger-button" onClick={handleDeletePlant} type="button">
              Delete Specimen
            </button>
          </div>
        </div>

        {notification && (
          <div className="alert-banner success" role="status">
            <span>{notification}</span>
            <button className="text-button" onClick={() => setNotification("")} type="button">✕</button>
          </div>
        )}

        {error && (
          <div className="alert-banner error" role="alert">
            <span>{error}</span>
            <button className="text-button" onClick={() => setError("")} type="button">✕</button>
          </div>
        )}

        {loading ? (
          <div className="panel dashboard-empty">Retrieving plant history and telemetry from backend...</div>
        ) : plant && (
          <div className="details-grid">
            {/* Visual Panel */}
            <section className="panel details-photo">
              {plant.image_url ? (
                <Image
                  src={plant.image_url}
                  alt={plant.name}
                  width={800}
                  height={600}
                  unoptimized
                />
              ) : (
                <div className="image-empty">
                  <span>✿</span>
                  <span>No photo recorded</span>
                </div>
              )}
              <div className="details-photo-caption">
                <span className="eyebrow">IMAGE RECORD</span>
                <p>Saved photograph linked to plant ID {plant.id}</p>
              </div>
            </section>

            {/* Specimen Info Panel */}
            <section className="panel details-info">
              <span
                className={`status-badge ${
                  plant.health_status === "Healthy"
                    ? "healthy"
                    : plant.health_status === "Attention"
                    ? "attention"
                    : "pending"
                }`}
              >
                {plant.health_status || "Healthy"}
              </span>

              <h2>{plant.name}</h2>
              <p className="subtle-text">
                Recorded {plant.created_at ? new Date(plant.created_at).toLocaleString() : "Recently"}
              </p>

              <div className="detail-divider" />

              <h3>Botanical Profile &amp; Location</h3>
              <p>
                <strong>Cultivar:</strong> {plant.variety || "Aloe Barbadensis Miller"}<br />
                <strong>Assigned Plot:</strong> {farm ? `${farm.name} (${farm.location || "Plot"})` : "No farm assigned"}<br />
                <strong>Soil Type:</strong> {farm?.soil_type || "Standard Sandy Loam"}<br />
                <strong>Growth Stage:</strong> {plant.stage || "Vegetative"}<br />
                <strong>Date Planted:</strong> {plant.planted_date ? new Date(plant.planted_date).toLocaleDateString() : "—"}
              </p>

              <div className="detail-divider" />

              <h3>Grower Notes</h3>
              <p>{plant.notes || "No additional grower notes provided for this specimen."}</p>

              <div className="detail-divider" />

              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <Link href="/diagnoses" className="secondary-button" style={{ fontSize: "11px" }}>
                  ＋ Add Health Diagnosis
                </Link>
                <Link href="/maturity" className="secondary-button" style={{ fontSize: "11px" }}>
                  ＋ Evaluate Maturity
                </Link>
                <Link href="/gradings" className="secondary-button" style={{ fontSize: "11px" }}>
                  ＋ Quality Grading
                </Link>
              </div>
            </section>
          </div>
        )}

        {/* Associated Health Diagnoses */}
        {!loading && plant && (
          <div style={{ display: "grid", gap: "20px", marginTop: "24px" }}>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">HEALTH HISTORY</p>
                  <h2>Disease &amp; Health Diagnoses ({diagnoses.length})</h2>
                </div>
                <Link href="/diagnoses" className="text-link">Manage Diagnoses →</Link>
              </div>
              {diagnoses.length === 0 ? (
                <p className="subtle-text" style={{ margin: "14px 0" }}>
                  No diagnoses logged for this specimen yet.
                </p>
              ) : (
                <div className="data-table-container" style={{ marginTop: "14px" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Diagnosis Result</th>
                        <th>Severity</th>
                        <th>Confidence</th>
                        <th>Symptoms Observed</th>
                        <th>Treatment Advice</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diagnoses.map((d) => (
                        <tr key={d.id}>
                          <td>
                            <strong>{d.diagnosis}</strong>
                            <span style={{ display: "block", fontSize: "10px", color: "var(--muted)" }}>
                              {d.confidence ? `AI Vision Inspection (${d.confidence}%)` : "Manual Agronomic Observation"}
                            </span>
                          </td>
                          <td>
                            <span className={`tag-pill ${d.severity === "Severe" ? "danger" : d.severity === "Moderate" ? "warning" : "success"}`}>
                              {d.severity || "None"}
                            </span>
                          </td>
                          <td>{d.confidence ? `${d.confidence}%` : "Manual"}</td>
                          <td>{d.symptoms || "—"}</td>
                          <td>{Array.isArray(d.recommendations) ? d.recommendations.join(", ") : d.recommendations || "—"}</td>
                          <td>{d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Associated Maturity & Quality Gradings */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">HARVEST READINESS</p>
                    <h2>Maturity Assessments ({maturity.length})</h2>
                  </div>
                  <Link href="/maturity" className="text-link">All Assessments →</Link>
                </div>
                {maturity.length === 0 ? (
                  <p className="subtle-text" style={{ margin: "14px 0" }}>
                    No maturity records logged for this specimen.
                  </p>
                ) : (
                  <div className="data-table-container" style={{ marginTop: "14px" }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Stage</th>
                          <th>Leaves</th>
                          <th>Thickness</th>
                          <th>Readiness</th>
                        </tr>
                      </thead>
                      <tbody>
                        {maturity.map((m) => (
                          <tr key={m.id}>
                            <td><strong>{m.stage}</strong></td>
                            <td>{m.leaf_count || "—"}</td>
                            <td>{m.leaf_thickness_mm ? `${m.leaf_thickness_mm} mm` : "—"}</td>
                            <td>
                              <span className={`status-badge ${m.ready_for_harvest ? "healthy" : "attention"}`}>
                                {m.ready_for_harvest ? "Ready" : "Growing"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">QUALITY CONTROL</p>
                    <h2>Grading Inspections ({gradings.length})</h2>
                  </div>
                  <Link href="/gradings" className="text-link">All Gradings →</Link>
                </div>
                {gradings.length === 0 ? (
                  <p className="subtle-text" style={{ margin: "14px 0" }}>
                    No quality gradings recorded for this specimen.
                  </p>
                ) : (
                  <div className="data-table-container" style={{ marginTop: "14px" }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Grade</th>
                          <th>Score</th>
                          <th>Defects</th>
                          <th>Inspector</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gradings.map((g) => (
                          <tr key={g.id}>
                            <td><strong>{g.grade}</strong></td>
                            <td>{g.quality_score ? `${g.quality_score}/100` : "—"}</td>
                            <td>{g.defect_rate !== undefined ? `${g.defect_rate}%` : "—"}</td>
                            <td>{g.inspector || "Self"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </section>
    </AppFrame>
  );
}
