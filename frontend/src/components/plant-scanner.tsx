"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { leafImage } from "@/components/plant-assets";
import { api, Plant, VisionAnalysisResponse } from "@/lib/api";

type InputMode = "upload" | "camera";
type ExistingPlant = { id: string; name: string };

function resizeForRecord(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    createImageBitmap(file)
      .then((bitmap) => {
        const maxEdge = 640;
        const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          bitmap.close();
          reject(new Error("This image could not be prepared for analysis."));
          return;
        }
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const data = canvas.toDataURL("image/jpeg", 0.72);
        resolve(data);
      })
      .catch(() => reject(new Error("Unable to open image file. Please choose another photo.")));
  });
}

export function Detector() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewRef = useRef("");

  const [mode, setMode] = useState<InputMode>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [rejection, setRejection] = useState<{ message: string; confidence?: number; suggestion?: string } | null>(null);
  const [cameraMessage, setCameraMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [analysisResult, setAnalysisResult] = useState<VisionAnalysisResponse | null>(null);

  const [existingPlants, setExistingPlants] = useState<ExistingPlant[]>([]);
  const [plantChoice, setPlantChoice] = useState("");
  const [plantName, setPlantName] = useState("");

  useEffect(() => {
    api.plants
      .list()
      .then((plants) => {
        if (plants && plants.length > 0) {
          setExistingPlants(plants.map((p) => ({ id: p.id, name: p.name })));
        }
      })
      .catch(() => undefined);
  }, [router]);

  useEffect(() => {
    if (mode !== "camera") return;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        if (!cancelled) setCameraMessage("Camera access was unavailable. Check your browser permissions or upload an image instead.");
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [mode]);

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  function clearPreview() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = "";
    setPreview("");
    setFile(null);
    setError("");
    setRejection(null);
    setAnalysisResult(null);
  }

  function choose(next: File | undefined) {
    setError("");
    setRejection(null);
    setAnalysisResult(null);
    if (!next) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(next.type)) {
      clearPreview();
      setError("Please choose a valid JPG, PNG, or WebP image.");
      return;
    }
    if (next.size > 8 * 1024 * 1024) {
      clearPreview();
      setError("Image size exceeds 8 MB. Please select a smaller photo.");
      return;
    }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = URL.createObjectURL(next);
    setPreview(previewRef.current);
    setFile(next);
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    choose(event.target.files?.[0]);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files[0]);
  }

  function enableCamera() {
    setError("");
    setRejection(null);
    setCameraMessage("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraMessage("This browser does not support camera capture. Please upload an image.");
      return;
    }
    setMode("camera");
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setCameraMessage("Waiting for camera feed. Please try again in a moment.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setCameraMessage("Unable to capture image from camera.");
      return;
    }
    context.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraMessage("Image capture failed.");
          return;
        }
        setMode("upload");
        choose(new File([blob], `aloe-capture-${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9
    );
  }

  async function startAnalysis() {
    if (!file) return;
    setAnalyzing(true);
    setError("");
    setRejection(null);
    setAnalysisResult(null);
    setAnalysisStatus("Preparing image & foliar spectrum...");

    try {
      const imageBase64 = await resizeForRecord(file);
      setAnalysisStatus("Transmitting to AloeGuard Vision AI...");

      const chosenName = plantName.trim() || (plantChoice ? "" : `Aloe Specimen #${Date.now().toString().slice(-4)}`);

      const result = await api.vision.analyze({
        image_base64: imageBase64,
        plant_id: plantChoice || undefined,
        plant_name: chosenName || undefined,
      });

      setAnalysisStatus("Diagnosis complete!");
      setAnalysisResult(result);
    } catch (err: unknown) {
      // Check if backend returned structured rejection error
      let errorMsg = "Visual inspection encountered an error. Please try again.";
      if (err instanceof Error) {
        errorMsg = err.message;
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.detail && typeof parsed.detail === "object") {
            setRejection({
              message: parsed.detail.message || "Image rejected.",
              confidence: parsed.detail.confidence,
              suggestion: parsed.detail.suggestion,
            });
            setAnalyzing(false);
            setAnalysisStatus("");
            return;
          }
        } catch {
          // not json
        }
      }

      if (errorMsg.includes("Species Rejection") || errorMsg.includes("not appear to be an Aloe Vera")) {
        setRejection({
          message: errorMsg,
          suggestion: "Please photograph an authentic Aloe Vera plant (Aloe barbadensis) showing healthy succulent leaves and rosette structure.",
        });
      } else {
        setError(errorMsg);
      }
    } finally {
      setAnalyzing(false);
      setAnalysisStatus("");
    }
  }

  return (
    <section className="scan-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">FARMSYSTEM <span>·</span> ALOE VERA IDENTIFICATION &amp; HEALTH AI</p>
          <h1>Scan Aloe Vera Plant</h1>
          <p>Verify Aloe Vera species integrity, diagnose foliar diseases, and measure harvest maturity index.</p>
        </div>
        <span className="step-pill">
          <span>AI</span> Vision Engine Online
        </span>
      </div>

      <div className="scanner-grid">
        <div className="scanner-card">
          <div className="scanner-card-head">
            <div>
              <span className="eyebrow">IMAGE INTAKE</span>
              <h2>Upload or capture Aloe Vera photo</h2>
            </div>
            <span className="privacy-label">Automatic Species Verification</span>
          </div>

          <div className="detector-tabs" role="tablist" aria-label="Choose image source">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "upload"}
              className={mode === "upload" ? "selected" : ""}
              onClick={() => {
                setMode("upload");
                setCameraMessage("");
              }}
            >
              Upload image file
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "camera"}
              className={mode === "camera" ? "selected" : ""}
              onClick={enableCamera}
            >
              Use device camera
            </button>
          </div>

          <div className="plant-assignment">
            <label htmlFor="plant-entry">Assign to Plant Inventory</label>
            <select
              id="plant-entry"
              value={plantChoice}
              onChange={(e) => setPlantChoice(e.target.value)}
            >
              <option value="">Auto-create a new Aloe Vera specimen record</option>
              {existingPlants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>
            {!plantChoice && (
              <label className="plant-name-field" htmlFor="plant-name">
                Specimen Label <span>(optional)</span>
                <input
                  id="plant-name"
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
                  maxLength={60}
                  placeholder="e.g. Aloe Bed 1 - Plot B Specimen"
                />
              </label>
            )}
          </div>

          {mode === "upload" ? (
            <label
              className={`drop-zone ${dragging ? "dragging" : ""} ${preview ? "has-preview" : ""}`}
              htmlFor="plant-image"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <input
                id="plant-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onChange}
              />
              <span className="upload-symbol">+</span>
              <strong>{file ? file.name : "Drop Aloe Vera photo here"}</strong>
              <span>
                {file
                  ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Ready for AI analysis`
                  : "or browse from your computer or phone"}
              </span>
              <small>JPEG, PNG, WebP · High clarity recommended</small>
            </label>
          ) : (
            <div className="camera-preview">
              {cameraMessage ? (
                <p role="status">{cameraMessage}</p>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  aria-label="Live camera preview"
                />
              )}
              <button
                type="button"
                className="secondary-button"
                onClick={capturePhoto}
                disabled={Boolean(cameraMessage)}
              >
                Capture Photo
              </button>
            </div>
          )}

          {preview && (
            <div className="preview-card">
              <Image
                src={preview}
                alt="Selected image preview"
                width={54}
                height={54}
                unoptimized
              />
              <div>
                <strong>Selected Photo</strong>
                <span>{file?.name}</span>
              </div>
              <button type="button" className="text-button" onClick={clearPreview}>
                Change image
              </button>
            </div>
          )}

          {error && (
            <div className="alert-banner error" role="alert" style={{ marginTop: "16px" }}>
              <strong>Error: </strong>
              <span>{error}</span>
            </div>
          )}

          {/* Phase 5 Species Rejection Banner */}
          {rejection && (
            <div
              className="alert-banner error"
              role="alert"
              style={{
                marginTop: "16px",
                borderLeft: "4px solid var(--danger)",
                background: "#fef2f2",
                padding: "16px",
                borderRadius: "6px",
              }}
            >
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "20px" }}>⚠️</span>
                <div>
                  <strong style={{ color: "var(--danger)", fontSize: "14px", display: "block" }}>
                    Species Check Failed: Image Rejected
                  </strong>
                  <p style={{ margin: "6px 0", fontSize: "13px", color: "#4b5563", lineHeight: 1.5 }}>
                    {rejection.message}
                  </p>
                  {rejection.suggestion && (
                    <small style={{ color: "#6b7280", display: "block", marginTop: "4px" }}>
                      💡 <strong>Suggestion:</strong> {rejection.suggestion}
                    </small>
                  )}
                  <div style={{ marginTop: "12px" }}>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={clearPreview}
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                    >
                      Try another Aloe Vera photo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          {!analysisResult && !rejection && (
            <div className="scanner-actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="primary-button"
                disabled={!file || analyzing}
                onClick={startAnalysis}
                style={{ width: "100%", padding: "14px" }}
              >
                {analyzing ? (analysisStatus || "Analyzing plant...") : "Verify Species & Analyze Health"}
              </button>
            </div>
          )}

          {/* Live AI Analysis Results Display */}
          {analysisResult && (
            <div
              className="notice-panel"
              role="status"
              style={{
                marginTop: "20px",
                background: "#f7faf7",
                border: "1px solid #cce3cb",
                padding: "20px",
                borderRadius: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <span style={{ fontSize: "22px" }}>🌿</span>
                <div>
                  <h3 style={{ margin: 0, color: "var(--forest)", fontSize: "18px" }}>
                    Verified: {analysisResult.analysis.species_identification.species_name}
                  </h3>
                  <small style={{ color: "var(--leaf)", fontWeight: 600 }}>
                    Species Match: {analysisResult.analysis.species_identification.confidence}% Confidence
                  </small>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", margin: "16px 0" }}>
                <div style={{ background: "#fff", padding: "12px", borderRadius: "6px", border: "1px solid #e5eae3" }}>
                  <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Health &amp; Pathology
                  </span>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--forest)", marginTop: "4px" }}>
                    {analysisResult.analysis.disease_detection.name}
                  </div>
                  <span
                    className={`status-badge ${
                      analysisResult.analysis.disease_detection.severity === "None"
                        ? "healthy"
                        : analysisResult.analysis.disease_detection.severity === "Severe"
                        ? "attention"
                        : "pending"
                    }`}
                    style={{ marginTop: "6px", display: "inline-block" }}
                  >
                    Severity: {analysisResult.analysis.disease_detection.severity} ({analysisResult.analysis.disease_detection.confidence}%)
                  </span>
                </div>

                <div style={{ background: "#fff", padding: "12px", borderRadius: "6px", border: "1px solid #e5eae3" }}>
                  <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Harvest Readiness &amp; Plant Age
                  </span>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--forest)", marginTop: "4px" }}>
                    {analysisResult.analysis.harvest_maturity.stage}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--leaf)", fontWeight: 600, marginTop: "2px" }}>
                    Estimated Age: {analysisResult.analysis.harvest_maturity.estimated_age_range || "2 – 3+ Years"}
                  </div>
                  <small style={{ color: "var(--muted)", display: "block", marginTop: "4px" }}>
                    Leaves: ~{analysisResult.analysis.harvest_maturity.estimated_leaf_count} · Thickness: {analysisResult.analysis.harvest_maturity.estimated_leaf_thickness_mm} mm
                  </small>
                </div>
              </div>

              <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.5, margin: "12px 0" }}>
                <strong>Key Recommendation: </strong>
                {analysisResult.analysis.disease_detection.treatments[0] || analysisResult.analysis.harvest_maturity.harvest_guidance}
              </p>

              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <Link
                  href={`/results?id=${analysisResult.scan_id}`}
                  className="primary-button"
                  style={{ textDecoration: "none", textAlign: "center" }}
                >
                  View Full Diagnostic Report →
                </Link>
                <Link
                  href={`/plants/${analysisResult.plant_id}`}
                  className="secondary-button"
                  style={{ textDecoration: "none", textAlign: "center" }}
                >
                  Open Specimen Record
                </Link>
                <button
                  type="button"
                  className="text-button"
                  onClick={clearPreview}
                  style={{ marginLeft: "auto" }}
                >
                  Scan another
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="scanner-aside">
          <div className="aside-image" style={{ backgroundImage: `url(${leafImage})` }}>
            <span>IMAGE GUIDANCE</span>
          </div>
          <div className="guidance-card">
            <h3>For Accurate Aloe Analysis</h3>
            <ul>
              <li>Center the Aloe Vera rosette in bright, natural, indirect lighting.</li>
              <li>Keep the camera 20–40 cm from the leaf surface in sharp focus.</li>
              <li>Ensure leaf margins and basal succulent tissue are clearly visible.</li>
              <li>Avoid extreme backlighting or blurry hand movement.</li>
            </ul>
          </div>
          <div className="model-status">
            <span className="status-dot" />
            <div>
              <strong>Species Verification Active</strong>
              <p>Supports Aloe barbadensis Miller foliar diagnostics</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
