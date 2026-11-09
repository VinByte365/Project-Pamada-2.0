"use client";

import Link from "next/link";
import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppFrame, Stat } from "@/components/aloe-guard";
import {
  api,
  AdminStats,
  AdminUser,
  DiseaseDetectionResult,
  ScanRecord,
  Plant,
} from "@/lib/api";

type AdminTab =
  | "overview"
  | "users"
  | "plants"
  | "scans"
  | "diseases"
  | "recommendations"
  | "ai_model"
  | "reports"
  | "activity";

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <AppFrame active="Admin Dashboard">
          <section className="workspace">
            <div className="panel dashboard-empty">
              <p>Loading Administration Console...</p>
            </div>
          </section>
        </AppFrame>
      }
    >
      <AdminContent />
    </Suspense>
  );
}

function AdminContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = (searchParams.get("tab") as AdminTab) || "overview";
  const [activeTab, setActiveTab] = useState<AdminTab>(tabParam);

  // Sync tab with URL
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const switchTab = (newTab: AdminTab) => {
    setActiveTab(newTab);
    router.push(`/admin?tab=${newTab}`);
  };

  // State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [diseases, setDiseases] = useState<Record<string, DiseaseDetectionResult>>({});
  const [visionStatus, setVisionStatus] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");

  // Filters & Search
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [plantSearch, setPlantSearch] = useState("");
  const [plantHealthFilter, setPlantHealthFilter] = useState("all");
  const [scanDiseaseFilter, setScanDiseaseFilter] = useState("all");

  // Action modals
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [actionScanId, setActionScanId] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [editingDisease, setEditingDisease] = useState<{
    key: string;
    name: string;
    description: string;
    treatment: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError("");

      // Validate administrator privileges
      const me = await api.auth.me().catch(() => null);
      if (!me || me.role !== "admin") {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(true);

      const [statsData, usersData, plantsData, scansData, diseaseData, vStatus, analyticsData, activityData] =
        await Promise.all([
          api.admin.getStats().catch(() => null),
          api.admin.getUsers().catch(() => []),
          api.admin.getPlants().catch(() => []),
          api.admin.getScans().catch(() => []),
          api.admin.getDiseases().catch(() => ({})),
          api.vision.status().catch(() => null),
          api.admin.getAnalytics().catch(() => null),
          api.admin.getActivity().catch(() => []),
        ]);

      setStats(statsData);
      setUsers(usersData || []);
      setPlants(plantsData || []);
      setScans(scansData || []);
      setDiseases(diseaseData || {});
      setVisionStatus(vStatus);
      setAnalytics(analyticsData);
      setActivityLogs(activityData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, userRoleFilter]);

  // Filtered plants
  const filteredPlants = useMemo(() => {
    return plants.filter((p) => {
      const matchesSearch =
        p.name?.toLowerCase().includes(plantSearch.toLowerCase()) ||
        p.variety?.toLowerCase().includes(plantSearch.toLowerCase());
      const matchesHealth =
        plantHealthFilter === "all" || p.health_status === plantHealthFilter;
      return matchesSearch && matchesHealth;
    });
  }, [plants, plantSearch, plantHealthFilter]);

  // Filtered scans
  const filteredScans = useMemo(() => {
    return scans.filter((s) => {
      const matchesDisease =
        scanDiseaseFilter === "all" || s.diagnosis === scanDiseaseFilter;
      return matchesDisease;
    });
  }, [scans, scanDiseaseFilter]);

  // Admin action handlers
  const handleRoleToggle = async (userId: string, currentRole: string) => {
    try {
      setBusy(true);
      const newRole = currentRole === "admin" ? "grower" : "admin";
      await api.admin.updateRole(userId, newRole);
      setNotification(`User role updated to ${newRole.toUpperCase()}.`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setBusy(true);
      await api.admin.deleteUser(userId);
      setNotification("User account successfully removed.");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setActionUserId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete user.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteScan = async (scanId: string) => {
    try {
      setBusy(true);
      await api.admin.deleteScan(scanId);
      setNotification("Scan record removed from system audit.");
      setScans((prev) => prev.filter((s) => s.id !== scanId));
      setActionScanId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete scan.");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDisease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDisease) return;
    try {
      setBusy(true);
      await api.admin.updateDisease(editingDisease.key, {
        description: editingDisease.description,
        treatments: [editingDisease.treatment],
      });
      setNotification(`Clinical protocols for ${editingDisease.name} synchronized to growers.`);
      setDiseases((prev) => ({
        ...prev,
        [editingDisease.key]: {
          ...prev[editingDisease.key],
          description: editingDisease.description,
          treatments: [
            editingDisease.treatment,
            ...(prev[editingDisease.key]?.treatments?.slice(1) || []),
          ],
        },
      }));
      setEditingDisease(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update disease protocol.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AppFrame active="Admin Dashboard">
        <section className="workspace">
          <div className="panel dashboard-empty">
            <p>Authenticating administrator credentials &amp; loading database telemetry...</p>
          </div>
        </section>
      </AppFrame>
    );
  }

  // Strict RBAC Lockout for non-admins
  if (isAdmin === false) {
    return (
      <AppFrame active="Admin Dashboard">
        <section className="workspace">
          <div
            className="panel"
            style={{
              padding: "48px 24px",
              textAlign: "center",
              background: "#fff",
              borderRadius: "10px",
              border: "1px solid #fee2e2",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
            <span className="status-badge attention">RESTRICTED PRIVILEGES</span>
            <h1 style={{ color: "var(--forest)", margin: "14px 0 8px", fontSize: "28px" }}>
              Administrator Access Required
            </h1>
            <p style={{ maxWidth: "520px", margin: "0 auto 24px", color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
              You are signed in as an ordinary grower account. The administrative dashboard, user management, and system-wide audits are restricted exclusively to certified system administrators.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <Link href="/dashboard" className="primary-button">
                Return to Cultivation Dashboard
              </Link>
              <Link href="/settings" className="secondary-button">
                Account Settings
              </Link>
            </div>
          </div>
        </section>
      </AppFrame>
    );
  }

  return (
    <AppFrame active="Admin Dashboard">
      <section className="workspace">
        {/* Management Header */}
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">SYSTEM GOVERNANCE &amp; AUDIT</p>
            <h1>Administration Console</h1>
            <p className="muted">
              Centralized administration portal for managing users, plant records, scan audits, AI models, and clinical disease protocols.
            </p>
          </div>
          <div className="workspace-actions">
            <button className="secondary-button" onClick={loadAdminData} type="button">
              ↻ Refresh Telemetry
            </button>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div className="status-badge healthy" style={{ display: "block", padding: "10px 16px", marginBottom: "16px" }}>
            ✓ {notification}
          </div>
        )}
        {error && (
          <div className="status-badge attention" style={{ display: "block", padding: "10px 16px", marginBottom: "16px" }}>
            ⚠ {error}
          </div>
        )}

        {/* Admin Navigation Tabs (Management Only) */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            borderBottom: "1px solid #e5e7eb",
            marginBottom: "24px",
            overflowX: "auto",
            paddingBottom: "4px",
          }}
        >
          {[
            { id: "overview", label: "Dashboard Overview", icon: "📊" },
            { id: "users", label: `Users (${users.length})`, icon: "👥" },
            { id: "plants", label: `Plant Records (${plants.length})`, icon: "🌿" },
            { id: "scans", label: `Scan Audit (${scans.length})`, icon: "🔬" },
            { id: "diseases", label: `Disease Library (${Object.keys(diseases).length})`, icon: "🩺" },
            { id: "recommendations", label: "Recommendations", icon: "💡" },
            { id: "ai_model", label: "AI Models & Telemetry", icon: "🧠" },
            { id: "reports", label: "Reports & Analytics", icon: "📈" },
            { id: "activity", label: `Activity Logs (${activityLogs.length})`, icon: "📋" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id as AdminTab)}
              type="button"
              style={{
                padding: "8px 14px",
                borderRadius: "6px",
                border: "none",
                background: activeTab === tab.id ? "var(--forest)" : "transparent",
                color: activeTab === tab.id ? "#ffffff" : "var(--muted)",
                fontWeight: activeTab === tab.id ? 600 : 500,
                fontSize: "12px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === "overview" && stats && (
          <>
            <div className="stats-grid">
              <Stat icon="👥" label="Total Users" value={String(stats.users)} detail="Registered accounts" />
              <Stat icon="🌿" label="Total Plants" value={String(stats.plants)} detail="Specimens monitored" />
              <Stat icon="🔬" label="Total Scans" value={String(stats.scans)} detail="AI inspections" />
              <Stat icon="✓" label="Healthy Plants" value={String(stats.healthy_diagnoses)} detail="No pathogen detected" />
              <Stat icon="⚠" label="Disease Rate" value={`${stats.disease_rate_pct}%`} detail="Foliar pathology rate" warning={stats.disease_rate_pct > 20} />
              <Stat icon="🚜" label="Active Farms" value={String(stats.farms)} detail="Cultivation sites" />
              <Stat icon="💧" label="Soil Sensors" value={String(stats.sensors)} detail="Telemetry nodes" />
              <Stat icon="🧠" label="AI Status" value="Online" detail="YOLOv8 & Vision Engine" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "24px" }}>
              {/* Recent User Registrations */}
              <div className="panel" style={{ padding: "20px", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", color: "var(--forest)" }}>Recent User Registrations</h3>
                  <button onClick={() => switchTab("users")} className="secondary-button" style={{ fontSize: "11px", padding: "4px 8px" }}>
                    Manage All →
                  </button>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice(0, 5).map((u) => (
                        <tr key={u.id}>
                          <td>
                            <strong>{u.name}</strong>
                            <div style={{ fontSize: "11px", color: "var(--muted)" }}>{u.email}</div>
                          </td>
                          <td>
                            <span className={`tag-pill ${u.role === "admin" ? "warning" : "success"}`}>
                              {u.role || "grower"}
                            </span>
                          </td>
                          <td style={{ fontSize: "11px" }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Scan Audit */}
              <div className="panel" style={{ padding: "20px", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", color: "var(--forest)" }}>Recent AI Plant Scans</h3>
                  <button onClick={() => switchTab("scans")} className="secondary-button" style={{ fontSize: "11px", padding: "4px 8px" }}>
                    Audit All →
                  </button>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Specimen</th>
                        <th>Diagnosis</th>
                        <th>Confidence</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scans.slice(0, 5).map((s) => (
                        <tr key={s.id}>
                          <td><strong>{s.plantName || "Aloe Specimen"}</strong></td>
                          <td>
                            <span className={`tag-pill ${s.diagnosis === "Healthy" ? "success" : "warning"}`}>
                              {s.diagnosis}
                            </span>
                          </td>
                          <td>{s.confidence ? `${s.confidence}%` : "—"}</td>
                          <td style={{ fontSize: "11px" }}>{new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* AI Engine Status Card */}
            <div className="panel" style={{ marginTop: "20px", padding: "20px", borderRadius: "8px", background: "#f8fafc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ margin: 0, color: "var(--forest)" }}>Active Vision AI Inference Service</h4>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                    Deep Learning YOLOv8 weights (<code>bestDisease.pt</code> &amp; <code>bestAge.pt</code>) paired with Foliar Chlorophyll Spectrum Analyzer.
                  </p>
                </div>
                <button onClick={() => switchTab("ai_model")} className="secondary-button" style={{ fontSize: "11px", padding: "6px 12px" }}>
                  View Model Architecture →
                </button>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === "users" && (
          <section className="panel" style={{ padding: "24px", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2 style={{ color: "var(--forest)", margin: 0, fontSize: "18px" }}>Registered Users Management</h2>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                  Audit system accounts, change user permissions, and review user cultivation volumes.
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "6px", border: "1px solid #ccc", width: 220 }}
                />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  <option value="all">All Roles</option>
                  <option value="grower">Growers Only</option>
                  <option value="admin">Admins Only</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Account Holder</th>
                    <th>Email Address</th>
                    <th>Assigned Role</th>
                    <th>Specimens</th>
                    <th>Scans Performed</th>
                    <th>Registered</th>
                    <th style={{ textAlign: "right" }}>Governance Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td><strong>{u.name}</strong></td>
                      <td><code>{u.email}</code></td>
                      <td>
                        <span className={`tag-pill ${u.role === "admin" ? "warning" : "success"}`}>
                          {(u.role || "grower").toUpperCase()}
                        </span>
                      </td>
                      <td>{u.plants_count ?? 0} plants</td>
                      <td>{u.scans_count ?? 0} scans</td>
                      <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        <div className="table-actions" style={{ justifyContent: "flex-end", gap: "6px" }}>
                          <button
                            type="button"
                            className="secondary-button"
                            style={{ fontSize: "11px", padding: "4px 8px" }}
                            onClick={() => handleRoleToggle(u.id, u.role || "grower")}
                            disabled={busy}
                          >
                            {u.role === "admin" ? "Demote to Grower" : "Promote to Admin"}
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            title="Delete user account"
                            onClick={() => setActionUserId(u.id)}
                            disabled={busy}
                            style={{ color: "var(--danger)" }}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 3: PLANT RECORDS MANAGEMENT */}
        {activeTab === "plants" && (
          <section className="panel" style={{ padding: "24px", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2 style={{ color: "var(--forest)", margin: 0, fontSize: "18px" }}>System-Wide Plant Records</h2>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                  Auditing and management of all Aloe Vera specimens submitted across all growers.
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Search plant name or variety..."
                  value={plantSearch}
                  onChange={(e) => setPlantSearch(e.target.value)}
                  style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "6px", border: "1px solid #ccc", width: 220 }}
                />
                <select
                  value={plantHealthFilter}
                  onChange={(e) => setPlantHealthFilter(e.target.value)}
                  style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  <option value="all">All Health Conditions</option>
                  <option value="Healthy">Healthy Specimens</option>
                  <option value="Leaf Spot">Leaf Spot</option>
                  <option value="Root Rot">Root Rot</option>
                  <option value="Sunburn">Sunburn</option>
                  <option value="Mealy Bugs">Mealy Bugs</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Plant ID</th>
                    <th>Specimen Name</th>
                    <th>Botanical Variety</th>
                    <th>Vegetative Stage</th>
                    <th>Health Status</th>
                    <th>Owner Identifier</th>
                    <th>Registered Date</th>
                    <th style={{ textAlign: "right" }}>Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlants.map((p) => (
                    <tr key={p.id}>
                      <td><code>{p.id ? p.id.slice(-8) : "—"}</code></td>
                      <td><strong>{p.name}</strong></td>
                      <td><em>{p.variety}</em></td>
                      <td>{p.stage || "Developing"}</td>
                      <td>
                        <span className={`tag-pill ${p.health_status === "Healthy" ? "success" : "warning"}`}>
                          {p.health_status}
                        </span>
                      </td>
                      <td><code style={{ fontSize: "11px" }}>{p.owner_id ? p.owner_id.slice(-8) : "—"}</code></td>
                      <td>{p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="secondary-button"
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                          onClick={() => setSelectedPlant(p)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredPlants.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>
                        No plant records matching search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 4: SCAN RECORDS AUDIT */}
        {activeTab === "scans" && (
          <section className="panel" style={{ padding: "24px", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2 style={{ color: "var(--forest)", margin: 0, fontSize: "18px" }}>Plant Scans Audit Trail</h2>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                  Administrative inspection of AI predictions, lesion detections, and confidence scores across all scans.
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <select
                  value={scanDiseaseFilter}
                  onChange={(e) => setScanDiseaseFilter(e.target.value)}
                  style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  <option value="all">All Classifications</option>
                  <option value="Healthy">Healthy</option>
                  <option value="Leaf Spot">Leaf Spot</option>
                  <option value="Root Rot">Root Rot</option>
                  <option value="Sunburn">Sunburn</option>
                  <option value="Mealy Bugs">Mealy Bugs</option>
                  <option value="Anthracnose">Anthracnose</option>
                  <option value="Aloe Rust">Aloe Rust</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Scan Ref</th>
                    <th>Specimen</th>
                    <th>Image</th>
                    <th>AI Classification</th>
                    <th>Severity</th>
                    <th>Confidence</th>
                    <th>Maturity Stage</th>
                    <th>Timestamp</th>
                    <th style={{ textAlign: "right" }}>Audit Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScans.map((s) => (
                    <tr key={s.id}>
                      <td><code>{s.id.slice(-8)}</code></td>
                      <td><strong>{s.plantName || "Aloe Specimen"}</strong></td>
                      <td>
                        {s.imageUrl ? (
                          <img
                            src={s.imageUrl}
                            alt="Scan thumb"
                            style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4 }}
                          />
                        ) : (
                          <span style={{ fontSize: "10px", color: "#999" }}>No image</span>
                        )}
                      </td>
                      <td>
                        <span className={`tag-pill ${s.diagnosis === "Healthy" ? "success" : "warning"}`}>
                          {s.diagnosis}
                        </span>
                      </td>
                      <td>{s.severity || "None"}</td>
                      <td><strong>{s.confidence ? `${s.confidence}%` : "—"}</strong></td>
                      <td>{s.maturityStage || "Developing"}</td>
                      <td>{new Date(s.createdAt).toLocaleString()}</td>
                      <td style={{ textAlign: "right" }}>
                        <div className="table-actions" style={{ justifyContent: "flex-end", gap: "6px" }}>
                          <Link href={`/results?id=${s.id}`} className="secondary-button" style={{ fontSize: "11px", padding: "4px 8px" }}>
                            View Report
                          </Link>
                          <button
                            type="button"
                            className="btn-icon"
                            title="Delete Scan Record"
                            onClick={() => setActionScanId(s.id)}
                            style={{ color: "var(--danger)" }}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 5: DISEASE INFORMATION MANAGEMENT */}
        {activeTab === "diseases" && (
          <div>
            <div style={{ marginBottom: "16px" }}>
              <h2 style={{ color: "var(--forest)", margin: 0, fontSize: "18px" }}>Aloe Vera Pathology &amp; Pest Knowledge Base</h2>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                Edit disease descriptions, symptoms, and mitigation treatments. Updates synchronize immediately to the user-facing Care Guides.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "20px" }}>
              {Object.entries(diseases).map(([key, info]) => (
                <div key={key} className="panel" style={{ padding: "20px", borderRadius: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", color: "var(--forest)" }}>{info.name}</h3>
                    <span className={`status-badge ${info.severity === "Severe" ? "attention" : info.severity === "None" ? "healthy" : "pending"}`}>
                      {info.severity}
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#4b5563", lineHeight: 1.5, margin: "8px 0" }}>
                    {info.description}
                  </p>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "8px" }}>
                    <strong>Key Symptoms: </strong> {info.symptoms?.join(", ")}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                    <strong>Direct Treatment: </strong> {info.treatments?.[0]}
                  </div>
                  <div style={{ marginTop: "14px", display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ fontSize: "11px", padding: "4px 10px" }}
                      onClick={() =>
                        setEditingDisease({
                          key,
                          name: info.name,
                          description: info.description || "",
                          treatment: info.treatments?.[0] || "",
                        })
                      }
                    >
                      ✏ Edit Guidance Protocol
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: RECOMMENDATION MANAGEMENT */}
        {activeTab === "recommendations" && (
          <section className="panel" style={{ padding: "24px", borderRadius: "8px" }}>
            <h2 style={{ color: "var(--forest)", margin: "0 0 8px", fontSize: "18px" }}>Plant Care &amp; Harvesting Recommendations</h2>
            <p style={{ margin: "0 0 20px", fontSize: "12px", color: "var(--muted)" }}>
              Centralized rules connecting disease diagnoses, soil sensor telemetry, and harvest readiness to actionable protocols.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--forest)", margin: "0 0 10px" }}>🌾 Harvest Maturity Guidance Rules</h4>
                <ul style={{ fontSize: "12px", color: "#4b5563", lineHeight: 1.6, paddingLeft: "18px" }}>
                  <li><strong>Mature / Ready:</strong> Leaf thickness &gt;= 13mm, leaf count &gt;= 12. Guidance: Clean incision at base of outer leaves.</li>
                  <li><strong>Developing:</strong> Active vegetative growth, 6-12 weeks before harvest. Guidance: Maintain consistent irrigation.</li>
                  <li><strong>Young / Juvenile:</strong> Fewer than 10 leaves, blade thickness &lt; 10mm. Guidance: Do not harvest to preserve carbohydrate reserves.</li>
                </ul>
              </div>

              <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--forest)", margin: "0 0 10px" }}>💧 Soil Nutrition &amp; NPK Guidance Rules</h4>
                <ul style={{ fontSize: "12px", color: "#4b5563", lineHeight: 1.6, paddingLeft: "18px" }}>
                  <li><strong>Nitrogen (N &lt; 20 mg/kg):</strong> Apply light diluted organic balanced fertilizer (10-10-10) during spring/summer.</li>
                  <li><strong>Potassium (K &lt; 150 mg/kg):</strong> Top-dress with wood ash or potassium sulfate to strengthen gel parenchyma.</li>
                  <li><strong>Moisture (&gt; 50%):</strong> Withhold water immediately. High moisture triggers fungal root rot.</li>
                  <li><strong>Soil pH (6.0 - 7.2):</strong> Ideal range for Aloe barbadensis Miller.</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* TAB 7: AI MODEL MANAGEMENT & STATUS */}
        {activeTab === "ai_model" && visionStatus && (
          <div className="panel" style={{ padding: "24px", borderRadius: "8px" }}>
            <p className="eyebrow">NEURAL &amp; BOTANICAL TELEMETRY</p>
            <h2 style={{ color: "var(--forest)", margin: "4px 0 16px" }}>{visionStatus.engine}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", fontSize: "13px" }}>
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
                <h4 style={{ margin: "0 0 8px", color: "var(--forest)" }}>YOLOv8 Disease Model (bestDisease.pt)</h4>
                <div><strong>Weights File:</strong> <code>backend/MLmodel/bestDisease.pt (52.0 MB)</code></div>
                <div><strong>Architecture:</strong> Ultralytics YOLOv8 Detection</div>
                <div><strong>Inference Dimensions:</strong> 640x640 pixels</div>
                <div><strong>Status:</strong> <span className="status-badge healthy">Online / Loaded</span></div>
                <div style={{ marginTop: "8px" }}>
                  <strong>Supported Classes (9 Categories):</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                    {visionStatus.supported_diseases?.map((d: string) => (
                      <span key={d} className="tag-pill info" style={{ fontSize: "10px" }}>
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
                <h4 style={{ margin: "0 0 8px", color: "var(--forest)" }}>YOLOv8 Age &amp; Leaf Model (bestAge.pt)</h4>
                <div><strong>Weights File:</strong> <code>backend/MLmodel/bestAge.pt (19.1 MB)</code></div>
                <div><strong>Architecture:</strong> Ultralytics YOLOv8 Leaf Counter</div>
                <div><strong>Status:</strong> <span className="status-badge healthy">Online / Loaded</span></div>
                <div style={{ marginTop: "8px" }}>
                  <strong>Maturity Classifications:</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                    {visionStatus.maturity_stages?.map((m: string) => (
                      <span key={m} className="tag-pill" style={{ fontSize: "10px" }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "20px", padding: "14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", fontSize: "12px", color: "#166534" }}>
              ✓ <strong>Species Gate Active:</strong> Foliar Chlorophyll Spectrum Analysis automatically verifies <em>Aloe barbadensis Miller</em> species. Non-Aloe Vera uploads are rejected at the gate with HTTP 422 before deep neural processing.
            </div>
          </div>
        )}

        {/* TAB 8: REPORTS & ANALYTICS */}
        {activeTab === "reports" && analytics && (
          <section className="panel" style={{ padding: "24px", borderRadius: "8px" }}>
            <h2 style={{ color: "var(--forest)", margin: "0 0 16px", fontSize: "18px" }}>System Epidemiological Analytics</h2>
            
            <div className="stats-grid" style={{ marginBottom: "20px" }}>
              <Stat icon="🔬" label="Total Scans Inspected" value={String(analytics.total_scans)} />
              <Stat icon="✓" label="Healthy Specimens" value={String(analytics.healthy_count)} />
              <Stat icon="⚠" label="Diseased Lesions" value={String(analytics.diseased_count)} warning={analytics.diseased_count > 0} />
              <Stat icon="📈" label="Overall Health Rate" value={`${analytics.healthy_rate_pct}%`} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Disease Breakdown */}
              <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--forest)", margin: "0 0 12px" }}>Pathology Distribution</h4>
                {Object.entries(analytics.disease_distribution || {}).map(([dName, count]: [string, any]) => (
                  <div key={dName} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6", fontSize: "12px" }}>
                    <span>{dName}</span>
                    <strong>{count} case(s)</strong>
                  </div>
                ))}
              </div>

              {/* Maturity Breakdown */}
              <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--forest)", margin: "0 0 12px" }}>Harvest Maturity Distribution</h4>
                {Object.entries(analytics.maturity_distribution || {}).map(([stage, count]: [string, any]) => (
                  <div key={stage} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6", fontSize: "12px" }}>
                    <span>{stage}</span>
                    <strong>{count} specimen(s)</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* TAB 9: ACTIVITY LOGS */}
        {activeTab === "activity" && (
          <section className="panel" style={{ padding: "24px", borderRadius: "8px" }}>
            <h2 style={{ color: "var(--forest)", margin: "0 0 16px", fontSize: "18px" }}>Chronological System Activity Logs</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "6px",
                    background: "#f8fafc",
                    borderLeft: `4px solid ${log.type === "user" ? "#3b82f6" : "#10b981"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "13px", color: "var(--forest)" }}>{log.title}</strong>
                    <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>{log.description}</div>
                  </div>
                  <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}
                  </span>
                </div>
              ))}
              {activityLogs.length === 0 && (
                <p style={{ textAlign: "center", color: "var(--muted)", padding: "20px" }}>No recent activity records found.</p>
              )}
            </div>
          </section>
        )}

        {/* Delete User Modal */}
        {actionUserId && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card">
              <div className="modal-header">
                <h2>Delete User Account?</h2>
                <button className="btn-icon" onClick={() => setActionUserId(null)} type="button">✕</button>
              </div>
              <p style={{ margin: "14px 0", color: "var(--muted)", fontSize: "13px" }}>
                Are you sure you want to permanently remove this user account? All associated plant scans will remain in system archives.
              </p>
              <div className="modal-actions">
                <button className="secondary-button" onClick={() => setActionUserId(null)} type="button" disabled={busy}>
                  Cancel
                </button>
                <button
                  className="primary-button"
                  onClick={() => handleDeleteUser(actionUserId)}
                  type="button"
                  disabled={busy}
                  style={{ background: "var(--danger)" }}
                >
                  {busy ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Scan Modal */}
        {actionScanId && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card">
              <div className="modal-header">
                <h2>Delete Scan Record?</h2>
                <button className="btn-icon" onClick={() => setActionScanId(null)} type="button">✕</button>
              </div>
              <p style={{ margin: "14px 0", color: "var(--muted)", fontSize: "13px" }}>
                Are you sure you want to permanently delete this scan record from the database audit feed?
              </p>
              <div className="modal-actions">
                <button className="secondary-button" onClick={() => setActionScanId(null)} type="button" disabled={busy}>
                  Cancel
                </button>
                <button
                  className="primary-button"
                  onClick={() => handleDeleteScan(actionScanId)}
                  type="button"
                  disabled={busy}
                  style={{ background: "var(--danger)" }}
                >
                  {busy ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plant Details Modal */}
        {selectedPlant && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card" style={{ maxWidth: "520px", width: "100%" }}>
              <div className="modal-header">
                <h2>Plant Details: {selectedPlant.name}</h2>
                <button className="btn-icon" onClick={() => setSelectedPlant(null)} type="button">✕</button>
              </div>
              <div style={{ marginTop: "14px", fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div><strong>Variety:</strong> {selectedPlant.variety}</div>
                <div><strong>Vegetative Stage:</strong> {selectedPlant.stage}</div>
                <div><strong>Health Status:</strong> {selectedPlant.health_status}</div>
                <div><strong>Owner ID:</strong> <code>{selectedPlant.owner_id}</code></div>
                <div><strong>Registered:</strong> {selectedPlant.created_at ? new Date(selectedPlant.created_at).toLocaleString() : "—"}</div>
                {selectedPlant.notes && <div><strong>Notes:</strong> {selectedPlant.notes}</div>}
              </div>
              <div className="modal-actions" style={{ marginTop: "16px" }}>
                <button className="primary-button" onClick={() => setSelectedPlant(null)} type="button">
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Disease / Recommendation Protocol Modal */}
        {editingDisease && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card" style={{ maxWidth: "560px", width: "100%" }}>
              <div className="modal-header">
                <h2>Edit Care Protocol: {editingDisease.name}</h2>
                <button className="btn-icon" onClick={() => setEditingDisease(null)} type="button">✕</button>
              </div>
              <form onSubmit={handleSaveDisease} style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                    Clinical Pathology Description
                  </label>
                  <textarea
                    rows={3}
                    className="input-field"
                    style={{ width: "100%", padding: "8px", fontSize: "12px", borderRadius: "6px", border: "1px solid #ccc" }}
                    value={editingDisease.description}
                    onChange={(e) => setEditingDisease({ ...editingDisease, description: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                    Primary Treatment Recommendation (Synchronized to Growers)
                  </label>
                  <textarea
                    rows={3}
                    className="input-field"
                    style={{ width: "100%", padding: "8px", fontSize: "12px", borderRadius: "6px", border: "1px solid #ccc" }}
                    value={editingDisease.treatment}
                    onChange={(e) => setEditingDisease({ ...editingDisease, treatment: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-actions" style={{ marginTop: "10px" }}>
                  <button className="secondary-button" onClick={() => setEditingDisease(null)} type="button" disabled={busy}>
                    Cancel
                  </button>
                  <button className="primary-button" type="submit" disabled={busy}>
                    {busy ? "Saving & Syncing..." : "Save & Sync to Growers"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </AppFrame>
  );
}
