"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AppFrame, Stat } from "@/components/aloe-guard";
import { api, Plant, Farm } from "@/lib/api";

export default function PlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [farmFilter, setFarmFilter] = useState("all");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    variety: "Aloe Barbadensis Miller",
    farm_id: "",
    planted_date: new Date().toISOString().split("T")[0],
    stage: "Vegetative",
    health_status: "Healthy",
    notes: "",
    image_url: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [plantsData, farmsData] = await Promise.all([
        api.plants.list(),
        api.farms.list(),
      ]);
      setPlants(plantsData || []);
      setFarms(farmsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plants from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingPlant(null);
    setFormData({
      name: "",
      variety: "Aloe Barbadensis Miller",
      farm_id: farms[0]?.id || "",
      planted_date: new Date().toISOString().split("T")[0],
      stage: "Vegetative",
      health_status: "Healthy",
      notes: "",
      image_url: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (plant: Plant) => {
    setEditingPlant(plant);
    setFormData({
      name: plant.name || "",
      variety: plant.variety || "Aloe Barbadensis Miller",
      farm_id: plant.farm_id || "",
      planted_date: plant.planted_date ? plant.planted_date.split("T")[0] : new Date().toISOString().split("T")[0],
      stage: plant.stage || "Vegetative",
      health_status: plant.health_status || "Healthy",
      notes: plant.notes || "",
      image_url: plant.image_url || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSaving(true);
      setError("");
      if (editingPlant) {
        await api.plants.update(editingPlant.id, formData);
        setNotification(`Plant "${formData.name}" successfully updated.`);
      } else {
        await api.plants.create(formData);
        setNotification(`Plant "${formData.name}" added to inventory.`);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save plant record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setSaving(true);
      await api.plants.delete(id);
      setDeleteConfirmId(null);
      setNotification("Plant removed from inventory.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete plant.");
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

  const filteredPlants = useMemo(() => {
    return plants.filter((plant) => {
      const matchesSearch =
        plant.name.toLowerCase().includes(search.toLowerCase()) ||
        (plant.variety && plant.variety.toLowerCase().includes(search.toLowerCase())) ||
        (plant.notes && plant.notes.toLowerCase().includes(search.toLowerCase()));
      const matchesStage = stageFilter === "all" || plant.stage === stageFilter;
      const matchesFarm = farmFilter === "all" || plant.farm_id === farmFilter;
      return matchesSearch && matchesStage && matchesFarm;
    });
  }, [plants, search, stageFilter, farmFilter]);

  const healthyCount = plants.filter((p) => p.health_status === "Healthy").length;
  const readyCount = plants.filter((p) => p.stage === "Ready for Harvest" || p.stage === "Mature").length;

  return (
    <AppFrame active="Plants">
      <section className="workspace">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">FARMSYSTEM <span>·</span> PLANT INVENTORY</p>
            <h1>Aloe Vera Cultivation</h1>
            <p>Manage individual plants, genetic varieties, growth phases, and health conditions.</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <Link href="/detect" className="secondary-button">
              📷 Scan / Photograph
            </Link>
            <button className="primary-button" onClick={openAddModal} type="button">
              ＋ Add New Plant
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

        <div className="stats-grid plants-stats">
          <Stat icon="P" label="Total Plants" value={loading ? "—" : String(plants.length)} detail="Catalogued specimens" />
          <Stat icon="✓" label="Healthy Plants" value={loading ? "—" : String(healthyCount)} detail="Good condition" />
          <Stat icon="🌾" label="Harvest Ready" value={loading ? "—" : String(readyCount)} detail="Mature or ready" />
          <Stat
            icon="🌿"
            label="Varieties"
            value={loading ? "—" : String(new Set(plants.map((p) => p.variety).filter(Boolean)).size)}
            detail="Active cultivars"
          />
          <Stat
            icon="F"
            label="Plots Populated"
            value={loading ? "—" : String(new Set(plants.map((p) => p.farm_id).filter(Boolean)).size)}
            detail="Farms with crops"
          />
        </div>

        <section className="panel plants-panel">
          <div className="filters-row">
            <label className="search-field">
              <span>Search Plants</span>
              <span className="search-input">
                <span aria-hidden="true">⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search plant name, cultivar, or notes..."
                />
              </span>
            </label>
            <label>
              <span>Growth Stage</span>
              <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
                <option value="all">All Growth Stages</option>
                <option value="Seedling">Seedling</option>
                <option value="Vegetative">Vegetative</option>
                <option value="Mature">Mature</option>
                <option value="Ready for Harvest">Ready for Harvest</option>
              </select>
            </label>
            <label>
              <span>Farm Plot</span>
              <select value={farmFilter} onChange={(e) => setFarmFilter(e.target.value)}>
                <option value="all">All Farms</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="dashboard-empty">Loading plant registry from backend...</div>
          ) : filteredPlants.length === 0 ? (
            <div className="dashboard-empty">
              <span className="empty-illustration">✿</span>
              <strong>{plants.length === 0 ? "No plants registered yet." : "No plants match the selected filter."}</strong>
              <p>Add plants to your inventory and link them to your farms and soil sensor telemetry.</p>
              {plants.length === 0 && (
                <button className="secondary-button" onClick={openAddModal} type="button">
                  Register First Plant
                </button>
              )}
            </div>
          ) : (
            <div className="plant-list">
              {filteredPlants.map((plant) => (
                <article className="plant-row" key={plant.id}>
                  <div className="plant-thumbnail">
                    {plant.image_url ? (
                      <Image
                        src={plant.image_url}
                        alt={plant.name}
                        width={62}
                        height={62}
                        unoptimized
                      />
                    ) : (
                      <span aria-hidden="true">✿</span>
                    )}
                  </div>
                  <div className="plant-row-main">
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
                    <h3>{plant.name}</h3>
                    <p>
                      {plant.variety || "Aloe Barbadensis"} ·{" "}
                      <strong>{farmMap.get(plant.farm_id || "") || "Unassigned Farm"}</strong>
                    </p>
                  </div>
                  <div className="plant-latest">
                    <small>Stage &amp; Planted</small>
                    <strong>{plant.stage || "Vegetative"}</strong>
                    <span>Planted: {plant.planted_date ? new Date(plant.planted_date).toLocaleDateString() : "—"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Link className="secondary-button plant-view" href={`/plants/${plant.id}`}>
                      View Details →
                    </Link>
                    <button
                      className="btn-icon"
                      title="Edit Plant"
                      onClick={() => openEditModal(plant)}
                      type="button"
                    >
                      ✎
                    </button>
                    <button
                      className="btn-icon danger"
                      title="Delete Plant"
                      onClick={() => setDeleteConfirmId(plant.id)}
                      type="button"
                    >
                      🗑
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="modal-backdrop" onClick={() => !saving && setIsModalOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>{editingPlant ? "Edit Plant Details" : "Register New Plant"}</h2>
                <button className="modal-close" onClick={() => setIsModalOpen(false)} type="button">✕</button>
              </div>
              <form onSubmit={handleSave}>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Plant Identifier / Label *</label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Aloe Bed A - Row 1 - Plant #04"
                    />
                  </div>
                  <div className="form-field">
                    <label>Botanical Variety</label>
                    <select
                      value={formData.variety}
                      onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    >
                      <option value="Aloe Barbadensis Miller">Aloe Barbadensis Miller (True Aloe)</option>
                      <option value="Aloe Arborescens">Aloe Arborescens (Candelabra Aloe)</option>
                      <option value="Aloe Ferox">Aloe Ferox (Cape Aloe)</option>
                      <option value="Aloe Saponaria">Aloe Saponaria (Zebra Aloe)</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Assigned Farm Plot</label>
                    <select
                      value={formData.farm_id}
                      onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
                    >
                      <option value="">No farm assigned</option>
                      {farms.map((f) => (
                        <option key={f.id} value={f.id}>{f.name} ({f.location || "Plot"})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Date Planted</label>
                    <input
                      type="date"
                      value={formData.planted_date}
                      onChange={(e) => setFormData({ ...formData, planted_date: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Current Growth Stage</label>
                    <select
                      value={formData.stage}
                      onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    >
                      <option value="Seedling">Seedling</option>
                      <option value="Vegetative">Vegetative</option>
                      <option value="Mature">Mature</option>
                      <option value="Ready for Harvest">Ready for Harvest</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Observed Health Status</label>
                    <select
                      value={formData.health_status}
                      onChange={(e) => setFormData({ ...formData, health_status: e.target.value })}
                    >
                      <option value="Healthy">Healthy</option>
                      <option value="Attention">Needs Attention</option>
                      <option value="Diseased">Diseased</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div className="form-field full">
                    <label>Photo URL / Image Source</label>
                    <input
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="e.g. /sample-aloe.jpg or hosted image URL"
                    />
                  </div>
                  <div className="form-field full">
                    <label>Notes &amp; Observations</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Leaf thickness, pup offsets, watering schedules, or comments..."
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
                    {saving ? "Saving..." : editingPlant ? "Save Changes" : "Save Plant"}
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
                <h2>Delete Plant Record</h2>
                <button className="modal-close" onClick={() => setDeleteConfirmId(null)} type="button">✕</button>
              </div>
              <p style={{ color: "var(--muted)", fontSize: "12px", lineHeight: "1.6" }}>
                Are you sure you want to remove this plant from inventory? This operation cannot be undone.
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
