import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "memory-palace.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS patient (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      condition TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      photo_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS worlds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memory_id TEXT,
      api_world_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      model TEXT DEFAULT 'Marble 0.1-mini',
      marble_url TEXT,
      caption TEXT,
      splats_urls TEXT,
      mesh_url TEXT,
      panorama_url TEXT,
      thumbnail_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (memory_id) REFERENCES memory(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS memory (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      image_path TEXT,
      world_id INTEGER,
      tags TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      memory_id TEXT NOT NULL,
      world_id INTEGER,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT,
      duration_minutes REAL,
      engagement_score REAL,
      conversation_log TEXT,
      notes TEXT,
      FOREIGN KEY (memory_id) REFERENCES memory(id),
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE SET NULL
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_memory_world_id ON memory(world_id);
    CREATE INDEX IF NOT EXISTS idx_worlds_memory_id ON worlds(memory_id);
    CREATE INDEX IF NOT EXISTS idx_worlds_api_world_id ON worlds(api_world_id);
    CREATE INDEX IF NOT EXISTS idx_session_memory_id ON session(memory_id);
    CREATE INDEX IF NOT EXISTS idx_session_world_id ON session(world_id);
    CREATE INDEX IF NOT EXISTS idx_session_started_at ON session(started_at);

    -- Seed default patient
    INSERT OR IGNORE INTO patient (id, name, age, condition, notes)
    VALUES ('default', 'Patient', 75, 'Early-stage dementia', '');
  `);
}

// --------------- Generic helpers ---------------

export function queryAll<T>(sql: string, params: unknown[] = []): T[] {
  return getDb().prepare(sql).all(...params) as T[];
}

export function queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
  return getDb().prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, params: unknown[] = []) {
  return getDb().prepare(sql).run(...params);
}

// --------------- Memory operations ---------------

export function createMemory(
  id: string,
  title: string,
  imageUrl?: string,
  imagePath?: string,
  description?: string,
  tags?: string,
) {
  run(
    `INSERT INTO memory (id, title, image_url, image_path, description, tags) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, title, imageUrl ?? null, imagePath ?? null, description ?? null, tags ?? null],
  );
}

export function getMemory(memoryId: string) {
  return queryOne(
    `SELECT m.*, w.api_world_id, w.marble_url
     FROM memory m
     LEFT JOIN worlds w ON m.world_id = w.id
     WHERE m.id = ?`,
    [memoryId],
  );
}

export function getAllMemories() {
  return queryAll(
    `SELECT m.*, w.api_world_id, w.marble_url
     FROM memory m
     LEFT JOIN worlds w ON m.world_id = w.id
     ORDER BY m.created_at DESC`,
  );
}

export function updateMemory(memoryId: string, updates: Record<string, unknown>) {
  const allowedFields = ["title", "description", "tags", "image_url", "image_path"];
  const fields = Object.keys(updates).filter((key) => allowedFields.includes(key));
  if (fields.length === 0) return;

  const setClause = fields.map((f) => `${f} = ?`).join(", ");
  const values = fields.map((f) => updates[f]);
  values.push(memoryId);

  run(`UPDATE memory SET ${setClause}, updated_at = datetime('now') WHERE id = ?`, values);
}

export function deleteMemory(memoryId: string) {
  const memory = queryOne<{ world_id: number | null }>(
    `SELECT world_id FROM memory WHERE id = ?`,
    [memoryId],
  );
  if (!memory) return;

  if (memory.world_id) {
    run(`DELETE FROM worlds WHERE id = ?`, [memory.world_id]);
  }
  run(`DELETE FROM memory WHERE id = ?`, [memoryId]);
}

// --------------- World operations ---------------

export function createWorld(apiWorldId: string, name: string, worldData: Record<string, unknown> = {}) {
  const result = run(
    `INSERT INTO worlds (api_world_id, name, model, marble_url, caption, splats_urls, mesh_url, panorama_url, thumbnail_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      apiWorldId,
      name,
      (worldData.model as string) || "Marble 0.1-mini",
      (worldData.marbleUrl as string) ?? null,
      (worldData.caption as string) ?? null,
      worldData.splats ? JSON.stringify(worldData.splats) : null,
      (worldData.meshUrl as string) ?? null,
      (worldData.panoramaUrl as string) ?? null,
      (worldData.thumbnailUrl as string) ?? null,
    ],
  );
  return result.lastInsertRowid;
}

export function getWorld(worldId: number) {
  const world = queryOne<Record<string, unknown>>(`SELECT * FROM worlds WHERE id = ?`, [worldId]);
  if (world?.splats_urls && typeof world.splats_urls === "string") {
    world.splats_urls = JSON.parse(world.splats_urls);
  }
  return world;
}

export function getWorldByApiId(apiWorldId: string) {
  const world = queryOne<Record<string, unknown>>(`SELECT * FROM worlds WHERE api_world_id = ?`, [apiWorldId]);
  if (world?.splats_urls && typeof world.splats_urls === "string") {
    world.splats_urls = JSON.parse(world.splats_urls);
  }
  return world;
}

export function linkMemoryToWorld(memoryId: string, worldId: number) {
  run(`UPDATE memory SET world_id = ?, updated_at = datetime('now') WHERE id = ?`, [worldId, memoryId]);
}

export function linkWorldToMemory(worldId: number, memoryId: string) {
  run(`UPDATE worlds SET memory_id = ?, updated_at = datetime('now') WHERE id = ?`, [memoryId, worldId]);
}

// --------------- Session operations ---------------

export function createSession(id: string, memoryId: string, worldId?: number) {
  run(`INSERT INTO session (id, memory_id, world_id) VALUES (?, ?, ?)`, [
    id,
    memoryId,
    worldId ?? null,
  ]);
}

export function getSession(sessionId: string) {
  const session = queryOne<Record<string, unknown>>(
    `SELECT s.*, w.api_world_id, w.marble_url
     FROM session s
     LEFT JOIN worlds w ON s.world_id = w.id
     WHERE s.id = ?`,
    [sessionId],
  );
  if (session?.conversation_log && typeof session.conversation_log === "string") {
    session.conversation_log = JSON.parse(session.conversation_log);
  }
  return session;
}

export function getSessionsByMemory(memoryId: string) {
  const sessions = queryAll<Record<string, unknown>>(
    `SELECT * FROM session WHERE memory_id = ? ORDER BY started_at DESC`,
    [memoryId],
  );
  return sessions.map((s) => {
    if (s.conversation_log && typeof s.conversation_log === "string") {
      s.conversation_log = JSON.parse(s.conversation_log);
    }
    return s;
  });
}

export function getAllSessions() {
  const sessions = queryAll<Record<string, unknown>>(
    `SELECT s.*, m.title as memory_title
     FROM session s
     LEFT JOIN memory m ON s.memory_id = m.id
     ORDER BY s.started_at DESC`,
  );
  return sessions.map((s) => {
    if (s.conversation_log && typeof s.conversation_log === "string") {
      s.conversation_log = JSON.parse(s.conversation_log);
    }
    return s;
  });
}

export function endSession(sessionId: string) {
  const session = queryOne<{ started_at: string }>(`SELECT started_at FROM session WHERE id = ?`, [sessionId]);
  if (!session) return;

  const durationMs = Date.now() - new Date(session.started_at).getTime();
  const durationMinutes = durationMs / 60000;

  run(`UPDATE session SET ended_at = datetime('now'), duration_minutes = ? WHERE id = ?`, [
    durationMinutes,
    sessionId,
  ]);
}

export function addSessionMessage(sessionId: string, role: string, content: string) {
  const session = queryOne<{ conversation_log: string | null }>(
    `SELECT conversation_log FROM session WHERE id = ?`,
    [sessionId],
  );
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const log = session.conversation_log ? JSON.parse(session.conversation_log) : [];
  log.push({ timestamp: new Date().toISOString(), role, content });

  run(`UPDATE session SET conversation_log = ? WHERE id = ?`, [JSON.stringify(log), sessionId]);
}

export function updateSessionEngagement(sessionId: string, score: number, notes?: string) {
  run(
    `UPDATE session SET engagement_score = ?, notes = COALESCE(?, notes) WHERE id = ?`,
    [score, notes ?? null, sessionId],
  );
}