import * as Network from 'expo-network';

import { apiClient } from '@/lib/api/client';
import { useAppStore } from '@/stores/useAppStore';
import { getDatabase } from '@/lib/db/database';
import { createFarm } from '@/lib/db/farms';
import { createPlant } from '@/lib/db/plants';
import {
  countPendingSyncItems,
  getSyncState,
  listPendingSyncItems,
  markSyncItemStatus,
  removeSyncItem,
  setSyncState,
  type SyncEntity,
} from '@/lib/db/syncQueue';

export type SyncResult = {
  uploaded: number;
  downloaded: number;
  failed: number;
  online: boolean;
  message: string;
};

export async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return Boolean(state.isConnected && state.isInternetReachable);
  } catch {
    return false;
  }
}

async function backendReachable(): Promise<boolean> {
  if (!(await isOnline())) return false;
  try {
    await apiClient.get('/health', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function enqueueFarmSync(farm: { id: string; name: string; area: string; status: string; createdAt: string; updatedAt: string }, ownerId?: string | null): Promise<void> {
  await enqueueSyncItem('farms', farm.id, {
    name: farm.name,
    area: farm.area,
    status: farm.status,
    created_at: farm.createdAt,
    updated_at: farm.updatedAt,
  }, ownerId);
}

export async function enqueuePlantSync(plant: { id: string; label: string; farmId: string | null; status: string; createdAt: string; updatedAt: string }, ownerId?: string | null): Promise<void> {
  await enqueueSyncItem('plants', plant.id, {
    farm_id: plant.farmId,
    label: plant.label,
    status: plant.status,
    created_at: plant.createdAt,
    updated_at: plant.updatedAt,
  }, ownerId);
}

async function enqueueSyncItem(entity: SyncEntity, localId: string, payload: Record<string, unknown>, ownerId?: string | null): Promise<void> {
  const { enqueueSync } = await import('@/lib/db/syncQueue');
  await enqueueSync({ entity, localId, payload, ownerId });
}

async function applyDownloadedFarms(records: any[], ownerId: string | null): Promise<number> {
  const db = await getDatabase();
  let count = 0;
  for (const record of records) {
    const localId = record.local_id ?? record.id;
    const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM farms WHERE id = ?', localId);
    if (existing) {
      await db.runAsync(
        'UPDATE farms SET owner_id = ?, name = ?, area = ?, status = ?, updated_at = ? WHERE id = ?',
        ownerId,
        record.name ?? 'Untitled plot',
        record.area ?? '—',
        record.status === 'Fallow' ? 'Fallow' : 'Active',
        record.updated_at ?? new Date().toISOString(),
        localId,
      );
    } else {
      await createFarm({ name: record.name ?? 'Untitled plot', area: record.area ?? '—' }, ownerId);
    }
    count += 1;
  }
  return count;
}

async function applyDownloadedPlants(records: any[], ownerId: string | null): Promise<number> {
  const db = await getDatabase();
  let count = 0;
  for (const record of records) {
    const localId = record.local_id ?? record.id;
    const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM plants WHERE id = ?', localId);
    if (existing) {
      await db.runAsync(
        'UPDATE plants SET owner_id = ?, farm_id = ?, label = ?, status = ?, updated_at = ? WHERE id = ?',
        ownerId,
        record.farm_id ?? null,
        record.label ?? 'Unnamed specimen',
        record.status === 'Ready' ? 'Ready' : record.status === 'Archived' ? 'Archived' : 'Needs scan',
        record.updated_at ?? new Date().toISOString(),
        localId,
      );
    } else {
      await createPlant({ label: record.label ?? 'Unnamed specimen', farmId: record.farm_id ?? null, status: record.status === 'Ready' ? 'Ready' : record.status === 'Archived' ? 'Archived' : 'Needs scan' }, ownerId);
    }
    count += 1;
  }
  return count;
}

export async function syncNow(): Promise<SyncResult> {
  const ownerId = useAppStore.getState().accountStatus === 'synced'
    ? useAppStore.getState().supabaseUserId
    : useAppStore.getState().localProfileId;

  const accessToken = useAppStore.getState().supabaseAccessToken;
  if (!accessToken) {
    return {
      uploaded: 0,
      downloaded: 0,
      failed: await countPendingSyncItems(ownerId),
      online: await isOnline(),
      message: 'Sign in to sync cloud records. Local records remain on this device.',
    };
  }

  const online = await backendReachable();
  if (!online) {
    return {
      uploaded: 0,
      downloaded: 0,
      failed: await countPendingSyncItems(ownerId),
      online: false,
      message: 'Backend unavailable. Records remain local and the queue is preserved.',
    };
  }

  const pending = await listPendingSyncItems(ownerId);
  let uploaded = 0;
  let failed = 0;
  let sessionExpired = false;

  for (const item of pending) {
    if (sessionExpired) break;

    await markSyncItemStatus(item.id, 'syncing');
    try {
      const response = await apiClient.post('/sync/upload', [
        {
          collection: item.entity,
          local_id: item.localId,
          payload: item.payload,
        },
      ]);
      const result = response.data?.results?.[0];
      if (result?.status === 'created' || result?.status === 'updated') {
        await removeSyncItem(item.id);
        uploaded += 1;
      } else {
        await markSyncItemStatus(item.id, 'failed', 'Unexpected sync response');
        failed += 1;
      }
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401) {
        sessionExpired = true;
        await markSyncItemStatus(item.id, 'failed', 'Session expired');
        failed += 1;
        continue;
      }
      const message = error instanceof Error ? error.message : 'Sync upload failed';
      await markSyncItemStatus(item.id, 'failed', message);
      failed += 1;
    }
  }

  if (sessionExpired) {
    return {
      uploaded,
      downloaded: 0,
      failed: failed + (await countPendingSyncItems(ownerId)),
      online: true,
      message: 'Session expired. Sign in again to sync cloud records.',
    };
  }

  let downloaded = 0;
  try {
    const since = await getSyncState('last_download_at');
    const response = await apiClient.get('/sync/download', { params: since ? { since } : {} });
    const data = response.data?.data ?? {};

    if (Array.isArray(data.farms)) {
      downloaded += await applyDownloadedFarms(data.farms, ownerId);
    }
    if (Array.isArray(data.plants)) {
      downloaded += await applyDownloadedPlants(data.plants, ownerId);
    }

    await setSyncState('last_download_at', new Date().toISOString());
  } catch (error: any) {
    if (error?.response?.status !== 401) {
      loggerWarn('Download sync failed', error);
    }
  }

  const remaining = await countPendingSyncItems();
  return {
    uploaded,
    downloaded,
    failed: failed + remaining,
    online: true,
    message: remaining > 0
      ? `Sync finished with ${remaining} item(s) still pending.`
      : 'Sync completed successfully.',
  };
}

function loggerWarn(message: string, error: unknown): void {
  console.warn('[FarmSystem sync]', message, error);
}
