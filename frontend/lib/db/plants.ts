import { getDatabase } from './database';

export type PlantStatus = 'Needs scan' | 'Ready' | 'Archived';

export type PlantRecord = {
  id: string;
  farmId: string | null;
  label: string;
  status: PlantStatus;
  createdAt: string;
  updatedAt: string;
};

function newId(): string {
  return `plant_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function listPlants(ownerId?: string | null, farmId?: string): Promise<PlantRecord[]> {
  const db = await getDatabase();

  if (ownerId) {
    await db.runAsync('UPDATE plants SET owner_id = ? WHERE owner_id IS NULL', ownerId);
  }

  let rows;
  if (ownerId && farmId) {
    rows = await db.getAllAsync<any>(
      'SELECT id, farm_id, label, status, created_at, updated_at FROM plants WHERE owner_id = ? AND farm_id = ? ORDER BY created_at DESC',
      ownerId,
      farmId,
    );
  } else if (ownerId) {
    rows = await db.getAllAsync<any>(
      'SELECT id, farm_id, label, status, created_at, updated_at FROM plants WHERE owner_id = ? ORDER BY created_at DESC',
      ownerId,
    );
  } else if (farmId) {
    rows = await db.getAllAsync<any>(
      'SELECT id, farm_id, label, status, created_at, updated_at FROM plants WHERE farm_id = ? ORDER BY created_at DESC',
      farmId,
    );
  } else {
    rows = await db.getAllAsync<any>(
      'SELECT id, farm_id, label, status, created_at, updated_at FROM plants ORDER BY created_at DESC',
    );
  }

  return rows.map((row) => ({
    id: row.id,
    farmId: row.farm_id,
    label: row.label,
    status: row.status === 'Ready' ? 'Ready' : row.status === 'Archived' ? 'Archived' : 'Needs scan',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createPlant(input: { label: string; farmId?: string | null; status?: PlantStatus }, ownerId?: string | null): Promise<PlantRecord> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const plant: PlantRecord = {
    id: newId(),
    farmId: input.farmId ?? null,
    label: input.label.trim() || 'Unnamed specimen',
    status: input.status ?? 'Needs scan',
    createdAt: now,
    updatedAt: now,
  };

  await db.runAsync(
    'INSERT INTO plants (id, owner_id, farm_id, label, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    plant.id,
    ownerId ?? null,
    plant.farmId,
    plant.label,
    plant.status,
    plant.createdAt,
    plant.updatedAt,
  );

  return plant;
}

export async function updatePlantStatus(id: string, status: PlantStatus): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE plants SET status = ?, updated_at = ? WHERE id = ?',
    status,
    new Date().toISOString(),
    id,
  );
}

export async function deletePlant(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM plants WHERE id = ?', id);
}
