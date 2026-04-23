import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
mkdirSync(dataDir, { recursive: true });

export const db = new Database(join(dataDir, 'rankings.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS rankings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    time       REAL    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);
