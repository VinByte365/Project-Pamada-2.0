"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppFrame, Stat } from "@/components/aloe-guard";
import { api, Diagnosis, Plant } from "@/lib/api";

export default function DiagnosesPage() {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiagnosis, setEditingDiagnosis] = useState<Diagnosis | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    plant_id: "",
    plant_name: "",
    diagnosis: "Healthy",
    confidence: 95,
    severity: "None",
    symptoms: "Normal green turgid foliage, no lesions.",
    recommendations: "Continue regular light watering and sun exposure.",
    notes: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [diagData, plantsData] = await Promise.all([
        api.diagnoses.list(),
        api.plants.list(),
      ]);
      setDiagnoses(diagData || []);
      setPlants(plantsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load diagnoses from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingDiagnosis(null);
    const firstPlant = plants[0];
    setFormData({
      plant_id: firstPlant?.id || "",
      plant_name: firstPlant?.name || "",
      diagnosis: "Healthy",
      confidence: 95,
      severity: "None",
      symptoms: "Normal turgid foliage, no lesions or rot.",
      recommendations: "Maintain current irrigation and drainage conditions.",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (diag: Diagnosis) => {
    setEditingDiagnosis(diag);
    setFormData({
      plant_id: diag.plant_id || "",
      plant_name: diag.plant_name || "",
      diagnosis: diag.diagnosis || "Healthy",
      confidence: diag.confidence || 90,
      severity: diag.severity || "None",
      symptoms: diag.symptoms || "",
      recommendations: Array.isArray(diag.recommendations)
        ? diag.recommendations.join("\n")
        : diag.recommendations || "",
      notes: diag.notes || "",
    });
    setIsModalOpen(true);
  };

  const handlePlantChange = (plantId: string) => {
    const selected = plants.find((p) => p.id === plantId);
    setFormData({
      ...formData,
      plant_id: plantId,
      plant_name: selected?.name || "",
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.diagnosis.trim()) return;

    try {
      setSaving(true);
      setError("");
      const payload = {
        ...formData,
        recommendations: formData.recommendations
          .split("\n")
          .map((r) => r.trim())
          .filter(Boolean),
      };

      if (editingDiagnosis) {
        await api.diagnoses.update(editingDiagnosis.id, payload);
        setNotification("Diagnosis report updated successfully.");
      } else {
        await api.diagnoses.create(payload);
        setNotification("New diagnosis report logged in database.");
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save diagnosis.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setSaving(true);
      await api.diagnoses.delete(id);
      setDeleteConfirmId(null);
      setNotification("Diagnosis record deleted.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete diagnosis.");
    } finally {
      setSaving(false);
    }
  };

  const filteredDiagnoses = useMemo(() => {
    return diagnoses.filter((diag) => {
      const text = `${diag.diagnosis} ${diag.plant_name || ""} ${diag.symptoms || ""} ${diag.notes || ""}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesSeverity = severityFilter === "all" || diag.severity === severityFilter;
      return matchesSearch && matchesSeverity;
    });
  }, [diagnoses, search, severityFilter]);

  const healthyCount = diagnoses.filter((d) => d.diagnosis === "Healthy" || d.severity === "None").length;
  const severeCount = diagnoses.filter((d) => d.severity === "Severe").length;

  return (
    <AppFrame active="Diagnoses">
      <section className="workspace">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">FARMSYSTEM <span>·</span> PATHOLOGY &amp; HEALTH</p>
            <h1>Aloe Health &amp; Diagnoses</h1>
            <p>Log laboratory and field assessments for Aloe Vera diseases, fungal rot, and sun scald.</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link href="/detect" className="secondary-button">
              📷 New Camera Scan
            </Link>
            <button className="primary-button" onClick={openAddModal} type="button">
              ＋ Log Diagnosis Report
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

        <div className="stats-grid">
          <Stat icon="D" label="Total Reports" value={loading ? "—" : String(diagnoses.length)} detail="Health evaluations" />
          <Stat icon="✓" label="Healthy Specimen" value={loading ? "—" : String(healthyCount)} detail="Clear of pathogens" />
          <Stat icon="!" label="Severe Conditions" value={loading ? "—" : String(severeCount)} detail="Urgent treatment needed" warning />
          <Stat
            icon="🌱"
            label="Monitored Plants"
            value={loading ? "—" : String(new Set(diagnoses.map((d) => d.plant_id).filter(Boolean)).size)}
            detail="Plants with history"
          />
        </div>

        <section className="panel">
          <div className="filters-row">
            <label className="search-field">
              <span>Search Health Records</span>
              <span className="search-input">
                <span aria-hidden="true">⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search disease name, plant label, or observed symptoms..."
                />
              </span>
            </label>
            <label>
              <span>Severity Level</span>
              <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                <option value="all">All Severities</option>
                <option value="None">None (Healthy)</option>
                <option value="Low">Low Risk</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="dashboard-empty">Loading pathology logs from backend...</div>
          ) : filteredDiagnoses.length === 0 ? (
            <div className="dashboard-empty">
              <span className="empty-illustration">🌿</span>
              <strong>{diagnoses.length === 0 ? "No diagnoses logged yet." : "No health records match your criteria."}</strong>
              <p>Log periodic assessments or upload plant photos to detect common Aloe Vera issues.</p>
              {diagnoses.length === 0 && (
                <button className="secondary-button" onClick={openAddModal} type="button">
                  Record First Assessment
                </button>
              )}
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Plant / Specimen</th>
                    <th>Diagnosis Result</th>
                    <th>Severity</th>
                    <th>Confidence</th>
                    <th>Observed Symptoms</th>
                    <th>Treatment Advice</th>
                    <th>Date</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDiagnoses.map((diag) => (
                    <tr key={diag.id}>
                      <td>
                        <strong>{diag.plant_name || `Plant ${diag.plant_id?.slice(-6) || "ID"}`}</strong>
                        {diag.plant_id && (
                          <div>
                            <Link href={`/plants/${diag.plant_id}`} className="text-link" style={{ fontSize: "10px" }}>
                              View Specimen →
                            </Link>
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            diag.diagnosis === "Healthy"
                              ? "healthy"
                              : diag.severity === "Severe"
                              ? "attention"
                              : "pending"
                          }`}
                        >
                          {diag.diagnosis}
                        </span>
                      </td>
                      <td>
                        <span className={`tag-pill ${diag.severity === "Severe" ? "danger" : diag.severity === "Moderate" ? "warning" : "success"}`}>
                          {diag.severity || "None"}
                        </span>
                      </td>
                      <td>{diag.confidence ? `${diag.confidence}%` : "—"}</td>
                      <td style={{ maxWidth: "200px" }}>{diag.symptoms || "—"}</td>
                      <td style={{ maxWidth: "220px" }}>
                        {Array.isArray(diag.recommendations)
                          ? diag.recommendations.join("; ")
                          : diag.recommendations || "—"}
                      </td>
                      <td>{diag.created_at ? new Date(diag.created_at).toLocaleDateString() : "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        <div className="table-actions" style={{ justifyContent: "flex-end" }}>
                          <button
                            className="btn-icon"
                            title="Edit Diagnosis"
                            onClick={() => openEditModal(diag)}
                            type="button"
                          >
                            ✎
                          </button>
                          <button
                            className="btn-icon danger"
                            title="Delete Diagnosis"
                            onClick={() => setDeleteConfirmId(diag.id)}
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
                <h2>{editingDiagnosis ? "Edit Health Diagnosis" : "Log New Health Diagnosis"}</h2>
                <button className="modal-close" onClick={() => setIsModalOpen(false)} type="button">✕</button>
              </div>
              <form onSubmit={handleSave}>
                <div className="form-grid">
                  <div className="form-field full">
                    <label>Select Plant Specimen</label>
                    <select
                      value={formData.plant_id}
                      onChange={(e) => handlePlantChange(e.target.value)}
                    >
                      <option value="">General Assessment (No specific plant)</option>
                      {plants.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.variety || "Aloe"})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Diagnosis Outcome *</label>
                    <select
                      value={formData.diagnosis}
                      onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    >
                      <option value="Healthy">Healthy (Optimal Condition)</option>
                      <option value="Aloe Rust">Aloe Rust (Uromyces aloes)</option>
                      <option value="Basal Stem Rot">Basal Stem Rot / Root Rot (Pythium / Fusarium)</option>
                      <option value="Anthracnose">Anthracnose (Colletotrichum)</option>
                      <option value="Sun Scald / Sunburn">Sun Scald / Sunburn</option>
                      <option value="Bacterial Soft Rot">Bacterial Soft Rot (Pectobacterium)</option>
                      <option value="Aloe Scale">Aloe Scale Infestation</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Severity Level</label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    >
                      <option value="None">None (Healthy)</option>
                      <option value="Low">Low (Initial Signs)</option>
                      <option value="Moderate">Moderate (Requires Intervention)</option>
                      <option value="Severe">Severe (Critical Action)</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Analysis Confidence Score (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.confidence}
                      onChange={(e) => setFormData({ ...formData, confidence: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-field full">
                    <label>Observed Symptoms</label>
                    <textarea
                      value={formData.symptoms}
                      onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                      placeholder="Describe lesions, brown spots, leaf softening, or discoloration..."
                    />
                  </div>
                  <div className="form-field full">
                    <label>Treatment Advice &amp; Recommendations (One per line)</label>
                    <textarea
                      value={formData.recommendations}
                      onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                      placeholder="Isolate affected leaves&#10;Reduce watering cycle&#10;Apply copper fungicide spray"
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
                    {saving ? "Saving..." : editingDiagnosis ? "Save Changes" : "Save Report"}
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
                <h2>Delete Diagnosis</h2>
                <button className="modal-close" onClick={() => setDeleteConfirmId(null)} type="button">✕</button>
              </div>
              <p style={{ color: "var(--muted)", fontSize: "12px", lineHeight: "1.6" }}>
                Are you sure you want to permanently remove this health evaluation?
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

