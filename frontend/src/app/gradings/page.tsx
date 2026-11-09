"use client";

import { useEffect, useMemo, useState } from "react";
import { AppFrame, Stat } from "@/components/aloe-guard";
import { api, Grading, Plant } from "@/lib/api";

export default function GradingsPage() {
  const [gradings, setGradings] = useState<Grading[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState("all");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrading, setEditingGrading] = useState<Grading | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    batch_id: "BATCH-2026-01",
    plant_id: "",
    grade: "Grade A",
    quality_score: 92,
    defect_rate: 2.5,
    weight_kg: 18.5,
    inspected_date: new Date().toISOString().split("T")[0],
    inspector: "Quality Inspector",
    notes: "High gel clarity, unblemished thick rind, optimal aloin concentration.",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [gradingsData, plantsData] = await Promise.all([
        api.gradings.list(),
        api.plants.list(),
      ]);
      setGradings(gradingsData || []);
      setPlants(plantsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quality gradings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingGrading(null);
    setFormData({
      batch_id: `BATCH-${Date.now().toString().slice(-6)}`,
      plant_id: plants[0]?.id || "",
      grade: "Grade A",
      quality_score: 92,
      defect_rate: 2.5,
      weight_kg: 18.5,
      inspected_date: new Date().toISOString().split("T")[0],
      inspector: "Quality Inspector",
      notes: "High gel clarity, unblemished thick rind, optimal aloin concentration.",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Grading) => {
    setEditingGrading(item);
    setFormData({
      batch_id: item.batch_id || "",
      plant_id: item.plant_id || "",
      grade: item.grade || "Grade A",
      quality_score: Number(item.quality_score) || 80,
      defect_rate: Number(item.defect_rate) || 0,
      weight_kg: Number(item.weight_kg) || 0,
      inspected_date: item.inspected_date ? item.inspected_date.split("T")[0] : "",
      inspector: item.inspector || "",
      notes: item.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");

      if (editingGrading) {
        await api.gradings.update(editingGrading.id, formData);
        setNotification("Grading inspection record updated.");
      } else {
        await api.gradings.create(formData);
        setNotification("New quality grading recorded.");
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save grading.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setSaving(true);
      await api.gradings.delete(id);
      setDeleteConfirmId(null);
      setNotification("Grading record removed.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete grading.");
    } finally {
      setSaving(false);
    }
  };

  const filteredGradings = useMemo(() => {
    return gradings.filter((g) => {
      return gradeFilter === "all" || g.grade === gradeFilter;
    });
  }, [gradings, gradeFilter]);

  const gradeACount = gradings.filter((g) => g.grade === "Grade A").length;
  const gradeAPct = gradings.length ? `${Math.round((gradeACount / gradings.length) * 100)}%` : "—";
  const avgScore = gradings.length
    ? Math.round(gradings.reduce((sum, g) => sum + (Number(g.quality_score) || 0), 0) / gradings.length)
    : "—";
  const totalWeight = gradings.reduce((sum, g) => sum + (Number(g.weight_kg) || 0), 0);

  return (
    <AppFrame active="Quality grades">
      <section className="workspace">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">FARMSYSTEM <span>·</span> QUALITY CONTROL &amp; STANDARDS</p>
            <h1>Harvest Quality Gradings</h1>
            <p>Classify harvested Aloe Vera leaves into Premium, Standard, Processing, or Rejected categories.</p>
          </div>
          <button className="primary-button" onClick={openAddModal} type="button">
            ＋ Log Quality Inspection
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
          <Stat icon="G" label="Inspected Lots" value={loading ? "—" : String(gradings.length)} detail="Quality-tested batches" />
          <Stat icon="★" label="Grade A Yield" value={gradeAPct} detail="Premium cosmetic grade" />
          <Stat icon="✓" label="Avg Quality Score" value={String(avgScore)} detail="Out of 100 benchmark" />
          <Stat icon="⚖" label="Total Graded Weight" value={`${totalWeight.toFixed(1)} kg`} detail="Harvest weight audited" />
        </div>

        <section className="panel">
          <div className="filters-row">
            <label>
              <span>Quality Grade Filter</span>
              <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                <option value="all">All Grades</option>
                <option value="Grade A">Grade A (Premium / Cosmetic)</option>
                <option value="Grade B">Grade B (Standard Commercial)</option>
                <option value="Grade C">Grade C (Industrial / Extraction)</option>
                <option value="Reject">Reject (Sub-standard)</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="dashboard-empty">Loading grading data from backend...</div>
          ) : filteredGradings.length === 0 ? (
            <div className="dashboard-empty">
              <span className="empty-illustration">★</span>
              <strong>{gradings.length === 0 ? "No quality gradings recorded yet." : "No records for this grade."}</strong>
              <p>Audit harvested leaves for blemishes, gel content, and certification standards.</p>
              {gradings.length === 0 && (
                <button className="secondary-button" onClick={openAddModal} type="button">
                  Record First Inspection
                </button>
              )}
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Batch / Lot ID</th>
                    <th>Quality Grade</th>
                    <th>Score</th>
                    <th>Defect Rate</th>
                    <th>Lot Weight</th>
                    <th>Inspector</th>
                    <th>Date</th>
                    <th>Inspection Notes</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGradings.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.batch_id || `LOT-${item.id.slice(-6)}`}</strong>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            item.grade === "Grade A"
                              ? "healthy"
                              : item.grade === "Grade B"
                              ? "healthy"
                              : item.grade === "Reject"
                              ? "attention"
                              : "pending"
                          }`}
                        >
                          {item.grade}
                        </span>
                      </td>
                      <td>
                        <strong>{item.quality_score ? `${item.quality_score}/100` : "—"}</strong>
                      </td>
                      <td>{item.defect_rate !== undefined ? `${item.defect_rate}%` : "—"}</td>
                      <td>{item.weight_kg ? `${item.weight_kg} kg` : "—"}</td>
                      <td>{item.inspector || "Self"}</td>
                      <td>
                        {item.inspected_date
                          ? new Date(item.inspected_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td style={{ maxWidth: "220px" }}>{item.notes || "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        <div className="table-actions" style={{ justifyContent: "flex-end" }}>
                          <button
                            className="btn-icon"
                            title="Edit Inspection"
                            onClick={() => openEditModal(item)}
                            type="button"
                          >
                            ✎
                          </button>
                          <button
                            className="btn-icon danger"
                            title="Delete Record"
                            onClick={() => setDeleteConfirmId(item.id)}
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
                <h2>{editingGrading ? "Edit Grading Record" : "New Quality Grading Inspection"}</h2>
                <button className="modal-close" onClick={() => setIsModalOpen(false)} type="button">✕</button>
              </div>
              <form onSubmit={handleSave}>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Harvest Batch / Lot Number *</label>
                    <input
                      required
                      value={formData.batch_id}
                      onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                      placeholder="e.g. BATCH-2026-ALOE-01"
                    />
                  </div>
                  <div className="form-field">
                    <label>Quality Grade *</label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    >
                      <option value="Grade A">Grade A - Premium Cosmetic / Food Grade</option>
                      <option value="Grade B">Grade B - Standard Commercial</option>
                      <option value="Grade C">Grade C - Industrial Processing / Extracts</option>
                      <option value="Reject">Reject - Sub-standard / Pathogen Damage</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Quality Score (0 - 100)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.quality_score}
                      onChange={(e) => setFormData({ ...formData, quality_score: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Defect Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={formData.defect_rate}
                      onChange={(e) => setFormData({ ...formData, defect_rate: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Harvest Lot Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      value={formData.weight_kg}
                      onChange={(e) => setFormData({ ...formData, weight_kg: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Inspection Date</label>
                    <input
                      type="date"
                      value={formData.inspected_date}
                      onChange={(e) => setFormData({ ...formData, inspected_date: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Inspector Name</label>
                    <input
                      value={formData.inspector}
                      onChange={(e) => setFormData({ ...formData, inspector: e.target.value })}
                      placeholder="e.g. Chief QA Officer"
                    />
                  </div>
                  <div className="form-field full">
                    <label>Quality &amp; Rind Inspection Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Gel translucency, leaf firmness, pest markings, or storage remarks..."
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
                    {saving ? "Saving..." : editingGrading ? "Save Changes" : "Save Record"}
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
                <h2>Delete Grading</h2>
                <button className="modal-close" onClick={() => setDeleteConfirmId(null)} type="button">✕</button>
              </div>
              <p style={{ color: "var(--muted)", fontSize: "12px", lineHeight: "1.6" }}>
                Are you sure you want to permanently delete this quality inspection?
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

