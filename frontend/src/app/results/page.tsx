"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AppFrame } from "@/components/aloe-guard";
import { api, DiseaseDetectionResult, ScanRecord } from "@/lib/api";

function ResultsContent() {
  const searchParams = useSearchParams();
  const scanId = searchParams.get("id");

  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [diseaseCatalog, setDiseaseCatalog] = useState<Record<string, DiseaseDetectionResult>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchResult() {
      try {
        setLoading(true);
        setError("");

        // Fetch disease catalog for botanical explanations
        const diseasesData = await api.vision.diseases().catch(() => ({ diseases: {} }));
        setDiseaseCatalog(diseasesData.diseases || {});

        // Fetch user scans
        const scans = await api.scans.list();
        if (scans && scans.length > 0) {
          if (scanId) {
            const found = scans.find((s) => s.id === scanId);
            setScan(found || scans[0]);
          } else {
            setScan(scans[0]);
          }
        } else {
          setScan(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load scan diagnostic report.");
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
  }, [scanId]);

  if (loading) {
    return (
      <div className="panel dashboard-empty" style={{ padding: "40px", textAlign: "center" }}>
        <p>Loading Aloe Vera diagnostic report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-banner error" role="alert">
        <span>{error}</span>
      </div>
    );
  }

  if (!scan) {
    return (
      <section className="panel result-empty" style={{ padding: "48px 24px", textAlign: "center" }}>
        <div className="result-empty-icon" style={{ fontSize: "40px", marginBottom: "12px" }}>🌿</div>
        <span className="status-badge pending">NO SCANS YET</span>
        <h2>No Aloe Vera scan report available.</h2>
        <p style={{ maxWidth: "480px", margin: "12px auto 24px", color: "var(--muted)" }}>
          Upload or capture a photo of your Aloe Vera plant to generate species verification, disease detection, and harvest maturity analytics.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Link href="/detect" className="primary-button">
            Open Aloe Scanner →
          </Link>
          <Link href="/dashboard" className="secondary-button">
            Back to Dashboard
          </Link>
        </div>
      </section>
    );
  }

  const diseaseKey = scan.diagnosis || "Healthy";
  const diseaseInfo = diseaseCatalog[diseaseKey] || null;
  const isHealthy = diseaseKey === "Healthy" || scan.severity === "None";

  return (
    <section className="workspace">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">DIAGNOSTIC REPORT <span>·</span> SPECIMEN HEALTH &amp; MATURITY</p>
          <h1>{scan.plantName || "Aloe Vera Specimen"} Report</h1>
          <p>
            Generated on {new Date(scan.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} · AI Vision Inspection
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/detect" className="secondary-button">
            ＋ Scan Another
          </Link>
          <Link href="/history" className="primary-button">
            Scan History
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "28px", marginTop: "20px" }}>
        {/* Left Column: Image & Botanical Metrics */}
        <div>
          <div className="panel" style={{ padding: "20px", borderRadius: "10px" }}>
            <div style={{ position: "relative", width: "100%", height: "340px", borderRadius: "8px", overflow: "hidden", background: "#f3f4f0" }}>
              {scan.imageUrl ? (
                <Image
                  src={scan.imageUrl}
                  alt={scan.plantName || "Aloe Vera scan"}
                  fill
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              ) : (
                <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
                  No photograph preserved
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
              <div>
                <strong style={{ fontSize: "16px", color: "var(--forest)", display: "block" }}>
                  Aloe barbadensis Miller
                </strong>
                <small style={{ color: "var(--leaf)", fontWeight: 600 }}>
                  ✓ Species Verified: {scan.confidence ? `${scan.confidence}% Confidence` : "Verified Succulent"}
                </small>
              </div>
              <span className={`status-badge ${isHealthy ? "healthy" : scan.severity === "Severe" ? "attention" : "pending"}`}>
                {isHealthy ? "Healthy Specimen" : `${scan.diagnosis} Detected`}
              </span>
            </div>
          </div>

          {/* Harvest Maturity Card */}
          <div className="panel" style={{ marginTop: "20px", padding: "20px", borderRadius: "10px" }}>
            <p className="eyebrow">HARVEST MATURITY &amp; AGE EVALUATION</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <h3 style={{ margin: "4px 0", fontSize: "18px", color: "var(--forest)" }}>
                  {scan.maturityStage || "Developing / Vegetative"}
                </h3>
                <span style={{ fontSize: "12px", color: "var(--leaf)", fontWeight: 600 }}>
                  Estimated Age: {scan.estimatedAge || "2 – 3+ Years"}
                </span>
              </div>
              <span className={`status-badge ${scan.readyForHarvest ? "healthy" : "pending"}`}>
                {scan.readyForHarvest ? "✓ Harvest Ready" : "Growing"}
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: 1.5, margin: "10px 0" }}>
              {scan.readyForHarvest
                ? "This Aloe Vera plant possesses full succulent parenchyma, thick outer blades (>= 14mm), and an established basal rosette suitable for selective harvesting."
                : "Plant is actively developing foliar volume. Allow outer leaves to continue photosynthesis to reach peak aloin and polysaccharide concentration."}
            </p>

            <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
              <Link href="/maturity" className="secondary-button" style={{ fontSize: "12px", padding: "6px 12px" }}>
                Explore Maturity Tracking →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Pathology & Treatment */}
        <div>
          <div className="panel" style={{ padding: "24px", borderRadius: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p className="eyebrow">PATHOLOGY &amp; HEALTH DIAGNOSIS</p>
              <span className={`status-badge ${isHealthy ? "healthy" : scan.severity === "Severe" ? "attention" : "pending"}`}>
                Severity: {scan.severity || (isHealthy ? "None" : "Moderate")}
              </span>
            </div>

            <h2 style={{ fontSize: "24px", color: "var(--forest)", margin: "8px 0 12px" }}>
              {diseaseInfo ? diseaseInfo.name : scan.diseaseName || scan.diagnosis}
            </h2>

            <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.6, margin: "0 0 16px" }}>
              {diseaseInfo ? diseaseInfo.description : "Foliar health evaluation based on Aloe Vera chromatic variance and succulent leaf structure."}
            </p>

            {/* Observed Symptoms */}
            {diseaseInfo && diseaseInfo.symptoms && diseaseInfo.symptoms.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--ink)", letterSpacing: "0.05em", margin: "0 0 6px" }}>
                  Key Diagnostic Symptoms
                </h4>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#4b5563", lineHeight: 1.6 }}>
                  {diseaseInfo.symptoms.map((sym, idx) => (
                    <li key={idx}>{sym}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Potential Causes */}
            {diseaseInfo && diseaseInfo.causes && diseaseInfo.causes.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--ink)", letterSpacing: "0.05em", margin: "0 0 6px" }}>
                  Etiology &amp; Potential Causes
                </h4>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#4b5563", lineHeight: 1.6 }}>
                  {diseaseInfo.causes.map((cause, idx) => (
                    <li key={idx}>{cause}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Treatment & Mitigation Plan */}
            <div style={{ background: "#f8faf7", border: "1px solid #dce8db", borderRadius: "8px", padding: "16px", marginTop: "16px" }}>
              <h4 style={{ fontSize: "13px", color: "var(--forest)", margin: "0 0 8px", fontWeight: 700 }}>
                Recommended Care &amp; Treatment Actions
              </h4>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#2d3748", lineHeight: 1.6 }}>
                {(scan.recommendations && scan.recommendations.length > 0
                  ? scan.recommendations
                  : diseaseInfo?.treatments || ["Maintain indirect sunlight", "Keep well-drained substrate"]
                ).map((rec, idx) => (
                  <li key={idx} style={{ marginBottom: "4px" }}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Long-term Prevention */}
            {diseaseInfo && diseaseInfo.prevention && diseaseInfo.prevention.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <h4 style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.05em", margin: "0 0 6px" }}>
                  Agronomic Prevention
                </h4>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#4b5563", lineHeight: 1.5 }}>
                  {diseaseInfo.prevention.map((prev, idx) => (
                    <li key={idx}>{prev}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bottom Actions */}
            <div style={{ display: "flex", gap: "10px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #edf2eb" }}>
              {scan.plantId && (
                <Link href={`/plants/${scan.plantId}`} className="primary-button" style={{ fontSize: "13px" }}>
                  Open Specimen Record
                </Link>
              )}
              <Link href="/recommendations" className="secondary-button" style={{ fontSize: "13px" }}>
                All Care Protocols →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ResultsPage() {
  return (
    <AppFrame active="Scan Aloe Vera">
      <Suspense fallback={<div className="panel dashboard-empty">Loading report...</div>}>
        <ResultsContent />
      </Suspense>
    </AppFrame>
  );
}
