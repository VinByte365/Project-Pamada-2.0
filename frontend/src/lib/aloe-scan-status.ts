export type AloeScanStatus = {
  diagnosis: string;
  source?: string;
  speciesStatus?: string;
};

export function isVerifiedAloeScan(scan: AloeScanStatus) {
  return scan.source === "ai" && scan.speciesStatus === "verified";
}

export function aloeStatusLabel(scan: AloeScanStatus) {
  if (!isVerifiedAloeScan(scan)) return "Needs verification";
  if (scan.diagnosis === "Healthy") return "Healthy Aloe Vera";
  if (scan.diagnosis === "Uncertain") return "Needs review";
  return "Disease detected";
}

export function aloeStatusTone(scan: AloeScanStatus) {
  if (!isVerifiedAloeScan(scan) || scan.diagnosis === "Uncertain") return "pending";
  return scan.diagnosis === "Healthy" ? "healthy" : "attention";
}

export function aloeDiagnosisLabel(scan: AloeScanStatus) {
  if (!isVerifiedAloeScan(scan)) return "No verified Aloe Vera result";
  return scan.diagnosis === "Uncertain" ? "No diagnosis generated" : scan.diagnosis;
}
