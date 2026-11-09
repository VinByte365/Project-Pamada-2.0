"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppFrame } from "@/components/aloe-guard";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [updates, setUpdates] = useState(true);
  const [telemetryAlerts, setTelemetryAlerts] = useState(true);
  const [message, setMessage] = useState("");
  const [backendStatus, setBackendStatus] = useState<"checking" | "connected" | "offline">("checking");
  const [syncStatus, setSyncStatus] = useState<string>("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Check backend health
    api.health()
      .then((res) => {
        if (res?.status === "ok") {
          setBackendStatus("connected");
        } else {
          setBackendStatus("offline");
        }
      })
      .catch(() => {
        setBackendStatus("offline");
      });
  }, []);

  function save(event: FormEvent) {
    event.preventDefault();
    setMessage("Workspace preferences saved.");
  }

  async function triggerSyncDownload() {
    try {
      setSyncing(true);
      setSyncStatus("");
      const result = await api.sync.download();
      const collections = Object.keys(result.data || {});
      const totalCount = Object.values(result.data || {}).reduce(
        (acc, items) => acc + (items as unknown[]).length,
        0
      );
      setSyncStatus(`Sync successful: retrieved ${totalCount} records across ${collections.length} collections.`);
    } catch (err) {
      setSyncStatus(`Sync error: ${err instanceof Error ? err.message : "Sync failed"}`);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <AppFrame active="Settings">
      <section className="workspace">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">FARMSYSTEM CONFIGURATION <span>|</span> SYSTEM SETTINGS</p>
            <h1>System Settings &amp; Health</h1>
            <p>Inspect backend API communication, manage offline data synchronisation, and configure preferences.</p>
          </div>
        </div>

        {message && (
          <div className="alert-banner success" role="status">
            <span>{message}</span>
            <button className="text-button" onClick={() => setMessage("")} type="button">✕</button>
          </div>
        )}

        <form onSubmit={save} className="settings-grid">
          {/* Backend Connectivity Status */}
          <section className="panel settings-panel integration-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">API INTEGRATION</p>
                <h2>Backend Connection Status</h2>
              </div>
              <span
                className={`status-badge ${
                  backendStatus === "connected"
                    ? "healthy"
                    : backendStatus === "checking"
                    ? "pending"
                    : "attention"
                }`}
              >
                {backendStatus === "connected"
                  ? "● CONNECTED (FastAPI + MongoDB Atlas)"
                  : backendStatus === "checking"
                  ? "CHECKING..."
                  : "○ BACKEND OFFLINE"}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginTop: "10px" }}>
              <div style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "5px", background: "#fbfcf9" }}>
                <strong style={{ display: "block", color: "var(--forest)", fontSize: "11px" }}>API Base Endpoint</strong>
                <span style={{ fontSize: "10px", color: "var(--muted)" }}>http://127.0.0.1:8000</span>
              </div>
              <div style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "5px", background: "#fbfcf9" }}>
                <strong style={{ display: "block", color: "var(--forest)", fontSize: "11px" }}>Database Cluster</strong>
                <span style={{ fontSize: "10px", color: "var(--muted)" }}>MongoDB Atlas (aloe_guard)</span>
              </div>
              <div style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "5px", background: "#fbfcf9" }}>
                <strong style={{ display: "block", color: "var(--forest)", fontSize: "11px" }}>Auth Architecture</strong>
                <span style={{ fontSize: "10px", color: "var(--muted)" }}>JWT Bearer Token / Role-Based</span>
              </div>
            </div>
          </section>

          {/* Offline Sync Module */}
          <section className="panel settings-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">DATA SYNC</p>
                <h2>Database Synchronization</h2>
              </div>
              <span className="summary-icon">🔄</span>
            </div>
            <p className="subtle-text">
              Synchronize records between your client cache and the backend MongoDB database.
            </p>
            {syncStatus && (
              <p style={{ fontSize: "11px", color: "var(--leaf)", fontWeight: "600" }}>{syncStatus}</p>
            )}
            <button
              type="button"
              className="secondary-button"
              disabled={syncing}
              onClick={triggerSyncDownload}
            >
              {syncing ? "Synchronizing..." : "Trigger Full Sync Download"}
            </button>
          </section>

          {/* Preferences */}
          <section className="panel settings-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">NOTIFICATIONS</p>
                <h2>Telemetry &amp; Alerts</h2>
              </div>
              <span className="summary-icon">🔔</span>
            </div>
            <label className="toggle-row">
              <span>
                <strong>NPK Soil Nutrient Alerts</strong>
                <small>Alert when NPK or pH levels leave optimal succulent thresholds.</small>
              </span>
              <input
                type="checkbox"
                checked={telemetryAlerts}
                onChange={(e) => setTelemetryAlerts(e.target.checked)}
              />
            </label>
            <label className="toggle-row">
              <span>
                <strong>Agronomic Product Updates</strong>
                <small>Receive updates on new disease detection models and sensor firmware.</small>
              </span>
              <input
                type="checkbox"
                checked={updates}
                onChange={(e) => setUpdates(e.target.checked)}
              />
            </label>
            <button className="primary-button" type="submit">
              Save Preferences
            </button>
          </section>
        </form>
      </section>
    </AppFrame>
  );
}
