import { getDatabase } from './database';

export type SyncEntity = 'farms' | 'plants';

export type SyncQueueItem = {
  id: string;
  entity: SyncEntity;
  localId: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'syncing' | 'failed' | 'done';
  attempts: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

function newId(): string {
  return `sync_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function enqueueSync(input: { entity: SyncEntity; localId: string; payload: Record<string, unknown>; ownerId?: string | null }): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM sync_queue WHERE entity = ? AND local_id = ? AND (owner_id IS ? OR owner_id IS NULL) AND status IN (?, ?)',
    input.entity,
    input.localId,
    input.ownerId ?? null,
    'pending',
    'failed',
  );

  if (existing) {
    await db.runAsync(
      'UPDATE sync_queue SET owner_id = ?, payload_json = ?, status = ?, updated_at = ? WHERE id = ?',
      input.ownerId ?? null,
      JSON.stringify(input.payload),
      'pending',
      now,
      existing.id,
    );
    return;
  }

  await db.runAsync(
    'INSERT INTO sync_queue (id, owner_id, entity, local_id, payload_json, status, attempts, last_error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    newId(),
    input.ownerId ?? null,
    input.entity,
    input.localId,
    JSON.stringify(input.payload),
    'pending',
    0,
    null,
    now,
    now,
  );
}

export async function listPendingSyncItems(ownerId?: string | null): Promise<SyncQueueItem[]> {
  const db = await getDatabase();
  const rows = ownerId
    ? await db.getAllAsync<any>(
        "SELECT id, entity, local_id, payload_json, status, attempts, last_error, created_at, updated_at FROM sync_queue WHERE (owner_id IS ? OR owner_id IS NULL) AND status IN ('pending', 'failed') ORDER BY created_at ASC",
        ownerId,
      )
    : await db.getAllAsync<any>(
        "SELECT id, entity, local_id, payload_json, status, attempts, last_error, created_at, updated_at FROM sync_queue WHERE status IN ('pending', 'failed') ORDER BY created_at ASC",
      );

  if (ownerId) {
    await db.runAsync('UPDATE sync_queue SET owner_id = ? WHERE owner_id IS NULL', ownerId);
  }

  return rows.map((row) => ({
    id: row.id,
    entity: row.entity === 'plants' ? 'plants' : 'farms',
    localId: row.local_id,
    payload: JSON.parse(row.payload_json) as Record<string, unknown>,
    status: row.status === 'failed' ? 'failed' : 'pending',
    attempts: row.attempts,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function markSyncItemStatus(id: string, status: SyncQueueItem['status'], error?: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE sync_queue SET status = ?, attempts = attempts + 1, last_error = ?, updated_at = ? WHERE id = ?',
    status,
    error ?? null,
    new Date().toISOString(),
    id,
  );
}

export async function removeSyncItem(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sync_queue WHERE id = ?', id);
}

export async function getSyncState(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM sync_state WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setSyncState(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO sync_state (key, value) VALUES (?, ?)',
    key,
    value,
  );
}
export async function countPendingSyncItems(ownerId?: string | null): Promise<number> {
  const db = await getDatabase();
  const row = ownerId
    ? await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM sync_queue WHERE (owner_id IS ? OR owner_id IS NULL) AND status IN ('pending', 'failed')",
        ownerId,
      )
    : await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM sync_queue WHERE status IN ('pending', 'failed')",
      );
  if (ownerId) {
    await db.runAsync('UPDATE sync_queue SET owner_id = ? WHERE owner_id IS NULL', ownerId);
  }
  return row?.count ?? 0;
}
