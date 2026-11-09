"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AppFrame, Stat } from "@/components/aloe-guard";
import { api, HarvestMaturityResult, MaturityAssessment, Plant } from "@/lib/api";

export default function MaturityPage() {
  const [assessments, setAssessments] = useState<MaturityAssessment[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState("all");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");

  // AI Maturity Scanner states
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanPreview, setScanPreview] = useState("");
  const [scanning, setScanning] = useState(false);
  const [aiResult, setAiResult] = useState<HarvestMaturityResult | null>(null);
  const [selectedPlantForScan, setSelectedPlantForScan] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<MaturityAssessment | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    plant_id: "",
    plant_name: "",
    stage: "Mature",
    maturity_index: 85,
    leaf_count: 14,
    leaf_thickness_mm: 22,
    estimated_harvest_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    ready_for_harvest: true,
    notes: "Outer leaves are plump and firm with dark green coloration.",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [matData, plantsData] = await Promise.all([
        api.maturity.list(),
        api.plants.list(),
      ]);
      setAssessments(matData || []);
      setPlants(plantsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load maturity assessments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingAssessment(null);
    const firstPlant = plants[0];
    setFormData({
      plant_id: firstPlant?.id || "",
      plant_name: firstPlant?.name || "",
      stage: "Mature",
      maturity_index: 85,
      leaf_count: 14,
      leaf_thickness_mm: 22,
      estimated_harvest_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      ready_for_harvest: true,
      notes: "Outer leaves are plump, firm, and ready for gel extraction.",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: MaturityAssessment) => {
    setEditingAssessment(item);
    setFormData({
      plant_id: item.plant_id || "",
      plant_name: item.plant_name || "",
      stage: item.stage || "Mature",
      maturity_index: item.maturity_index || 75,
      leaf_count: item.leaf_count || 12,
      leaf_thickness_mm: item.leaf_thickness_mm || 18,
      estimated_harvest_date: item.estimated_harvest_date
        ? item.estimated_harvest_date.split("T")[0]
        : "",
      ready_for_harvest: Boolean(item.ready_for_harvest),
      notes: item.notes || "",
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

  const handleAiScan = async () => {
    if (!scanFile) return;
    try {
      setScanning(true);
      setError("");
      setAiResult(null);

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(scanFile);
      const imageBase64 = await base64Promise;

      const chosenPlant = plants.find((p) => p.id === selectedPlantForScan);

      const res = await api.vision.maturity({
        image_base64: imageBase64,
        plant_id: selectedPlantForScan || undefined,
        plant_name: chosenPlant?.name || "Aloe Specimen",
      });

      setAiResult(res.maturity);
      setNotification(`Maturity analysis complete: ${res.maturity.stage}`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze plant maturity.");
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");

      if (editingAssessment) {
        await api.maturity.update(editingAssessment.id, formData);
        setNotification("Maturity assessment updated.");
      } else {
        await api.maturity.create(formData);
        setNotification("New maturity assessment recorded.");
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save maturity assessment.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setSaving(true);
      await api.maturity.delete(id);
      setDeleteConfirmId(null);
      setNotification("Maturity assessment deleted.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete assessment.");
    } finally {
      setSaving(false);
    }
  };

  const filteredAssessments = useMemo(() => {
    return assessments.filter((item) => {
      return stageFilter === "all" || item.stage === stageFilter;
    });
  }, [assessments, stageFilter]);

  const readyCount = assessments.filter((a) => a.ready_for_harvest).length;
  const avgLeaves = assessments.length
    ? Math.round(assessments.reduce((sum, a) => sum + (Number(a.leaf_count) || 0), 0) / assessments.length)
    : "—";
  const avgMaturity = assessments.length
    ? `${Math.round(assessments.reduce((sum, a) => sum + (Number(a.maturity_index) || 0), 0) / assessments.length)}%`
    : "—";

  return (
    <AppFrame active="Maturity">
      <section className="workspace">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">FARMSYSTEM <span>·</span> PHENOLOGY &amp; HARVEST</p>
            <h1>Plant Maturity Assessments</h1>
            <p>Evaluate Aloe Vera leaf thickness, vegetative stages, and projected harvest dates.</p>
          </div>
          <button className="primary-button" onClick={openAddModal} type="button">
            ＋ Log Maturity Assessment
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
          <Stat icon="M" label="Total Assessments" value={loading ? "—" : String(assessments.length)} detail="Evaluated specimens" />
          <Stat icon="✓" label="Harvest Ready" value={loading ? "—" : String(readyCount)} detail="Optimal maturity" />
          <Stat icon="🍃" label="Avg Leaf Count" value={String(avgLeaves)} detail="Leaves per plant" />
          <Stat icon="📈" label="Avg Maturity Index" value={avgMaturity} detail="Overall crop maturity" />
        </div>

        {/* Phase 7 AI Harvest Maturity Image Analyzer */}
        <section className="panel" style={{ padding: "24px", marginBottom: "24px", borderRadius: "10px" }}>
          <div className="panel-heading" style={{ marginBottom: "16px" }}>
            <div>
              <p className="eyebrow">AI VISUAL HARVEST EVALUATION</p>
              <h2>Upload Aloe Vera Image for Maturity Classification</h2>
            </div>
            <span className="status-badge healthy">Phase 7 Vision Pipeline</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div>
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px dashed #cbd5e1",
                  borderRadius: "8px",
                  padding: "24px",
                  cursor: "pointer",
                  background: scanPreview ? "#f8faf7" : "#fff",
                }}
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setScanFile(f);
                      setScanPreview(URL.createObjectURL(f));
                      setAiResult(null);
                    }
                  }}
                />
                {scanPreview ? (
                  <div style={{ textAlign: "center" }}>
                    <Image src={scanPreview} alt="Preview" width={120} height={120} style={{ borderRadius: "6px", objectFit: "cover" }} unoptimized />
                    <span style={{ display: "block", marginTop: "8px", fontSize: "12px", color: "var(--leaf)", fontWeight: 600 }}>
                      Change photo
                    </span>
                  </div>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "28px" }}>📷</span>
                    <strong style={{ display: "block", margin: "6px 0 2px", fontSize: "13px" }}>
                      Upload Aloe Photo for Maturity Scan
                    </strong>
                    <small style={{ color: "var(--muted)" }}>Evaluates leaf thickness, leaf count &amp; rosette firmness</small>
                  </div>
                )}
              </label>

              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                <select
                  value={selectedPlantForScan}
                  onChange={(e) => setSelectedPlantForScan(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "12px" }}
                >
                  <option value="">Link to plant (optional)</option>
                  {plants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="primary-button"
                  disabled={!scanFile || scanning}
                  onClick={handleAiScan}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {scanning ? "Analyzing..." : "Classify Maturity"}
                </button>
              </div>
            </div>

            {/* Results Display */}
            <div style={{ background: "#f8faf7", border: "1px solid #dce8db", borderRadius: "8px", padding: "18px" }}>
              <p className="eyebrow" style={{ marginBottom: "6px" }}>OBSERVED MATURITY METRICS</p>
              {aiResult ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                    <h3 style={{ margin: 0, color: "var(--forest)", fontSize: "18px" }}>{aiResult.stage}</h3>
                    <span className={`status-badge ${aiResult.ready_for_harvest ? "healthy" : "pending"}`}>
                      {aiResult.ready_for_harvest ? "✓ Ready for Harvest" : "Growing"}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", margin: "14px 0" }}>
                    <div style={{ background: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid #e1e7dc" }}>
                      <small style={{ color: "var(--muted)" }}>Estimated Age</small>
                      <strong style={{ display: "block", fontSize: "15px", color: "var(--forest)" }}>
                        {aiResult.estimated_age_range || "2 – 3+ Years"}
                      </strong>
                    </div>
                    <div style={{ background: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid #e1e7dc" }}>
                      <small style={{ color: "var(--muted)" }}>Outer Leaves</small>
                      <strong style={{ display: "block", fontSize: "15px", color: "var(--forest)" }}>
                        ~{aiResult.estimated_leaf_count} leaves
                      </strong>
                    </div>
                    <div style={{ background: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid #e1e7dc" }}>
                      <small style={{ color: "var(--muted)" }}>Basal Thickness</small>
                      <strong style={{ display: "block", fontSize: "15px", color: "var(--forest)" }}>
                        {aiResult.estimated_leaf_thickness_mm} mm
                      </strong>
                    </div>
                  </div>

                  <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.5, margin: "8px 0" }}>
                    <strong>Harvesting Guidance: </strong>
                    {aiResult.harvest_guidance}
                  </p>
                </div>
              ) : (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "var(--muted)", textAlign: "center", minHeight: "140px" }}>
                  <span>Waiting for image upload...</span>
                  <small style={{ marginTop: "6px" }}>
                    Classifications: Young / Not Yet Mature · Developing · Mature / Ready for Harvest
                  </small>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="filters-row">
            <label>
              <span>Filter by Stage</span>
              <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
                <option value="all">All Stages</option>
                <option value="Seedling">Seedling</option>
                <option value="Vegetative">Vegetative</option>
                <option value="Mature">Mature</option>
                <option value="Harvest Ready">Harvest Ready</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="dashboard-empty">Loading phenology data from backend...</div>
          ) : filteredAssessments.length === 0 ? (
            <div className="dashboard-empty">
              <span className="empty-illustration">🌾</span>
              <strong>{assessments.length === 0 ? "No maturity assessments recorded yet." : "No records for this stage."}</strong>
              <p>Evaluate leaf girth, rosette size, and harvest eligibility for your Aloe crops.</p>
              {assessments.length === 0 && (
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
                    <th>Plant Specimen</th>
                    <th>Stage</th>
                    <th>Maturity Index</th>
                    <th>Leaf Count</th>
                    <th>Thickness</th>
                    <th>Target Harvest</th>
                    <th>Readiness</th>
                    <th>Notes</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssessments.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.plant_name || `Plant ${item.plant_id?.slice(-6) || "Specimen"}`}</strong>
                        {item.plant_id && (
                          <div>
                            <Link href={`/plants/${item.plant_id}`} className="text-link" style={{ fontSize: "10px" }}>
                              View Plant →
                            </Link>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="tag-pill">{item.stage}</span>
                      </td>
                      <td>
                        <strong>{item.maturity_index ? `${item.maturity_index}%` : "—"}</strong>
                      </td>
                      <td>{item.leaf_count || "—"} leaves</td>
                      <td>{item.leaf_thickness_mm ? `${item.leaf_thickness_mm} mm` : "—"}</td>
                      <td>
                        {item.estimated_harvest_date
                          ? new Date(item.estimated_harvest_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <span className={`status-badge ${item.ready_for_harvest ? "healthy" : "attention"}`}>
                          {item.ready_for_harvest ? "Ready for Harvest" : "In Growth Phase"}
                        </span>
                      </td>
                      <td style={{ maxWidth: "200px" }}>{item.notes || "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        <div className="table-actions" style={{ justifyContent: "flex-end" }}>
                          <button
                            className="btn-icon"
                            title="Edit Assessment"
                            onClick={() => openEditModal(item)}
                            type="button"
                          >
                            ✎
                          </button>
                          <button
                            className="btn-icon danger"
                            title="Delete Assessment"
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
                <h2>{editingAssessment ? "Edit Maturity Record" : "Evaluate Plant Maturity"}</h2>
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
                    <label>Developmental Stage</label>
                    <select
                      value={formData.stage}
                      onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    >
                      <option value="Seedling">Seedling (Young Pup)</option>
                      <option value="Vegetative">Vegetative Growth (1-2 years)</option>
                      <option value="Mature">Mature (2-3 years, Gel-Rich)</option>
                      <option value="Harvest Ready">Harvest Ready (Outer leaves &gt; 500g)</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Maturity Index (0 - 100%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.maturity_index}
                      onChange={(e) => setFormData({ ...formData, maturity_index: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Total Functional Leaves</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.leaf_count}
                      onChange={(e) => setFormData({ ...formData, leaf_count: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Base Leaf Thickness (mm)</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.leaf_thickness_mm}
                      onChange={(e) => setFormData({ ...formData, leaf_thickness_mm: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Estimated Harvest Date</label>
                    <input
                      type="date"
                      value={formData.estimated_harvest_date}
                      onChange={(e) => setFormData({ ...formData, estimated_harvest_date: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Ready for Immediate Harvest?</label>
                    <select
                      value={formData.ready_for_harvest ? "yes" : "no"}
                      onChange={(e) => setFormData({ ...formData, ready_for_harvest: e.target.value === "yes" })}
                    >
                      <option value="yes">Yes - Suitable for Harvesting</option>
                      <option value="no">No - Needs further maturation</option>
                    </select>
                  </div>
                  <div className="form-field full">
                    <label>Observations &amp; Gel Quality Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Color, spine firmness, sap clarity, or weather factors..."
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
                    {saving ? "Saving..." : editingAssessment ? "Save Changes" : "Save Assessment"}
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
                <h2>Delete Assessment</h2>
                <button className="modal-close" onClick={() => setDeleteConfirmId(null)} type="button">✕</button>
              </div>
              <p style={{ color: "var(--muted)", fontSize: "12px", lineHeight: "1.6" }}>
                Are you sure you want to permanently delete this maturity assessment?
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

