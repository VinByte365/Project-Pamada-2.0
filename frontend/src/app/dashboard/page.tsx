"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppFrame, Stat } from "@/components/aloe-guard";
import {
  api,
  Farm,
  Plant,
  Diagnosis,
  SensorReading,
  ProfitReport,
  MaturityAssessment,
  ScanRecord,
  getToken,
} from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [role, setRole] = useState("grower");
  const [farms, setFarms] = useState<Farm[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [sensors, setSensors] = useState<SensorReading[]>([]);
  const [reports, setReports] = useState<ProfitReport[]>([]);
  const [maturity, setMaturity] = useState<MaturityAssessment[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          userData,
          farmsData,
          plantsData,
          diagData,
          sensorData,
          reportData,
          matData,
          scansData,
        ] = await Promise.all([
          api.auth.me().catch(() => null),
          api.farms.list().catch(() => []),
          api.plants.list().catch(() => []),
          api.diagnoses.list().catch(() => []),
          api.sensors.list().catch(() => []),
          api.reports.list().catch(() => []),
          api.maturity.list().catch(() => []),
          api.scans.list().catch(() => []),
        ]);

        if (!userData) {
          if (!getToken()) {
            router.push("/login");
            return;
          }
        } else {
          setName(userData.name || "Grower");
          setRole(userData.role || "grower");
        }

        setFarms(farmsData || []);
        setPlants(plantsData || []);
        setDiagnoses(diagData || []);
        setSensors(sensorData || []);
        setReports(reportData || []);
        setMaturity(matData || []);
        setScans(scansData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [router]);

  const healthyCount = diagnoses.filter(
    (d) => d.diagnosis === "Healthy" || d.severity === "None"
  ).length;

  const diseaseCount = diagnoses.filter(
    (d) => d.diagnosis !== "Healthy" && d.severity !== "None"
  ).length;

  const harvestReadyCount = maturity.filter((m) => m.ready_for_harvest).length;

  const healthRate = diagnoses.length
    ? Math.round((healthyCount / diagnoses.length) * 100)
    : plants.length
    ? 100
    : 0;

  const totalProfit = reports.reduce((sum, r) => sum + (Number(r.net_profit) || 0), 0);
  const latestSensor = sensors[0];

  return (
    <AppFrame active="Overview">
      <section className="workspace">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">FARMSYSTEM <span>·</span> OPERATIONAL DASHBOARD</p>
            <h1>{name ? `Welcome back, ${name}.` : "Cultivation Overview"}</h1>
            <p>
              Unified telemetry for Aloe Vera plant scans, disease pathologies, harvest maturity, and soil nutrition.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link href="/detect" className="primary-button">
              ✦ Scan Aloe Vera
            </Link>
            <Link href="/sensors" className="secondary-button">
              Log Soil NPK
            </Link>
          </div>
        </div>

        {error && (
          <div className="alert-banner error" role="alert">
            <span>{error}</span>
          </div>
        )}

        {/* Phase 4 Requirements: Real Database Statistics */}
        <div className="stats-grid plants-stats">
          <Stat
            icon="📸"
            label="Total Plant Scans"
            value={loading ? "—" : String(scans.length || diagnoses.length)}
            detail={`${scans.length} foliar image scans`}
          />
          <Stat
            icon="✓"
            label="Healthy Specimens"
            value={loading ? "—" : `${healthyCount} (${healthRate}%)`}
            detail="Foliar tissue optimal"
          />
          <Stat
            icon="⚠️"
            label="Detected Diseases"
            value={loading ? "—" : String(diseaseCount)}
            detail={`${diseaseCount} active alerts`}
          />
          <Stat
            icon="🌾"
            label="Harvest Readiness"
            value={loading ? "—" : `${harvestReadyCount} Ready`}
            detail={`${maturity.length} maturity evaluations`}
          />
          <Stat
            icon="NPK"
            label="Soil Telemetry"
            value={
              loading
                ? "—"
                : latestSensor
                ? `${latestSensor.nitrogen}-${latestSensor.phosphorus}-${latestSensor.potassium}`
                : "Active"
            }
            detail={latestSensor ? `Moisture: ${latestSensor.moisture || 35}%` : "Sensors connected"}
          />
        </div>

        {/* Quick Operations Strip */}
        <section className="monitor-actions">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">CORE MONITORING MODULES</p>
              <h2>Select Plant Monitoring Feature</h2>
            </div>
          </div>
          <div className="monitor-action-grid">
            <Link className="monitor-action" href="/detect">
              <span className="monitor-action-icon">✦</span>
              <span>
                <strong>AI Plant Scanner</strong>
                <small>Species verification &amp; pathology vision</small>
              </span>
              <b aria-hidden="true">→</b>
            </Link>
            <Link className="monitor-action" href="/diagnoses">
              <span className="monitor-action-icon">D</span>
              <span>
                <strong>Disease Detection</strong>
                <small>{diseaseCount} active issues · {diagnoses.length} logs</small>
              </span>
              <b aria-hidden="true">→</b>
            </Link>
            <Link className="monitor-action" href="/maturity">
              <span className="monitor-action-icon">M</span>
              <span>
                <strong>Harvest Maturity</strong>
                <small>{harvestReadyCount} harvest ready specimens</small>
              </span>
              <b aria-hidden="true">→</b>
            </Link>
            <Link className="monitor-action" href="/sensors">
              <span className="monitor-action-icon">S</span>
              <span>
                <strong>Soil &amp; NPK Monitoring</strong>
                <small>{sensors.length} sensor telemetry readings</small>
              </span>
              <b aria-hidden="true">→</b>
            </Link>
            <Link className="monitor-action" href="/recommendations">
              <span className="monitor-action-icon">♥</span>
              <span>
                <strong>Plant Care Guides</strong>
                <small>Actionable treatment &amp; soil protocols</small>
              </span>
              <b aria-hidden="true">→</b>
            </Link>
            <Link className="monitor-action" href="/history">
              <span className="monitor-action-icon">◷</span>
              <span>
                <strong>Scan History Archive</strong>
                <small>Review past image scans and reports</small>
              </span>
              <b aria-hidden="true">→</b>
            </Link>
          </div>
        </section>

        {/* Recent Scan History & Live Recommendations */}
        <div className="dashboard-grid">
          {/* Main Column: Recent Scans */}
          <section className="panel recent-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">VISUAL TELEMETRY</p>
                <h2>Recent Plant Scans</h2>
              </div>
              <Link className="text-link" href="/history">
                View all scans ({scans.length}) →
              </Link>
            </div>

            {loading ? (
              <div className="dashboard-empty">Retrieving scan records from database...</div>
            ) : scans.length === 0 ? (
              <div className="dashboard-empty">
                <span className="empty-illustration">🌿</span>
                <strong>No plant scans recorded yet.</strong>
                <p>Upload your first Aloe Vera photograph to run automated species verification and health analysis.</p>
                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  <Link href="/detect" className="primary-button">
                    Start New Scan
                  </Link>
                </div>
              </div>
            ) : (
              <div className="activity-list">
                {scans.slice(0, 5).map((scan) => {
                  const isHealthy = scan.diagnosis === "Healthy" || scan.severity === "None";

                  return (
                    <Link href={`/results?id=${scan.id}`} className="activity-row" key={scan.id}>
                      <span className="activity-thumb">
                        {scan.imageUrl ? (
                          <Image
                            src={scan.imageUrl}
                            alt={scan.plantName || "Scan"}
                            width={44}
                            height={44}
                            unoptimized
                          />
                        ) : (
                          <span>🌿</span>
                        )}
                      </span>
                      <span className="activity-main">
                        <strong>{scan.plantName || "Aloe Specimen"}</strong>
                        <small>
                          {scan.diseaseName || scan.diagnosis} · {scan.maturityStage || "Developing"}
                        </small>
                      </span>
                      <time>
                        {scan.createdAt ? new Date(scan.createdAt).toLocaleDateString() : "Recent"}
                      </time>
                      <span
                        className={`status-badge ${
                          isHealthy
                            ? "healthy"
                            : scan.severity === "Severe"
                            ? "attention"
                            : "pending"
                        }`}
                      >
                        {scan.diagnosis}
                      </span>
                      <span aria-hidden="true" className="row-chevron">
                        →
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Right Sidebar: Health Index & Recent Recommendations */}
          <aside className="panel health-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">AGRONOMIC ADVISORY</p>
                <h2>Care &amp; Mitigation</h2>
              </div>
              <Link href="/recommendations" className="text-link">
                All Guides →
              </Link>
            </div>

            {loading ? (
              <p className="subtle-text">Loading recommendations...</p>
            ) : (
              <>
                <div className="health-meter">
                  <span style={{ width: `${Math.max(5, healthRate)}%` }} />
                </div>
                <div className="health-meter-label">
                  <span>Healthy Specimen Ratio</span>
                  <strong>{healthRate}%</strong>
                </div>

                <div className="detail-divider" />

                {/* Priority recommendation alert */}
                {diseaseCount > 0 ? (
                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "12px", borderRadius: "6px", fontSize: "12px", color: "#92400e" }}>
                    <strong>Action Required: </strong>
                    Found {diseaseCount} specimen(s) with active pathology symptoms. Inspect leaf spots and reduce ambient humidity.
                  </div>
                ) : (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px", borderRadius: "6px", fontSize: "12px", color: "#166534" }}>
                    <strong>Crops in Good Health: </strong>
                    All evaluated specimens show uniform chlorophyll and firm succulent leaf margins.
                  </div>
                )}

                <div style={{ marginTop: "12px" }}>
                  <Link href="/sensors" className="model-callout">
                    <span className="sensor-icon">N</span>
                    <div>
                      <strong>Soil Telemetry Status</strong>
                      <p>
                        {latestSensor
                          ? `Node ${latestSensor.device_id || "01"} · pH ${latestSensor.ph || 6.8} · ${latestSensor.moisture || 35}% moisture`
                          : "No soil sensor logged"}
                      </p>
                    </div>
                    <span aria-hidden="true" style={{ marginLeft: "auto", color: "var(--leaf)" }}>
                      →
                    </span>
                  </Link>

                  <Link href="/maturity" className="model-callout" style={{ marginTop: "8px" }}>
                    <span className="sensor-icon">🌾</span>
                    <div>
                      <strong>Harvest Phenology</strong>
                      <p>{harvestReadyCount} plants ready for outer leaf cutting</p>
                    </div>
                    <span aria-hidden="true" style={{ marginLeft: "auto", color: "var(--leaf)" }}>
                      →
                    </span>
                  </Link>
                </div>
              </>
            )}
          </aside>
        </div>
      </section>
    </AppFrame>
  );
}
