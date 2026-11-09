import { getDatabase } from './database';

export type LocalProfile = {
  id: string;
  createdAt: string;
};

export async function getLocalProfile(): Promise<LocalProfile | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ id: string; created_at: string }>(
    'SELECT id, created_at FROM local_profile LIMIT 1',
  );

  if (!row) return null;

  return {
    id: row.id,
    createdAt: row.created_at,
  };
}

export async function createLocalProfile(): Promise<LocalProfile> {
  const existing = await getLocalProfile();
  if (existing) return existing;

  const db = await getDatabase();
  const profile: LocalProfile = {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
  };

  await db.runAsync(
    'INSERT INTO local_profile (id, created_at) VALUES (?, ?)',
    profile.id,
    profile.createdAt,
  );

  return profile;
}
