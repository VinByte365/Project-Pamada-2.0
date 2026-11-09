"use client";

import { useEffect, useMemo, useState } from "react";
import { AppFrame, Stat } from "@/components/aloe-guard";
import { api, SensorReading, Farm } from "@/lib/api";

export default function SensorsPage() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [farmFilter, setFarmFilter] = useState("all");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<SensorReading | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    device_id: "NPK-NODE-01",
    farm_id: "",
    nitrogen: 32,
    phosphorus: 24,
    potassium: 210,
    moisture: 35,
    temperature: 27.5,
    ph: 6.8,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [readingsData, farmsData] = await Promise.all([
        api.sensors.list(),
        api.farms.list(),
      ]);
      setReadings(readingsData || []);
      setFarms(farmsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sensor readings from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingReading(null);
    setFormData({
      device_id: `NPK-PROBE-${String(readings.length + 1).padStart(2, "0")}`,
      farm_id: farms[0]?.id || "",
      nitrogen: 32,
      phosphorus: 24,
      potassium: 210,
      moisture: 35,
      temperature: 27.5,
      ph: 6.8,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (reading: SensorReading) => {
    setEditingReading(reading);
    setFormData({
      device_id: reading.device_id || "NPK-NODE",
      farm_id: reading.farm_id || "",
      nitrogen: Number(reading.nitrogen) || 0,
      phosphorus: Number(reading.phosphorus) || 0,
      potassium: Number(reading.potassium) || 0,
      moisture: Number(reading.moisture) || 0,
      temperature: Number(reading.temperature) || 0,
      ph: Number(reading.ph) || 7.0,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      const payload = {
        ...formData,
        recorded_at: new Date().toISOString(),
      };

      if (editingReading) {
        await api.sensors.update(editingReading.id, payload);
        setNotification("Sensor telemetry log updated.");
      } else {
        await api.sensors.create(payload);
        setNotification("New sensor reading saved to database.");
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save sensor reading.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setSaving(true);
      await api.sensors.delete(id);
      setDeleteConfirmId(null);
      setNotification("Sensor reading deleted.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete sensor reading.");
    } finally {
      setSaving(false);
    }
  };

  const farmMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of farms) {
      map.set(f.id, f.name);
    }
    return map;
  }, [farms]);

  const filteredReadings = useMemo(() => {
    return readings.filter((r) => {
      return farmFilter === "all" || r.farm_id === farmFilter;
    });
  }, [readings, farmFilter]);

  // Compute live averages
  const latest = readings[0];
  const avgN = readings.length
    ? Math.round(readings.reduce((sum, r) => sum + (Number(r.nitrogen) || 0), 0) / readings.length)
    : "—";
  const avgP = readings.length
    ? Math.round(readings.reduce((sum, r) => sum + (Number(r.phosphorus) || 0), 0) / readings.length)
    : "—";
  const avgK = readings.length
    ? Math.round(readings.reduce((sum, r) => sum + (Number(r.potassium) || 0), 0) / readings.length)
    : "—";
  const avgMoisture = readings.length
    ? `${Math.round(readings.reduce((sum, r) => sum + (Number(r.moisture) || 0), 0) / readings.length)}%`
    : "—";

  return (
    <AppFrame active="Soil sensors">
      <section className="workspace">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">FARMSYSTEM <span>·</span> SOIL TELEMETRY &amp; NPK</p>
            <h1>Aloe Vera Soil Monitoring</h1>
            <p>Live soil nutrition metrics: Nitrogen (N), Phosphorus (P), Potassium (K), Soil Moisture, and pH.</p>
          </div>
          <button className="primary-button" onClick={openAddModal} type="button">
            ＋ Log Soil Reading
          </button>
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

        <div className="stats-grid">
          <Stat
            icon="N"
            label="Avg Nitrogen (N)"
            value={String(avgN)}
            detail={typeof avgN === "number" && avgN >= 20 && avgN <= 50 ? "Optimal range (20-50 mg/kg)" : "mg/kg"}
          />
          <Stat
            icon="P"
            label="Avg Phosphorus (P)"
            value={String(avgP)}
            detail={typeof avgP === "number" && avgP >= 15 && avgP <= 35 ? "Optimal range (15-35 mg/kg)" : "mg/kg"}
          />
          <Stat
            icon="K"
            label="Avg Potassium (K)"
            value={String(avgK)}
            detail={typeof avgK === "number" && avgK >= 150 && avgK <= 300 ? "Optimal range (150-300 mg/kg)" : "mg/kg"}
          />
          <Stat
            icon="💧"
            label="Avg Soil Moisture"
            value={avgMoisture}
            detail="Optimal 25% - 45% for succulents"
          />
        </div>

        {/* Real-time Agronomic Analysis & Trend Charts (Phase 8) */}
        {readings.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px", marginBottom: "24px" }}>
            <div className="panel" style={{ padding: "20px", borderRadius: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div>
                  <p className="eyebrow">TELEMETRY TRENDS</p>
                  <h3 style={{ margin: 0, fontSize: "16px", color: "var(--forest)" }}>
                    NPK Macronutrients Distribution (mg/kg)
                  </h3>
                </div>
                <div style={{ display: "flex", gap: "12px", fontSize: "11px", fontWeight: 600 }}>
                  <span style={{ color: "#16a34a" }}>● Nitrogen (N)</span>
                  <span style={{ color: "#d97706" }}>● Phosphorus (P)</span>
                  <span style={{ color: "#2563eb" }}>● Potassium (K)</span>
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div style={{ width: "100%", height: "180px", position: "relative" }}>
                <svg viewBox="0 0 500 180" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="480" y2="20" stroke="#f0f2ed" strokeDasharray="4" />
                  <line x1="40" y1="70" x2="480" y2="70" stroke="#f0f2ed" strokeDasharray="4" />
                  <line x1="40" y1="120" x2="480" y2="120" stroke="#f0f2ed" strokeDasharray="4" />
                  <line x1="40" y1="160" x2="480" y2="160" stroke="#cbd5e1" />

                  {/* Y Axis Labels */}
                  <text x="32" y="24" fontSize="10" fill="#94a3b8" textAnchor="end">300</text>
                  <text x="32" y="74" fontSize="10" fill="#94a3b8" textAnchor="end">200</text>
                  <text x="32" y="124" fontSize="10" fill="#94a3b8" textAnchor="end">100</text>
                  <text x="32" y="164" fontSize="10" fill="#94a3b8" textAnchor="end">0</text>

                  {/* Render Data Points */}
                  {filteredReadings.slice(0, 10).reverse().map((r, i, arr) => {
                    const step = arr.length > 1 ? 420 / (arr.length - 1) : 210;
                    const x = 50 + i * step;
                    const nY = Math.max(20, Math.min(160, 160 - (Number(r.nitrogen || 0) / 300) * 140));
                    const pY = Math.max(20, Math.min(160, 160 - (Number(r.phosphorus || 0) / 300) * 140));
                    const kY = Math.max(20, Math.min(160, 160 - (Number(r.potassium || 0) / 300) * 140));

                    return (
                      <g key={r.id || i}>
                        {/* Bars / Dots */}
                        <circle cx={x} cy={nY} r="4" fill="#16a34a" />
                        <circle cx={x} cy={pY} r="4" fill="#d97706" />
                        <circle cx={x} cy={kY} r="4" fill="#2563eb" />
                        <text x={x} y="175" fontSize="9" fill="#94a3b8" textAnchor="middle">
                          {r.device_id?.split("-").pop() || `#${i + 1}`}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Agronomic Recommendations from Real Readings */}
            <div className="panel" style={{ padding: "20px", borderRadius: "8px" }}>
              <p className="eyebrow">AGRONOMIC SOIL RECOMMENDATION</p>
              <h3 style={{ margin: "4px 0 12px", fontSize: "16px", color: "var(--forest)" }}>
                Condition Assessment
              </h3>

              {readings[0] && (
                <div style={{ display: "grid", gap: "10px", fontSize: "12px", color: "#374151" }}>
                  <div style={{ padding: "10px", borderRadius: "6px", background: "#f8faf7", border: "1px solid #e2ece0" }}>
                    <strong>Nitrogen: </strong>
                    {Number(readings[0].nitrogen) < 20 ? (
                      <span style={{ color: "#d97706" }}>Deficient (&lt; 20 mg/kg) — Side-dress with well-rotted vermicompost.</span>
                    ) : Number(readings[0].nitrogen) > 50 ? (
                      <span style={{ color: "#b91c1c" }}>Excessive (&gt; 50 mg/kg) — Flush soil with plain water to prevent pest vulnerability.</span>
                    ) : (
                      <span style={{ color: "#15803d" }}>Optimal (20–50 mg/kg) — Ideal for succulent leaf firming.</span>
                    )}
                  </div>

                  <div style={{ padding: "10px", borderRadius: "6px", background: "#f8faf7", border: "1px solid #e2ece0" }}>
                    <strong>Potassium: </strong>
                    {Number(readings[0].potassium) < 150 ? (
                      <span style={{ color: "#d97706" }}>Low (&lt; 150 mg/kg) — Supplement organic kelp meal to promote thick gel.</span>
                    ) : (
                      <span style={{ color: "#15803d" }}>Strong (&gt;= 150 mg/kg) — Fosters fungal immunity and thick cuticle.</span>
                    )}
                  </div>

                  <div style={{ padding: "10px", borderRadius: "6px", background: "#f8faf7", border: "1px solid #e2ece0" }}>
                    <strong>Moisture &amp; pH: </strong>
                    {Number(readings[0].moisture) > 50 ? (
                      <span style={{ color: "#b91c1c" }}>High Moisture ({readings[0].moisture}%) — Danger of Root Rot. Suspend irrigation.</span>
                    ) : (
                      <span style={{ color: "#15803d" }}>Balanced ({readings[0].moisture || 35}%) · pH {readings[0].ph ? readings[0].ph.toFixed(1) : "6.8"}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <section className="panel">
          <div className="panel-heading" style={{ marginBottom: "18px" }}>
            <div>
              <p className="eyebrow">TELEMETRY STREAM</p>
              <h2>Recorded Sensor Transmissions ({readings.length})</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="status-badge healthy">● Backend API Connected</span>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: "600" }}>
                Plot:
                <select value={farmFilter} onChange={(e) => setFarmFilter(e.target.value)} style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--line)" }}>
                  <option value="all">All Farm Plots</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {loading ? (
            <div className="dashboard-empty">Retrieving sensor logs from backend...</div>
          ) : filteredReadings.length === 0 ? (
            <div className="dashboard-empty">
              <span className="empty-illustration">NPK</span>
              <strong>{readings.length === 0 ? "No sensor readings recorded yet." : "No readings for this plot."}</strong>
              <p>Log field soil sensor measurements to track nutrient balance and irrigation quality.</p>
              {readings.length === 0 && (
                <button className="secondary-button" onClick={openAddModal} type="button">
                  Record First Sensor Measurement
                </button>
              )}
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Device ID</th>
                    <th>Farm Plot</th>
                    <th>Nitrogen (N)</th>
                    <th>Phosphorus (P)</th>
                    <th>Potassium (K)</th>
                    <th>Moisture</th>
                    <th>Soil pH</th>
                    <th>Temperature</th>
                    <th>Recorded</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReadings.map((reading) => (
                    <tr key={reading.id}>
                      <td>
                        <strong>{reading.device_id || "NPK-SENSOR"}</strong>
                      </td>
                      <td>{farmMap.get(reading.farm_id || "") || "General Plot"}</td>
                      <td>
                        <span className={`tag-pill ${reading.nitrogen >= 20 && reading.nitrogen <= 50 ? "success" : "warning"}`}>
                          {reading.nitrogen} mg/kg
                        </span>
                      </td>
                      <td>
                        <span className={`tag-pill ${reading.phosphorus >= 15 && reading.phosphorus <= 35 ? "success" : "warning"}`}>
                          {reading.phosphorus} mg/kg
                        </span>
                      </td>
                      <td>
                        <span className={`tag-pill ${reading.potassium >= 150 && reading.potassium <= 300 ? "success" : "warning"}`}>
                          {reading.potassium} mg/kg
                        </span>
                      </td>
                      <td>{reading.moisture ? `${reading.moisture}%` : "—"}</td>
                      <td>
                        <strong>{reading.ph ? reading.ph.toFixed(1) : "—"}</strong>
                      </td>
                      <td>{reading.temperature ? `${reading.temperature} °C` : "—"}</td>
                      <td>
                        {reading.recorded_at || reading.created_at
                          ? new Date(reading.recorded_at || reading.created_at || "").toLocaleString()
                          : "—"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="table-actions" style={{ justifyContent: "flex-end" }}>
                          <button
                            className="btn-icon"
                            title="Edit Sensor Log"
                            onClick={() => openEditModal(reading)}
                            type="button"
                          >
                            ✎
                          </button>
                          <button
                            className="btn-icon danger"
                            title="Delete Reading"
                            onClick={() => setDeleteConfirmId(reading.id)}
                            type="button"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="modal-backdrop" onClick={() => !saving && setIsModalOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>{editingReading ? "Edit Sensor Reading" : "Log Soil Telemetry Reading"}</h2>
                <button className="modal-close" onClick={() => setIsModalOpen(false)} type="button">✕</button>
              </div>
              <form onSubmit={handleSave}>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Sensor Hardware ID</label>
                    <input
                      required
                      value={formData.device_id}
                      onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                      placeholder="e.g. NPK-PROBE-01"
                    />
                  </div>
                  <div className="form-field">
                    <label>Farm Plot</label>
                    <select
                      value={formData.farm_id}
                      onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
                    >
                      <option value="">General Field</option>
                      {farms.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Nitrogen (N) [mg/kg]</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.nitrogen}
                      onChange={(e) => setFormData({ ...formData, nitrogen: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Phosphorus (P) [mg/kg]</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.phosphorus}
                      onChange={(e) => setFormData({ ...formData, phosphorus: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Potassium (K) [mg/kg]</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.potassium}
                      onChange={(e) => setFormData({ ...formData, potassium: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Soil Moisture (%)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.moisture}
                      onChange={(e) => setFormData({ ...formData, moisture: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Soil Acidity / pH</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={14}
                      value={formData.ph}
                      onChange={(e) => setFormData({ ...formData, ph: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Ambient / Soil Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button className="primary-button" type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingReading ? "Save Changes" : "Save Measurement"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="modal-backdrop" onClick={() => !saving && setDeleteConfirmId(null)}>
            <div className="modal-card" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>Delete Reading</h2>
                <button className="modal-close" onClick={() => setDeleteConfirmId(null)} type="button">✕</button>
              </div>
              <p style={{ color: "var(--muted)", fontSize: "12px", lineHeight: "1.6" }}>
                Are you sure you want to permanently remove this sensor reading?
              </p>
              <div className="modal-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => handleDelete(deleteConfirmId)}
                  disabled={saving}
                >
                  {saving ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </AppFrame>
  );
}
