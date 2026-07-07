import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "drinks.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS drinks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    name TEXT NOT NULL,
    drink_type TEXT NOT NULL,
    volume_ml REAL NOT NULL,
    abv_percent REAL NOT NULL,
    calories REAL NOT NULL,
    standard_drinks REAL NOT NULL,
    notes TEXT
  )
`);

export default db;

export function standardDrinks(volumeMl: number, abvPercent: number) {
  const gramsAlcohol = volumeMl * (abvPercent / 100) * 0.789;
  return gramsAlcohol / 14;
}
