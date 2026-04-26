import Database from "better-sqlite3";
import path from "path";
import type { FoodEntry, DailyGoals, FoodItem } from "./types";

const DB_PATH = path.join(process.cwd(), "data", "tracker.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    const fs = require("fs");
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initTables(db);
  }
  return db;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS food_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
      description TEXT NOT NULL,
      items TEXT NOT NULL DEFAULT '[]',
      total_calories REAL NOT NULL DEFAULT 0,
      total_protein REAL NOT NULL DEFAULT 0,
      total_carbs REAL NOT NULL DEFAULT 0,
      total_fat REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      calories REAL NOT NULL DEFAULT 2000,
      protein REAL NOT NULL DEFAULT 150,
      carbs REAL NOT NULL DEFAULT 200,
      fat REAL NOT NULL DEFAULT 65
    );

    INSERT OR IGNORE INTO goals (id, calories, protein, carbs, fat)
    VALUES (1, 2000, 150, 200, 65);

    CREATE INDEX IF NOT EXISTS idx_entries_date ON food_entries(date);
  `);
}

// --- Food Entries ---

export function addEntry(entry: {
  date: string;
  meal_type: string;
  description: string;
  items: FoodItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
}): FoodEntry {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO food_entries (date, meal_type, description, items, total_calories, total_protein, total_carbs, total_fat)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    entry.date,
    entry.meal_type,
    entry.description,
    JSON.stringify(entry.items),
    entry.total_calories,
    entry.total_protein,
    entry.total_carbs,
    entry.total_fat
  );
  return getEntryById(result.lastInsertRowid as number)!;
}

export function getEntryById(id: number): FoodEntry | undefined {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM food_entries WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  return row ? parseEntryRow(row) : undefined;
}

export function getEntriesByDate(date: string): FoodEntry[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM food_entries WHERE date = ? ORDER BY created_at ASC")
    .all(date) as Record<string, unknown>[];
  return rows.map(parseEntryRow);
}

export function getEntriesRange(startDate: string, endDate: string): FoodEntry[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM food_entries WHERE date >= ? AND date <= ? ORDER BY date DESC, created_at ASC")
    .all(startDate, endDate) as Record<string, unknown>[];
  return rows.map(parseEntryRow);
}

export function deleteEntry(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM food_entries WHERE id = ?").run(id);
  return result.changes > 0;
}

export function updateEntry(
  id: number,
  updates: Partial<{
    meal_type: string;
    items: FoodItem[];
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
  }>
): FoodEntry | undefined {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.meal_type !== undefined) {
    fields.push("meal_type = ?");
    values.push(updates.meal_type);
  }
  if (updates.items !== undefined) {
    fields.push("items = ?");
    values.push(JSON.stringify(updates.items));
  }
  if (updates.total_calories !== undefined) {
    fields.push("total_calories = ?");
    values.push(updates.total_calories);
  }
  if (updates.total_protein !== undefined) {
    fields.push("total_protein = ?");
    values.push(updates.total_protein);
  }
  if (updates.total_carbs !== undefined) {
    fields.push("total_carbs = ?");
    values.push(updates.total_carbs);
  }
  if (updates.total_fat !== undefined) {
    fields.push("total_fat = ?");
    values.push(updates.total_fat);
  }

  if (fields.length === 0) return getEntryById(id);

  values.push(id);
  db.prepare(`UPDATE food_entries SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values
  );
  return getEntryById(id);
}

// --- Goals ---

export function getGoals(): DailyGoals {
  const db = getDb();
  const row = db.prepare("SELECT * FROM goals WHERE id = 1").get() as Record<string, number>;
  return {
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
  };
}

export function updateGoals(goals: Partial<DailyGoals>): DailyGoals {
  const db = getDb();
  const current = getGoals();
  const updated = { ...current, ...goals };
  db.prepare(
    "UPDATE goals SET calories = ?, protein = ?, carbs = ?, fat = ? WHERE id = 1"
  ).run(updated.calories, updated.protein, updated.carbs, updated.fat);
  return updated;
}

// --- Helpers ---

function parseEntryRow(row: Record<string, unknown>): FoodEntry {
  return {
    id: row.id as number,
    date: row.date as string,
    meal_type: row.meal_type as FoodEntry["meal_type"],
    description: row.description as string,
    items: JSON.parse(row.items as string) as FoodItem[],
    total_calories: row.total_calories as number,
    total_protein: row.total_protein as number,
    total_carbs: row.total_carbs as number,
    total_fat: row.total_fat as number,
    created_at: row.created_at as string,
  };
}
