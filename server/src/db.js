import { JSONFilePreset } from 'lowdb/node';
import path from 'path';

let db;

export async function initDb() {
  const defaultData = { documents: [] };
  // Store db.json in server root
  const dbPath = path.resolve('db.json');
  db = await JSONFilePreset(dbPath, defaultData);
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}
