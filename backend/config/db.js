import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path in ../database/sikadu.db
const dbPath = path.resolve(__dirname, '../../database/sikadu.db');

if (!fs.existsSync(dbPath)) {
  console.warn(`[SIKADU DB] Database belum ditemukan di ${dbPath}. Menjalankan init-db otomatis...`);
}

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');

export default db;
