import { createClient, type Client, type InValue } from "@libsql/client";
import type { FoodEntry, DailyGoals, FoodItem, User } from "./types";

let client: Client | null = null;
let initialized = false;

function getClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) {
      throw new Error("TURSO_DATABASE_URL is not set");
    }
    client = createClient({ url, authToken });
  }
  return client;
}

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 200, fat: 65 };

async function ensureInitialized(c: Client) {
  if (initialized) return;

  await c.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

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

    CREATE TABLE IF NOT EXISTS user_goals (
      user_id INTEGER PRIMARY KEY,
      calories REAL NOT NULL DEFAULT 2000,
      protein REAL NOT NULL DEFAULT 150,
      carbs REAL NOT NULL DEFAULT 200,
      fat REAL NOT NULL DEFAULT 65
    );

    CREATE INDEX IF NOT EXISTS idx_entries_date ON food_entries(date);
  `);

  // Add user_id column to food_entries if it doesn't exist yet (migration step)
  try {
    await c.execute("ALTER TABLE food_entries ADD COLUMN user_id INTEGER");
  } catch {
    // column already exists
  }
  await c.execute(
    "CREATE INDEX IF NOT EXISTS idx_entries_user_date ON food_entries(user_id, date)"
  );

  initialized = true;
}

async function db(): Promise<Client> {
  const c = getClient();
  await ensureInitialized(c);
  return c;
}

// --- Users ---

export async function countUsers(): Promise<number> {
  const c = await db();
  const result = await c.execute("SELECT COUNT(*) AS n FROM users");
  return Number(result.rows[0].n);
}

export async function getUserByUsername(
  username: string
): Promise<(User & { password_hash: string }) | undefined> {
  const c = await db();
  const result = await c.execute({
    sql: "SELECT * FROM users WHERE username = ?",
    args: [username],
  });
  const row = result.rows[0];
  if (!row) return undefined;
  return {
    id: Number(row.id),
    username: row.username as string,
    password_hash: row.password_hash as string,
    is_admin: Boolean(row.is_admin),
    created_at: row.created_at as string,
  };
}

export async function getUserById(id: number): Promise<User | undefined> {
  const c = await db();
  const result = await c.execute({
    sql: "SELECT id, username, is_admin, created_at FROM users WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  if (!row) return undefined;
  return {
    id: Number(row.id),
    username: row.username as string,
    is_admin: Boolean(row.is_admin),
    created_at: row.created_at as string,
  };
}

export async function listUsers(): Promise<User[]> {
  const c = await db();
  const result = await c.execute(
    "SELECT id, username, is_admin, created_at FROM users ORDER BY created_at ASC"
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    username: row.username as string,
    is_admin: Boolean(row.is_admin),
    created_at: row.created_at as string,
  }));
}

/**
 * Creates a user. If `bootstrapAdmin` is true, also runs the legacy-data migration:
 * - assigns any food_entries with NULL user_id to this new user
 * - copies a legacy single-row `goals` table (if present) into user_goals for this user
 */
export async function createUser(opts: {
  username: string;
  passwordHash: string;
  isAdmin: boolean;
  bootstrapAdmin?: boolean;
}): Promise<User> {
  const c = await db();
  const result = await c.execute({
    sql: "INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)",
    args: [opts.username, opts.passwordHash, opts.isAdmin ? 1 : 0],
  });
  const userId = Number(result.lastInsertRowid);

  // Seed default goals row for this user
  await c.execute({
    sql: "INSERT INTO user_goals (user_id, calories, protein, carbs, fat) VALUES (?, ?, ?, ?, ?)",
    args: [
      userId,
      DEFAULT_GOALS.calories,
      DEFAULT_GOALS.protein,
      DEFAULT_GOALS.carbs,
      DEFAULT_GOALS.fat,
    ],
  });

  if (opts.bootstrapAdmin) {
    // Adopt all orphaned entries (from before users existed)
    await c.execute({
      sql: "UPDATE food_entries SET user_id = ? WHERE user_id IS NULL",
      args: [userId],
    });

    // If a legacy single-row goals table exists, copy its values into this admin's user_goals
    try {
      const legacy = await c.execute("SELECT * FROM goals WHERE id = 1");
      const row = legacy.rows[0];
      if (row) {
        await c.execute({
          sql: "UPDATE user_goals SET calories = ?, protein = ?, carbs = ?, fat = ? WHERE user_id = ?",
          args: [
            row.calories as number,
            row.protein as number,
            row.carbs as number,
            row.fat as number,
            userId,
          ],
        });
      }
    } catch {
      // legacy goals table doesn't exist — fresh install, nothing to migrate
    }
  }

  return (await getUserById(userId))!;
}

export async function updateUsername(
  userId: number,
  newUsername: string
): Promise<User | undefined> {
  const c = await db();
  await c.execute({
    sql: "UPDATE users SET username = ? WHERE id = ?",
    args: [newUsername, userId],
  });
  return getUserById(userId);
}

export async function updatePasswordHash(
  userId: number,
  passwordHash: string
): Promise<void> {
  const c = await db();
  await c.execute({
    sql: "UPDATE users SET password_hash = ? WHERE id = ?",
    args: [passwordHash, userId],
  });
}

// --- Food Entries ---

export async function addEntry(
  userId: number,
  entry: {
    date: string;
    meal_type: string;
    description: string;
    items: FoodItem[];
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
  }
): Promise<FoodEntry> {
  const c = await db();
  const result = await c.execute({
    sql: `INSERT INTO food_entries (user_id, date, meal_type, description, items, total_calories, total_protein, total_carbs, total_fat)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      userId,
      entry.date,
      entry.meal_type,
      entry.description,
      JSON.stringify(entry.items),
      entry.total_calories,
      entry.total_protein,
      entry.total_carbs,
      entry.total_fat,
    ],
  });
  const id = Number(result.lastInsertRowid);
  return (await getEntryById(userId, id))!;
}

export async function getEntryById(
  userId: number,
  id: number
): Promise<FoodEntry | undefined> {
  const c = await db();
  const result = await c.execute({
    sql: "SELECT * FROM food_entries WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });
  const row = result.rows[0];
  return row ? parseEntryRow(row) : undefined;
}

export async function getEntriesByDate(
  userId: number,
  date: string
): Promise<FoodEntry[]> {
  const c = await db();
  const result = await c.execute({
    sql: "SELECT * FROM food_entries WHERE user_id = ? AND date = ? ORDER BY created_at ASC",
    args: [userId, date],
  });
  return result.rows.map(parseEntryRow);
}

export async function getEntriesRange(
  userId: number,
  startDate: string,
  endDate: string
): Promise<FoodEntry[]> {
  const c = await db();
  const result = await c.execute({
    sql: "SELECT * FROM food_entries WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date DESC, created_at ASC",
    args: [userId, startDate, endDate],
  });
  return result.rows.map(parseEntryRow);
}

export async function deleteEntry(
  userId: number,
  id: number
): Promise<boolean> {
  const c = await db();
  const result = await c.execute({
    sql: "DELETE FROM food_entries WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });
  return result.rowsAffected > 0;
}

export async function updateEntry(
  userId: number,
  id: number,
  updates: Partial<{
    meal_type: string;
    items: FoodItem[];
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
  }>
): Promise<FoodEntry | undefined> {
  const fields: string[] = [];
  const values: InValue[] = [];

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

  if (fields.length === 0) return getEntryById(userId, id);

  const c = await db();
  values.push(id, userId);
  await c.execute({
    sql: `UPDATE food_entries SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`,
    args: values,
  });
  return getEntryById(userId, id);
}

// --- Goals ---

export async function getGoals(userId: number): Promise<DailyGoals> {
  const c = await db();
  const result = await c.execute({
    sql: "SELECT * FROM user_goals WHERE user_id = ?",
    args: [userId],
  });
  const row = result.rows[0];
  if (!row) return { ...DEFAULT_GOALS };
  return {
    calories: row.calories as number,
    protein: row.protein as number,
    carbs: row.carbs as number,
    fat: row.fat as number,
  };
}

export async function updateGoals(
  userId: number,
  goals: Partial<DailyGoals>
): Promise<DailyGoals> {
  const c = await db();
  const current = await getGoals(userId);
  const updated = { ...current, ...goals };
  await c.execute({
    sql: `INSERT INTO user_goals (user_id, calories, protein, carbs, fat)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            calories = excluded.calories,
            protein = excluded.protein,
            carbs = excluded.carbs,
            fat = excluded.fat`,
    args: [userId, updated.calories, updated.protein, updated.carbs, updated.fat],
  });
  return updated;
}

// --- Helpers ---

function parseEntryRow(row: Record<string, unknown>): FoodEntry {
  return {
    id: Number(row.id),
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
