import axios from 'axios';

import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { useAppStore } from '@/stores/useAppStore';

import type { CloudProfile, ProfileIssueStatus, ProfileSyncResult } from './types';

const PROFILE_REQUEST_TIMEOUT_MS = 8_000;

let inFlight: Promise<ProfileSyncResult> | null = null;

/**
 * Fetch the MongoDB user profile once per effort.
 *
 * The single-flight guard means concurrent callers (for example, the email
 * sign-in flow and Supabase's initial session event) share one request rather
 * than issuing duplicates. A later call is allowed so an offline failure can
 * be retried from the account sheet.
 */
export function syncCloudProfile(): Promise<ProfileSyncResult> {
  const current = useAppStore.getState();

  // A profile already held for this session is authoritative; there is nothing
  // new to fetch. This also keeps the sign-in flow from issuing a duplicate if
  // an auth-state event completed the lookup first.
  if (current.cloudProfile && current.profileSyncStatus === 'synced') {
    return Promise.resolve({ status: 'synced', profile: current.cloudProfile });
  }

  if (inFlight) return inFlight;

  inFlight = requestCloudProfile().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

async function requestCloudProfile(): Promise<ProfileSyncResult> {
  try {
    useAppStore.getState().setProfileSyncing();

    const response = await apiClient.get<unknown>('/auth/me', {
      timeout: PROFILE_REQUEST_TIMEOUT_MS,
    });
    const profile = readCloudProfile(response.data);

    if (!profile) {
      logger.warn('Cloud profile response did not contain a usable id');
      return reportProfileIssue(
        'error',
        'Signed in on this device, but the cloud profile could not be read. Local records are unaffected — retry from Account.',
      );
    }

    useAppStore.getState().setCloudProfile(profile);
    logger.info('Cloud profile loaded from MongoDB');
    return { status: 'synced', profile };
  } catch (error) {
    return describeProfileFailure(error);
  }
}

function readCloudProfile(value: unknown): CloudProfile | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const rawId = record.id ?? record._id;
  if (typeof rawId !== 'string' || rawId.length === 0) {
    return null;
  }

  return { ...record, id: rawId };
}

function describeProfileFailure(error: unknown): ProfileSyncResult {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      logger.warn('Cloud profile verification rejected:', status);
      return reportProfileIssue(
        'unauthorized',
        'Signed in on this device, but the cloud profile could not be verified for this account. Local records are unaffected — retry from Account or sign out and sign in again.',
      );
    }

    if (!error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      logger.warn('Cloud profile backend unavailable:', error.code ?? error.message);
      return reportProfileIssue(
        'offline',
        'Signed in on this device. The backend is unreachable right now, so the cloud profile was not loaded. It can be retried from Account when the connection returns.',
      );
    }

    logger.error('Cloud profile request failed:', status, error.message);
    return reportProfileIssue(
      'error',
      'Signed in on this device, but the cloud profile could not be loaded. Local records are unaffected — retry from Account.',
    );
  }

  logger.error('Cloud profile request failed unexpectedly:', {
    name: error instanceof Error ? error.name : typeof error,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  return reportProfileIssue(
    'error',
    'Signed in on this device, but the cloud profile could not be loaded. Local records are unaffected — retry from Account.',
  );
}

function reportProfileIssue(
  status: ProfileIssueStatus,
  message: string,
): ProfileSyncResult {
  useAppStore.getState().setProfileSyncIssue(status, message);
  return { status, message };
}
