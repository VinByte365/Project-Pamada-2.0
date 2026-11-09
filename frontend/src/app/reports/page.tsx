"use client";

import { useEffect, useMemo, useState } from "react";
import { AppFrame, Stat } from "@/components/aloe-guard";
import { api, ProfitReport } from "@/lib/api";

export default function ReportsPage() {
  const [reports, setReports] = useState<ProfitReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ProfitReport | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: "Q1 Aloe Vera Harvest Cycle",
    period: "2026-Q1",
    revenue: 12500,
    expenses: 4200,
    net_profit: 8300,
    crop_yield_kg: 2500,
    market_price_per_kg: 5.0,
    notes: "Direct wholesale delivery to local cosmetics manufacturer.",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.reports.list();
      setReports(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profit reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingReport(null);
    setFormData({
      title: `Aloe Harvest Cycle - Month ${new Date().getMonth() + 1}`,
      period: `${new Date().getFullYear()}-M${new Date().getMonth() + 1}`,
      revenue: 15000,
      expenses: 4500,
      net_profit: 10500,
      crop_yield_kg: 3000,
      market_price_per_kg: 5.0,
      notes: "Commercial gel extract and fresh leaf distribution.",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: ProfitReport) => {
    setEditingReport(item);
    setFormData({
      title: item.title || "",
      period: item.period || "",
      revenue: Number(item.revenue) || 0,
      expenses: Number(item.expenses) || 0,
      net_profit: Number(item.net_profit) || 0,
      crop_yield_kg: Number(item.crop_yield_kg) || 0,
      market_price_per_kg: Number(item.market_price_per_kg) || 0,
      notes: item.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleRevenueExpenseChange = (rev: number, exp: number) => {
    setFormData((prev) => ({
      ...prev,
      revenue: rev,
      expenses: exp,
      net_profit: rev - exp,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      setSaving(true);
      setError("");

      if (editingReport) {
        await api.reports.update(editingReport.id, formData);
        setNotification("Profit report updated successfully.");
      } else {
        await api.reports.create(formData);
        setNotification("New profit report generated.");
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profit report.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setSaving(true);
      await api.reports.delete(id);
      setDeleteConfirmId(null);
      setNotification("Report deleted.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete report.");
    } finally {
      setSaving(false);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const text = `${r.title} ${r.period || ""} ${r.notes || ""}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [reports, search]);

  // Financial aggregates
  const totalRev = reports.reduce((sum, r) => sum + (Number(r.revenue) || 0), 0);
  const totalExp = reports.reduce((sum, r) => sum + (Number(r.expenses) || 0), 0);
  const totalProfit = reports.reduce((sum, r) => sum + (Number(r.net_profit) || 0), 0);
  const totalYield = reports.reduce((sum, r) => sum + (Number(r.crop_yield_kg) || 0), 0);
  const margin = totalRev > 0 ? `${Math.round((totalProfit / totalRev) * 100)}%` : "—";

  return (
    <AppFrame active="Profit reports">
      <section className="workspace">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">FARMSYSTEM <span>·</span> FINANCIALS &amp; PRODUCTION</p>
            <h1>Profit &amp; Yield Analytics</h1>
            <p>Track cultivation revenues, input expenses, crop yields, and net harvest margins.</p>
          </div>
          <button className="primary-button" onClick={openAddModal} type="button">
            ＋ Generate Profit Report
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
            icon="💵"
            label="Total Revenue"
            value={`$${totalRev.toLocaleString()}`}
            detail={`${reports.length} financial cycles`}
          />
          <Stat
            icon="📉"
            label="Total Expenses"
            value={`$${totalExp.toLocaleString()}`}
            detail="Labor, irrigation, inputs"
          />
          <Stat
            icon="📈"
            label="Net Profit"
            value={`$${totalProfit.toLocaleString()}`}
            detail={`${margin} net profit margin`}
          />
          <Stat
            icon="⚖"
            label="Total Harvest Yield"
            value={`${totalYield.toLocaleString()} kg`}
            detail="Audited biomass"
          />
        </div>

        <section className="panel">
          <div className="filters-row">
            <label className="search-field">
              <span>Search Financial Reports</span>
              <span className="search-input">
                <span aria-hidden="true">⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by report title, cycle period, or notes..."
                />
              </span>
            </label>
          </div>

          {loading ? (
            <div className="dashboard-empty">Loading profit reports from backend...</div>
          ) : filteredReports.length === 0 ? (
            <div className="dashboard-empty">
              <span className="empty-illustration">📊</span>
              <strong>{reports.length === 0 ? "No financial reports recorded yet." : "No reports match your search."}</strong>
              <p>Record your harvest cycles, sales transactions, and costs to measure your Aloe farm profitability.</p>
              {reports.length === 0 && (
                <button className="secondary-button" onClick={openAddModal} type="button">
                  Create First Financial Report
                </button>
              )}
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Report Cycle</th>
                    <th>Period</th>
                    <th>Gross Revenue</th>
                    <th>Expenses</th>
                    <th>Net Profit</th>
                    <th>Margin</th>
                    <th>Yield (kg)</th>
                    <th>Price / kg</th>
                    <th>Date</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((item) => {
                    const rev = Number(item.revenue) || 0;
                    const exp = Number(item.expenses) || 0;
                    const profit = Number(item.net_profit) || 0;
                    const pct = rev > 0 ? Math.round((profit / rev) * 100) : 0;

                    return (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.title}</strong>
                          <div style={{ fontSize: "10px", color: "var(--muted)" }}>{item.notes || "—"}</div>
                        </td>
                        <td>
                          <span className="tag-pill">{item.period || "Cycle"}</span>
                        </td>
                        <td style={{ color: "#2d6b41", fontWeight: "600" }}>
                          ${rev.toLocaleString()}
                        </td>
                        <td style={{ color: "var(--danger)" }}>
                          ${exp.toLocaleString()}
                        </td>
                        <td>
                          <strong style={{ color: profit >= 0 ? "#1e5234" : "var(--danger)" }}>
                            ${profit.toLocaleString()}
                          </strong>
                        </td>
                        <td>
                          <span className={`tag-pill ${pct >= 40 ? "success" : pct > 0 ? "warning" : "danger"}`}>
                            {pct}%
                          </span>
                        </td>
                        <td>{item.crop_yield_kg ? `${item.crop_yield_kg.toLocaleString()} kg` : "—"}</td>
                        <td>{item.market_price_per_kg ? `$${item.market_price_per_kg.toFixed(2)}` : "—"}</td>
                        <td>
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="table-actions" style={{ justifyContent: "flex-end" }}>
                            <button
                              className="btn-icon"
                              title="Edit Report"
                              onClick={() => openEditModal(item)}
                              type="button"
                            >
                              ✎
                            </button>
                            <button
                              className="btn-icon danger"
                              title="Delete Report"
                              onClick={() => setDeleteConfirmId(item.id)}
                              type="button"
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
                <h2>{editingReport ? "Edit Financial Report" : "Create Profit &amp; Yield Report"}</h2>
                <button className="modal-close" onClick={() => setIsModalOpen(false)} type="button">✕</button>
              </div>
              <form onSubmit={handleSave}>
                <div className="form-grid">
                  <div className="form-field full">
                    <label>Report Title / Cycle Description *</label>
                    <input
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. October Harvest &amp; Wholesale Batch"
                    />
                  </div>
                  <div className="form-field">
                    <label>Accounting Period / Quarter</label>
                    <input
                      value={formData.period}
                      onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                      placeholder="e.g. 2026-Q4"
                    />
                  </div>
                  <div className="form-field">
                    <label>Gross Sales Revenue ($)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.revenue}
                      onChange={(e) =>
                        handleRevenueExpenseChange(Number(e.target.value), formData.expenses)
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label>Total Operating Expenses ($)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.expenses}
                      onChange={(e) =>
                        handleRevenueExpenseChange(formData.revenue, Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label>Calculated Net Profit ($)</label>
                    <input
                      type="number"
                      step="any"
                      readOnly
                      style={{ background: "#f8f9f6", fontWeight: "700" }}
                      value={formData.net_profit}
                    />
                  </div>
                  <div className="form-field">
                    <label>Total Biomass Harvested (kg)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.crop_yield_kg}
                      onChange={(e) =>
                        setFormData({ ...formData, crop_yield_kg: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label>Average Market Price / kg ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.market_price_per_kg}
                      onChange={(e) =>
                        setFormData({ ...formData, market_price_per_kg: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="form-field full">
                    <label>Market &amp; Operational Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Buyer details, transport logistics, fertilizer expenditures, or market trends..."
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
                    {saving ? "Saving..." : editingReport ? "Save Changes" : "Save Report"}
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
                <h2>Delete Financial Report</h2>
                <button className="modal-close" onClick={() => setDeleteConfirmId(null)} type="button">✕</button>
              </div>
              <p style={{ color: "var(--muted)", fontSize: "12px", lineHeight: "1.6" }}>
                Are you sure you want to permanently delete this profit and yield report?
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

