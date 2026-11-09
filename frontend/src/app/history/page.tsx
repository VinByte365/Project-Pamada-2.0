"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppFrame } from "@/components/aloe-guard";
import { api, ScanRecord } from "@/lib/api";

export default function HistoryPage() {
  const router = useRouter();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadScans = async () => {
    try {
      setLoading(true);
      setError("");
      const scanList = await api.scans.list();
      setScans(scanList || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load scan history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
  }, [router]);

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      await api.scans.delete(id);
      setScans((prev) => prev.filter((s) => s.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete scan record.");
    } finally {
      setDeleting(false);
    }
  };

  const visible = useMemo(() => {
    return scans
      .filter((scan) => {
        const date = new Date(scan.createdAt);
        const matchesFilter =
          filter === "all" ||
          (filter === "healthy" && scan.diagnosis === "Healthy") ||
          (filter === "disease" && scan.diagnosis !== "Healthy" && scan.diagnosis !== "Uncertain") ||
          (filter === "harvest" && scan.readyForHarvest) ||
          (filter === "leaf_spot" && scan.diagnosis === "Leaf Spot") ||
          (filter === "sunburn" && scan.diagnosis === "Sunburn") ||
          (filter === "root_rot" && scan.diagnosis === "Root Rot") ||
          (filter === "mealy_bugs" && scan.diagnosis === "Mealy Bugs");

        const searchText = `${scan.plantName ?? ""} ${scan.plantId ?? ""} ${scan.id} ${scan.diagnosis ?? ""} ${scan.diseaseName ?? ""}`.toLowerCase();
        return (
          matchesFilter &&
          searchText.includes(query.toLowerCase()) &&
          (!from || date >= new Date(`${from}T00:00:00`)) &&
          (!to || date <= new Date(`${to}T23:59:59`))
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [scans, query, filter, from, to]);

  return (
    <AppFrame active="Scan history">
      <section className="workspace">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">FARMSYSTEM <span>·</span> ARCHIVE &amp; TELEMETRY</p>
            <h1>Aloe Vera Scan History</h1>
            <p>Archive of foliar photographs, species verification logs, and pathology diagnoses.</p>
          </div>
          <Link href="/detect" className="primary-button">
            ＋ New Plant Scan
          </Link>
        </div>

        {error && (
          <div className="alert-banner error" role="alert">
            <span>{error}</span>
          </div>
        )}

        <section className="panel history-panel">
          <div className="filters-row" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.8fr 0.8fr", gap: "12px", marginBottom: "20px" }}>
            <label className="search-field">
              <span>Search Records</span>
              <span className="search-input">
                <span aria-hidden="true">⌕</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search plant name, ID, or disease..."
                />
              </span>
            </label>

            <label>
              <span>Classification Filter</span>
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All Scans ({scans.length})</option>
                <option value="healthy">Healthy Aloe Vera</option>
                <option value="disease">All Detected Diseases</option>
                <option value="harvest">Ready for Harvest</option>
                <option value="leaf_spot">Leaf Spot Cases</option>
                <option value="sunburn">Sunburn / UV Stress</option>
                <option value="root_rot">Root Rot Alerts</option>
                <option value="mealy_bugs">Mealy Bug Infestations</option>
              </select>
            </label>

            <label>
              <span>From Date</span>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>

            <label>
              <span>To Date</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>

          {loading ? (
            <div className="dashboard-empty">Retrieving scan history from database...</div>
          ) : visible.length > 0 ? (
            <div className="history-list">
              {visible.map((scan) => {
                const isHealthy = scan.diagnosis === "Healthy" || scan.severity === "None";

                return (
                  <article className="history-card" key={scan.id}>
                    <div className="history-image">
                      {scan.imageUrl ? (
                        <Image
                          src={scan.imageUrl}
                          alt="Aloe Vera specimen photo"
                          width={160}
                          height={160}
                          unoptimized
                        />
                      ) : (
                        <span aria-hidden="true">🌿</span>
                      )}
                    </div>

                    <div className="history-main">
                      <div className="history-title">
                        <span
                          className={`status-badge ${
                            isHealthy
                              ? "healthy"
                              : scan.severity === "Severe"
                              ? "attention"
                              : "pending"
                          }`}
                        >
                          {scan.diagnosis || "Verified Scan"}
                          {typeof scan.confidence === "number" ? ` · ${scan.confidence}%` : ""}
                        </span>
                        <time>{new Date(scan.createdAt).toLocaleString()}</time>
                      </div>

                      <h2>{scan.plantName?.trim() || `Aloe Specimen #${scan.id.slice(-6).toUpperCase()}`}</h2>

                      <p style={{ margin: "4px 0", color: "#4b5563", fontSize: "13px" }}>
                        <strong>Maturity: </strong>
                        {scan.maturityStage || "Developing"}
                        {scan.readyForHarvest && (
                          <span style={{ color: "var(--leaf)", fontWeight: 600, marginLeft: "6px" }}>
                            (Ready to harvest)
                          </span>
                        )}
                      </p>

                      <small style={{ color: "var(--muted)", display: "block" }}>
                        Scan ID: <code>{scan.id}</code>
                      </small>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center" }}>
                      <Link href={`/results?id=${scan.id}`} className="primary-button" style={{ textAlign: "center", fontSize: "12px", padding: "8px 14px" }}>
                        Report Details →
                      </Link>
                      {scan.plantId && (
                        <Link href={`/plants/${scan.plantId}`} className="secondary-button" style={{ textAlign: "center", fontSize: "12px", padding: "6px 14px" }}>
                          Specimen Log
                        </Link>
                      )}
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => setDeleteConfirmId(scan.id)}
                        style={{ color: "var(--danger)", fontSize: "11px", alignSelf: "center", marginTop: "4px" }}
                      >
                        Delete Record
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-empty">
              <span className="empty-illustration">🌿</span>
              <strong>{scans.length ? "No scan records match those criteria." : "No scan records saved yet."}</strong>
              <p>
                {scans.length
                  ? "Try resetting the date range or classification filter."
                  : "Photographs taken with the Aloe Scanner are automatically catalogued here."}
              </p>
              {!scans.length && (
                <Link href="/detect" className="secondary-button">
                  Take First Aloe Vera Scan
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card">
              <div className="modal-header">
                <h2>Delete Scan Record?</h2>
                <button className="btn-icon" onClick={() => setDeleteConfirmId(null)} type="button">✕</button>
              </div>
              <p style={{ margin: "14px 0", color: "var(--muted)", fontSize: "13px" }}>
                Are you sure you want to permanently delete this scan record from the database? This action cannot be undone.
              </p>
              <div className="modal-actions">
                <button className="secondary-button" onClick={() => setDeleteConfirmId(null)} type="button" disabled={deleting}>
                  Cancel
                </button>
                <button
                  className="primary-button"
                  onClick={() => handleDelete(deleteConfirmId)}
                  type="button"
                  disabled={deleting}
                  style={{ background: "var(--danger)" }}
                >
                  {deleting ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </AppFrame>
  );
}
