import { getDatabase } from './database';

export type ScanMode = 'diagnosis' | 'maturity' | 'grading';

export type ScanRecord = {
  id: string;
  mode: ScanMode;
  resultJson: string;
  createdAt: string;
  updatedAt: string;
};

function newId(): string {
  return `scan_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function ensureScanTable() {
  const db = await getDatabase();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS scan_records (
      id TEXT PRIMARY KEY NOT NULL,
      mode TEXT NOT NULL,
      result_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}

export async function listScans(ownerId?: string | null, mode?: ScanMode): Promise<ScanRecord[]> {
  const db = await ensureScanTable();

  if (ownerId) {
    await db.runAsync('UPDATE scan_records SET owner_id = ? WHERE owner_id IS NULL', ownerId);
  }

  let rows;
  if (ownerId && mode) {
    rows = await db.getAllAsync<any>(
      'SELECT id, mode, result_json, created_at, updated_at FROM scan_records WHERE owner_id = ? AND mode = ? ORDER BY created_at DESC',
      ownerId,
      mode,
    );
  } else if (ownerId) {
    rows = await db.getAllAsync<any>(
      'SELECT id, mode, result_json, created_at, updated_at FROM scan_records WHERE owner_id = ? ORDER BY created_at DESC',
      ownerId,
    );
  } else if (mode) {
    rows = await db.getAllAsync<any>(
      'SELECT id, mode, result_json, created_at, updated_at FROM scan_records WHERE mode = ? ORDER BY created_at DESC',
      mode,
    );
  } else {
    rows = await db.getAllAsync<any>(
      'SELECT id, mode, result_json, created_at, updated_at FROM scan_records ORDER BY created_at DESC',
    );
  }

  if (ownerId) {
    await db.runAsync('UPDATE scan_records SET owner_id = ? WHERE owner_id IS NULL', ownerId);
  }

  return rows.map((row) => ({
    id: row.id,
    mode: row.mode === 'maturity' ? 'maturity' : row.mode === 'grading' ? 'grading' : 'diagnosis',
    resultJson: row.result_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createScan(input: { mode: ScanMode; result: unknown }, ownerId?: string | null): Promise<ScanRecord> {
  const db = await ensureScanTable();
  const now = new Date().toISOString();
  const record: ScanRecord = {
    id: newId(),
    mode: input.mode,
    resultJson: JSON.stringify(input.result ?? null),
    createdAt: now,
    updatedAt: now,
  };

  await db.runAsync(
    'INSERT INTO scan_records (id, owner_id, mode, result_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    record.id,
    ownerId ?? null,
    record.mode,
    record.resultJson,
    record.createdAt,
    record.updatedAt,
  );

  return record;
}

export async function updateScanResult(id: string, result: unknown): Promise<void> {
  const db = await ensureScanTable();
  await db.runAsync(
    'UPDATE scan_records SET result_json = ?, updated_at = ? WHERE id = ?',
    JSON.stringify(result ?? null),
    new Date().toISOString(),
    id,
  );
}

export async function deleteScan(id: string): Promise<void> {
  const db = await ensureScanTable();
  await db.runAsync('DELETE FROM scan_records WHERE id = ?', id);
}
