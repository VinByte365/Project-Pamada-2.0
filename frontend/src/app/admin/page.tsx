"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppFrame, Stat } from "@/components/aloe-guard";
import {
  api,
  AdminStats,
  AdminUser,
  DiseaseDetectionResult,
  ScanRecord,
} from "@/lib/api";

type AdminTab = "overview" | "users" | "scans" | "diseases" | "ai_model";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [diseases, setDiseases] = useState<Record<string, DiseaseDetectionResult>>({});
  const [visionStatus, setVisionStatus] = useState<any>(null);

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");

  // Action states
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [actionScanId, setActionScanId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError("");

      // Check current user role
      const me = await api.auth.me().catch(() => null);
      if (!me || me.role !== "admin") {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(true);

      const [statsData, usersData, scansData, diseaseData, vStatus] =
        await Promise.all([
          api.admin.getStats().catch(() => null),
          api.admin.getUsers().catch(() => []),
          api.admin.getScans().catch(() => []),
          api.admin.getDiseases().catch(() => ({})),
          api.vision.status().catch(() => null),
        ]);

      setStats(statsData);
      setUsers(usersData || []);
      setScans(scansData || []);
      setDiseases(diseaseData || {});
      setVisionStatus(vStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    try {
      setBusy(true);
      const newRole = currentRole === "admin" ? "grower" : "admin";
      await api.admin.updateRole(userId, newRole);
      setNotification(`User role updated to ${newRole}.`);
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
      setNotification("Scan record removed from system.");
      setScans((prev) => prev.filter((s) => s.id !== scanId));
      setActionScanId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete scan.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AppFrame active="Admin">
        <section className="workspace">
          <div className="panel dashboard-empty">
            <p>Authenticating administrator credentials &amp; loading database telemetry...</p>
          </div>
        </section>
      </AppFrame>
    );
  }

  // Phase 12 Requirement: Do not allow ordinary users to access administrative functions
  if (isAdmin === false) {
    return (
      <AppFrame active="Admin">
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
              You are signed in as an ordinary grower account. The administrative dashboard, user management, and system-wide audits are restricted to certified administrators.
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
    <AppFrame active="Admin">
      <section className="workspace">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">FARMSYSTEM <span>·</span> ADMINISTRATIVE OVERSIGHT &amp; GOVERNANCE</p>
            <h1>System Administration Portal</h1>
            <p>Global oversight of grower accounts, plant scan records, AI diagnostic engines, and database collections.</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <span className="status-badge healthy" style={{ alignSelf: "center" }}>
              ● Admin Session Active
            </span>
            <Link href="/dashboard" className="secondary-button">
              Grower View
            </Link>
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

        {/* System Overview Stats Cards */}
        {stats && (
          <div className="stats-grid">
            <Stat
              icon="👥"
              label="Registered Growers"
              value={String(stats.users)}
              detail="Active farmer accounts"
            />
            <Stat
              icon="🌿"
              label="Catalogued Plants"
              value={String(stats.plants)}
              detail={`${stats.farms} farm parcel plots`}
            />
            <Stat
              icon="📸"
              label="Foliar Scans Audited"
              value={String(stats.scans)}
              detail={`${stats.healthy_diagnoses} healthy (${100 - stats.disease_rate_pct}%)`}
            />
            <Stat
              icon="💰"
              label="Total Net Margins"
              value={`$${stats.total_profit.toLocaleString()}`}
              detail={`$${stats.total_revenue.toLocaleString()} gross revenue`}
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="detector-tabs" style={{ margin: "24px 0 16px" }} role="tablist">
          <button
            type="button"
            className={activeTab === "overview" ? "selected" : ""}
            onClick={() => setActiveTab("overview")}
          >
            System Metrics
          </button>
          <button
            type="button"
            className={activeTab === "users" ? "selected" : ""}
            onClick={() => setActiveTab("users")}
          >
            User Management ({users.length})
          </button>
          <button
            type="button"
            className={activeTab === "scans" ? "selected" : ""}
            onClick={() => setActiveTab("scans")}
          >
            Plant Scans Audit ({scans.length})
          </button>
          <button
            type="button"
            className={activeTab === "diseases" ? "selected" : ""}
            onClick={() => setActiveTab("diseases")}
          >
            Disease Library ({Object.keys(diseases).length})
          </button>
          <button
            type="button"
            className={activeTab === "ai_model" ? "selected" : ""}
            onClick={() => setActiveTab("ai_model")}
          >
            AI Engine Diagnostics
          </button>
        </div>

        {/* Tab 1: System Metrics */}
        {activeTab === "overview" && stats && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
            <div className="panel" style={{ padding: "24px", borderRadius: "8px" }}>
              <p className="eyebrow">DATABASE COLLECTIONS AUDIT</p>
              <h3 style={{ margin: "4px 0 16px", color: "var(--forest)" }}>Live MongoDB Record Counts</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                <div style={{ padding: "12px", background: "#f8faf7", borderRadius: "6px" }}>
                  <strong>Users: </strong> {stats.users} documents
                </div>
                <div style={{ padding: "12px", background: "#f8faf7", borderRadius: "6px" }}>
                  <strong>Farm Plots: </strong> {stats.farms} documents
                </div>
                <div style={{ padding: "12px", background: "#f8faf7", borderRadius: "6px" }}>
                  <strong>Plants Inventory: </strong> {stats.plants} documents
                </div>
                <div style={{ padding: "12px", background: "#f8faf7", borderRadius: "6px" }}>
                  <strong>Pathology Diagnoses: </strong> {stats.diagnoses} documents
                </div>
                <div style={{ padding: "12px", background: "#f8faf7", borderRadius: "6px" }}>
                  <strong>Soil Telemetry Logs: </strong> {stats.sensors} documents
                </div>
                <div style={{ padding: "12px", background: "#f8faf7", borderRadius: "6px" }}>
                  <strong>Harvest Maturity Logs: </strong> {stats.maturity} documents
                </div>
                <div style={{ padding: "12px", background: "#f8faf7", borderRadius: "6px" }}>
                  <strong>Unified Scans Archive: </strong> {stats.scans} documents
                </div>
                <div style={{ padding: "12px", background: "#f8faf7", borderRadius: "6px" }}>
                  <strong>Profit &amp; Yield Reports: </strong> {stats.reports} documents
                </div>
              </div>
            </div>

            <div className="panel" style={{ padding: "24px", borderRadius: "8px" }}>
              <p className="eyebrow">AI MODEL FOOTPRINT &amp; STATUS</p>
              <h3 style={{ margin: "4px 0 16px", color: "var(--forest)" }}>Engine Capabilities</h3>
              <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: 1.6 }}>
                The AloeGuard Vision AI service operates on server-side foliar chromatic decomposition and succulent morphology verification.
              </p>
              <ul style={{ margin: "14px 0", paddingLeft: "18px", fontSize: "12px", color: "#374151", lineHeight: 1.7 }}>
                <li>Species Verification: <strong>Aloe barbadensis Miller</strong> (active)</li>
                <li>Non-Aloe Rejection: <strong>Strict Chlorophyll &amp; Succulent Profile</strong></li>
                <li>Foliar Pathologies Supported: <strong>9 botanical categories</strong></li>
                <li>Harvest Maturity Evaluator: <strong>Active (Leaf thickness &amp; count)</strong></li>
                <li>Hardware Acceleration: <strong>CPU Multiprocessing</strong></li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: User Management */}
        {activeTab === "users" && (
          <section className="panel" style={{ padding: "20px" }}>
            <div className="panel-heading" style={{ marginBottom: "16px" }}>
              <div>
                <p className="eyebrow">ACCESS CONTROL &amp; ROLES</p>
                <h2>Registered Platform Users ({users.length})</h2>
              </div>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>System Role</th>
                    <th>Plants Catalogued</th>
                    <th>Scans</th>
                    <th>Created</th>
                    <th style={{ textAlign: "right" }}>Governance Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td><code>{u.id.slice(-8)}</code></td>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`status-badge ${u.role === "admin" ? "attention" : "healthy"}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td>{u.plants_count ?? 0}</td>
                      <td>{u.scans_count ?? 0}</td>
                      <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        <div className="table-actions" style={{ justifyContent: "flex-end", gap: "8px" }}>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => handleRoleToggle(u.id, u.role)}
                            disabled={busy}
                            style={{ fontSize: "11px", padding: "4px 8px" }}
                          >
                            {u.role === "admin" ? "Demote to Grower" : "Promote to Admin"}
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            title="Delete User"
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

        {/* Tab 3: Plant Scans Audit */}
        {activeTab === "scans" && (
          <section className="panel" style={{ padding: "20px" }}>
            <div className="panel-heading" style={{ marginBottom: "16px" }}>
              <div>
                <p className="eyebrow">AUDIT &amp; MODERATION</p>
                <h2>System-Wide Plant Scans ({scans.length})</h2>
              </div>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Scan ID</th>
                    <th>Specimen Label</th>
                    <th>Diagnosis Classification</th>
                    <th>Severity</th>
                    <th>Confidence</th>
                    <th>Maturity Stage</th>
                    <th>Timestamp</th>
                    <th style={{ textAlign: "right" }}>Audit Action</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((s) => (
                    <tr key={s.id}>
                      <td><code>{s.id.slice(-8)}</code></td>
                      <td><strong>{s.plantName || "Aloe Specimen"}</strong></td>
                      <td>
                        <span className={`tag-pill ${s.diagnosis === "Healthy" ? "success" : "warning"}`}>
                          {s.diagnosis}
                        </span>
                      </td>
                      <td>{s.severity || "None"}</td>
                      <td>{s.confidence ? `${s.confidence}%` : "—"}</td>
                      <td>{s.maturityStage || "Developing"}</td>
                      <td>{new Date(s.createdAt).toLocaleString()}</td>
                      <td style={{ textAlign: "right" }}>
                        <div className="table-actions" style={{ justifyContent: "flex-end", gap: "8px" }}>
                          <Link href={`/results?id=${s.id}`} className="secondary-button" style={{ fontSize: "11px", padding: "4px 8px" }}>
                            View Report
                          </Link>
                          <button
                            type="button"
                            className="btn-icon"
                            title="Delete Scan"
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

        {/* Tab 4: Disease Library */}
        {activeTab === "diseases" && (
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
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: AI Engine Diagnostics */}
        {activeTab === "ai_model" && visionStatus && (
          <div className="panel" style={{ padding: "24px", borderRadius: "8px" }}>
            <p className="eyebrow">NEURAL &amp; BOTANICAL TELEMETRY</p>
            <h2 style={{ color: "var(--forest)", margin: "4px 0 16px" }}>{visionStatus.engine}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", fontSize: "13px" }}>
              <div style={{ padding: "16px", background: "#f8faf7", borderRadius: "8px", border: "1px solid #e1e7dc" }}>
                <h4 style={{ margin: "0 0 10px", color: "var(--forest)" }}>Inference &amp; Specification</h4>
                <p>Status: <strong style={{ color: "var(--leaf)" }}>{visionStatus.status.toUpperCase()}</strong></p>
                <p>Max Image Upload Size: <strong>{visionStatus.max_file_size_mb} MB</strong></p>
                <p>Supported Formats: <strong>{visionStatus.supported_formats.join(", ")}</strong></p>
                <p>Validated Target Species: <strong>{visionStatus.species_supported.join(", ")}</strong></p>
              </div>

              <div style={{ padding: "16px", background: "#f8faf7", borderRadius: "8px", border: "1px solid #e1e7dc" }}>
                <h4 style={{ margin: "0 0 10px", color: "var(--forest)" }}>Supported Pathology Targets ({visionStatus.supported_diseases_count})</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {visionStatus.supported_diseases.map((d: string) => (
                    <span key={d} className="tag-pill">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
                Are you sure you want to remove this user from the FarmSystem database? All associated farms, plants, and records will be affected.
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
                Are you sure you want to permanently delete this scan record from the database?
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
      </section>
    </AppFrame>
  );
}

