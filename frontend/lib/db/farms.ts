import { getDatabase } from './database';

export type FarmStatus = 'Active' | 'Fallow';

export type FarmRecord = {
  id: string;
  name: string;
  area: string;
  status: FarmStatus;
  createdAt: string;
  updatedAt: string;
};

function newId(): string {
  return `farm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function listFarms(ownerId?: string | null): Promise<FarmRecord[]> {
  const db = await getDatabase();

  if (ownerId) {
    await db.runAsync('UPDATE farms SET owner_id = ? WHERE owner_id IS NULL', ownerId);
  }

  const rows = ownerId
    ? await db.getAllAsync<{
        id: string;
        name: string;
        area: string;
        status: string;
        created_at: string;
        updated_at: string;
      }>('SELECT id, name, area, status, created_at, updated_at FROM farms WHERE owner_id = ? ORDER BY created_at DESC', ownerId)
    : await db.getAllAsync<{
        id: string;
        name: string;
        area: string;
        status: string;
        created_at: string;
        updated_at: string;
      }>('SELECT id, name, area, status, created_at, updated_at FROM farms ORDER BY created_at DESC');

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    area: row.area,
    status: row.status === 'Fallow' ? 'Fallow' : 'Active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createFarm(input: { name: string; area: string }, ownerId?: string | null): Promise<FarmRecord> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const farm: FarmRecord = {
    id: newId(),
    name: input.name.trim() || 'Untitled plot',
    area: input.area.trim() || '—',
    status: 'Active',
    createdAt: now,
    updatedAt: now,
  };

  await db.runAsync(
    'INSERT INTO farms (id, owner_id, name, area, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    farm.id,
    ownerId ?? null,
    farm.name,
    farm.area,
    farm.status,
    farm.createdAt,
    farm.updatedAt,
  );

  return farm;
}

export async function updateFarmStatus(id: string, status: FarmStatus): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE farms SET status = ?, updated_at = ? WHERE id = ?',
    status,
    new Date().toISOString(),
    id,
  );
}

export async function deleteFarm(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM farms WHERE id = ?', id);
}
