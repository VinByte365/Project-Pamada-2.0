import * as SQLite from 'expo-sqlite';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('farmsystem.db');
  }

  const db = await databasePromise;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS local_profile (
      id TEXT PRIMARY KEY NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS farms (
      id TEXT PRIMARY KEY NOT NULL,
      owner_id TEXT,
      name TEXT NOT NULL,
      area TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plants (
      id TEXT PRIMARY KEY NOT NULL,
      owner_id TEXT,
      farm_id TEXT,
      label TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS scan_records (
      id TEXT PRIMARY KEY NOT NULL,
      owner_id TEXT,
      mode TEXT NOT NULL,
      result_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      owner_id TEXT,
      entity TEXT NOT NULL,
      local_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  for (const statement of [
    'ALTER TABLE farms ADD COLUMN owner_id TEXT',
    'ALTER TABLE plants ADD COLUMN owner_id TEXT',
    'ALTER TABLE scan_records ADD COLUMN owner_id TEXT',
    'ALTER TABLE sync_queue ADD COLUMN owner_id TEXT',
  ]) {
    try {
      await db.execAsync(statement);
    } catch {
      // Column already exists.
    }
  }

  return db;
}
