import axios from 'axios';
import { Platform } from 'react-native';

import { apiClient } from '@/lib/api/client';

const DISEASE_ENDPOINT = '/ml/disease';
const ANALYSIS_TIMEOUT_MS = 60_000;

export type DiseaseBox = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type DiseaseDetection = {
  class_id: number;
  label: string;
  confidence: number;
  box: DiseaseBox;
};

export type DiseaseDetectionResult = {
  top: DiseaseDetection | null;
  detections: DiseaseDetection[];
  count: number;
  message: string;
};

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null
    ? (value as UnknownRecord)
    : null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseDetection(value: unknown): DiseaseDetection | null {
  const record = asRecord(value);
  if (!record) return null;

  const box = asRecord(record.box);
  if (
    !isFiniteNumber(record.class_id) ||
    typeof record.label !== 'string' ||
    !isFiniteNumber(record.confidence) ||
    !box ||
    !isFiniteNumber(box.x1) ||
    !isFiniteNumber(box.y1) ||
    !isFiniteNumber(box.x2) ||
    !isFiniteNumber(box.y2)
  ) {
    return null;
  }

  return {
    class_id: record.class_id,
    label: record.label.trim() || 'Unlabeled detection',
    confidence: record.confidence,
    box: {
      x1: box.x1,
      y1: box.y1,
      x2: box.x2,
      y2: box.y2,
    },
  };
}

function normalizeDiseaseResult(value: unknown): DiseaseDetectionResult {
  const record = asRecord(value);
  if (!record || (!('top' in record) && !Array.isArray(record.detections))) {
    throw new Error('The field server returned an unreadable detection result.');
  }

  const detections = (Array.isArray(record.detections) ? record.detections : [])
    .map(parseDetection)
    .filter((detection): detection is DiseaseDetection => detection !== null);
  const top = parseDetection(record.top) ?? detections[0] ?? null;
  const reportedCount = isFiniteNumber(record.count) ? record.count : 0;
  const count = Math.max(reportedCount, detections.length, top ? 1 : 0);
  const message =
    typeof record.message === 'string' && record.message.trim()
      ? record.message.trim()
      : top
        ? 'Detection complete'
        : 'No disease region detected';

  return { top, detections, count, message };
}

function fileNameForType(type: string): string {
  const subtype = type.split('/')[1]?.toLowerCase() ?? 'jpeg';
  const extension = subtype === 'jpeg' ? 'jpg' : subtype.replace('svg+xml', 'svg');
  return `aloe-leaf.${extension || 'jpg'}`;
}

function describeImageUri(imageUri: string): { name: string; type: string } {
  const dataMatch = /^data:(image\/[a-z0-9.+-]+)[;,]/i.exec(imageUri);
  const type = dataMatch?.[1]?.toLowerCase() ?? 'image/jpeg';
  return { name: fileNameForType(type), type };
}

/**
 * Send one captured leaf frame to the FastAPI disease detector.
 *
 * The preview stays session-scoped on the client. This function uploads a
 * single multipart copy for the request and keeps nothing afterwards. The
 * caller owns the result state and should surface unreachable-server errors
 * with a retry action.
 */
export async function detectDisease(imageUri: string): Promise<DiseaseDetectionResult> {
  const uri = imageUri.trim();
  if (!uri) {
    throw new Error('A captured frame is required for disease detection.');
  }

  const form = new FormData();
  const image = describeImageUri(uri);

  if (Platform.OS === 'web') {
    // expo-camera returns a data URI on web. The browser FormData needs a
    // Blob rather than React Native's { uri, name, type } file part.
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error('The captured frame could not be prepared for analysis.');
    }

    const blob = await response.blob();
    const type = blob.type.startsWith('image/') ? blob.type : image.type;
    form.append('file', blob, fileNameForType(type));
  } else {
    form.append('file', {
      uri,
      name: image.name,
      type: image.type,
    } as unknown as Blob);
  }

  const { data } = await apiClient.post<unknown>(DISEASE_ENDPOINT, form, {
    // Override the JSON default so axios keeps the FormData intact. Axios
    // removes this header before dispatch on web and React Native so the
    // platform can add the multipart boundary.
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: ANALYSIS_TIMEOUT_MS,
  });

  return normalizeDiseaseResult(data);
}

/**
 * A request counts as offline only when it never reached a server. HTTP
 * failures with a response are server-side failures, not connectivity loss.
 */
export function isMlOfflineError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true;
  return error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';
}

/** Read the FastAPI `detail` string when the server supplied one. */
export function getMlErrorDetail(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null;

  const detail = asRecord(error.response?.data)?.detail;
  return typeof detail === 'string' && detail.trim() ? detail.trim() : null;
}
