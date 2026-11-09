"use client";

import { useEffect, useMemo, useState } from "react";
import { AppFrame, Stat } from "@/components/aloe-guard";
import { api, Farm } from "@/lib/api";

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    size: "",
    soil_type: "Sandy Loam",
    status: "Active",
    description: "",
  });

  const loadFarms = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.farms.list();
      setFarms(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load farms from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarms();
  }, []);

  const openAddModal = () => {
    setEditingFarm(null);
    setFormData({
      name: "",
      location: "",
      size: "",
      soil_type: "Sandy Loam",
      status: "Active",
      description: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (farm: Farm) => {
    setEditingFarm(farm);
    setFormData({
      name: farm.name || "",
      location: farm.location || "",
      size: farm.size || "",
      soil_type: farm.soil_type || "Sandy Loam",
      status: farm.status || "Active",
      description: farm.description || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSaving(true);
      setError("");
      if (editingFarm) {
        await api.farms.update(editingFarm.id, formData);
        setNotification(`Farm "${formData.name}" successfully updated.`);
      } else {
        await api.farms.create(formData);
        setNotification(`Farm "${formData.name}" successfully created.`);
      }
      setIsModalOpen(false);
      await loadFarms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save farm.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setSaving(true);
      await api.farms.delete(id);
      setDeleteConfirmId(null);
      setNotification("Farm removed from database.");
      await loadFarms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete farm.");
    } finally {
      setSaving(false);
    }
  };

  const filteredFarms = useMemo(() => {
    return farms.filter((farm) => {
      const matchesSearch =
        farm.name.toLowerCase().includes(search.toLowerCase()) ||
        (farm.location && farm.location.toLowerCase().includes(search.toLowerCase())) ||
        (farm.soil_type && farm.soil_type.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "all" || farm.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [farms, search, statusFilter]);

  const activeCount = farms.filter((f) => f.status === "Active").length;

  return (
    <AppFrame active="Farms">
      <section className="workspace">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">FARMSYSTEM <span>·</span> LAND &amp; PLOTS</p>
            <h1>Farm Management</h1>
            <p>Track your cultivation parcels, soil profiles, and geographic locations.</p>
          </div>
          <button className="primary-button" onClick={openAddModal} type="button">
            ＋ Add New Farm
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
          <Stat icon="F" label="Total Farms" value={loading ? "—" : String(farms.length)} detail="Registered parcels" />
          <Stat icon="✓" label="Active Cultivation" value={loading ? "—" : String(activeCount)} detail="Currently producing" />
          <Stat
            icon="🌱"
            label="Soil Varieties"
            value={loading ? "—" : String(new Set(farms.map((f) => f.soil_type).filter(Boolean)).size)}
            detail="Monitored profiles"
          />
          <Stat
            icon="📍"
            label="Locations"
            value={loading ? "—" : String(new Set(farms.map((f) => f.location).filter(Boolean)).size)}
            detail="Distinct sites"
          />
        </div>

        <section className="panel">
          <div className="filters-row">
            <label className="search-field">
              <span>Search Farms</span>
              <span className="search-input">
                <span aria-hidden="true">⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, site location, or soil type..."
                />
              </span>
            </label>
            <label>
              <span>Status Filter</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Preparation">Preparation</option>
                <option value="Harvesting">Harvesting</option>
                <option value="Fallow">Fallow</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="dashboard-empty">Loading farm records from backend...</div>
          ) : filteredFarms.length === 0 ? (
            <div className="dashboard-empty">
              <span className="empty-illustration">🌱</span>
              <strong>{farms.length === 0 ? "No farms registered yet." : "No farms match your search."}</strong>
              <p>Add your first Aloe Vera plot to begin linking plants, sensors, and diagnoses.</p>
              {farms.length === 0 && (
                <button className="secondary-button" onClick={openAddModal} type="button">
                  Add Farm Plot
                </button>
              )}
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Farm Name</th>
                    <th>Location</th>
                    <th>Size / Area</th>
                    <th>Soil Profile</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFarms.map((farm) => (
                    <tr key={farm.id}>
                      <td>
                        <strong>{farm.name}</strong>
                        <div style={{ fontSize: "10px", color: "var(--muted)" }}>ID: {farm.id.slice(-8)}</div>
                      </td>
                      <td>{farm.location || "—"}</td>
                      <td>{farm.size || "—"}</td>
                      <td>
                        <span className="tag-pill">{farm.soil_type || "Standard Soil"}</span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            farm.status === "Active"
                              ? "healthy"
                              : farm.status === "Harvesting"
                              ? "healthy"
                              : "attention"
                          }`}
                        >
                          {farm.status || "Active"}
                        </span>
                      </td>
                      <td>{farm.description || "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        <div className="table-actions" style={{ justifyContent: "flex-end" }}>
                          <button
                            className="btn-icon"
                            title="Edit Farm"
                            onClick={() => openEditModal(farm)}
                            type="button"
                          >
                            ✎
                          </button>
                          <button
                            className="btn-icon danger"
                            title="Delete Farm"
                            onClick={() => setDeleteConfirmId(farm.id)}
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
                <h2>{editingFarm ? "Edit Farm Plot" : "Register New Farm"}</h2>
                <button className="modal-close" onClick={() => setIsModalOpen(false)} type="button">✕</button>
              </div>
              <form onSubmit={handleSave}>
                <div className="form-grid">
                  <div className="form-field full">
                    <label>Farm Plot Name *</label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. North Ridge Aloe Nursery"
                    />
                  </div>
                  <div className="form-field">
                    <label>Geographic Location</label>
                    <input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Sector 4, Batangas Valley"
                    />
                  </div>
                  <div className="form-field">
                    <label>Area Size</label>
                    <input
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      placeholder="e.g. 1.5 Hectares / 500 plants"
                    />
                  </div>
                  <div className="form-field">
                    <label>Soil Profile</label>
                    <select
                      value={formData.soil_type}
                      onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                    >
                      <option value="Sandy Loam">Sandy Loam (Optimal for Aloe)</option>
                      <option value="Loamy Sand">Loamy Sand</option>
                      <option value="Clay Loam">Clay Loam</option>
                      <option value="Gravelly Loam">Gravelly Loam</option>
                      <option value="Perlite / Cactus Mix">Perlite / Cactus Mix</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Cultivation Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Preparation">Preparation</option>
                      <option value="Harvesting">Harvesting</option>
                      <option value="Fallow">Fallow</option>
                    </select>
                  </div>
                  <div className="form-field full">
                    <label>Plot Description &amp; Notes</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe irrigation setup, sunlight exposure, or parcel history..."
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
                    {saving ? "Saving..." : editingFarm ? "Save Changes" : "Create Farm"}
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
                <h2>Delete Farm</h2>
                <button className="modal-close" onClick={() => setDeleteConfirmId(null)} type="button">✕</button>
              </div>
              <p style={{ color: "var(--muted)", fontSize: "12px", lineHeight: "1.6" }}>
                Are you sure you want to permanently delete this farm record? This operation cannot be undone.
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

