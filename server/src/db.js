import { JSONFilePreset } from 'lowdb/node';
import path from 'path';

let db;

export async function initDb() {
  const defaultData = { documents: [] };
  const dataDir = process.env.DATA_DIR || process.cwd();
  const dbPath = path.join(dataDir, 'db.json');
  db = await JSONFilePreset(dbPath, defaultData);
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}
