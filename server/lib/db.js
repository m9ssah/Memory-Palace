const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'memory_palace.db');

/**
 * Initialize or get the database connection
 */
function initializeDatabase() {
  const db = new Database(DB_PATH);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create tables
  createTables(db);

  return db;
}

/**
 * Create all required tables
 */
function createTables(db) {
  // Worlds table - stores world generation data from World Labs API
  db.exec(`
    CREATE TABLE IF NOT EXISTS worlds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memory_id INTEGER,
      api_world_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      model TEXT DEFAULT 'Marble 0.1-mini',
      marble_url TEXT,
      caption TEXT,
      splats_urls TEXT,
      mesh_url TEXT,
      panorama_url TEXT,
      thumbnail_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE SET NULL
    )
  `);

  // Memories table - user's memory records with images and worlds
  db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      image_url TEXT,
      image_path TEXT,
      world_id INTEGER,
      description TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE SET NULL,
      UNIQUE(user_id, title)
    )
  `);

  // Sessions table - conversation sessions within worlds
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      world_id INTEGER NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      conversation_log TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for faster queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
    CREATE INDEX IF NOT EXISTS idx_memories_world_id ON memories(world_id);
    CREATE INDEX IF NOT EXISTS idx_worlds_memory_id ON worlds(memory_id);
    CREATE INDEX IF NOT EXISTS idx_worlds_api_world_id ON worlds(api_world_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_world_id ON sessions(world_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
  `);
}

/**
 * Create a new memory
 */
function createMemory(db, userId, title, imageUrl = null, imagePath = null, description = null, tags = null) {
  const stmt = db.prepare(`
    INSERT INTO memories (user_id, title, image_url, image_path, description, tags)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(userId, title, imageUrl, imagePath, description, tags);
  return result.lastInsertRowid;
}

/**
 * Create a new world record
 */
function createWorld(db, apiWorldId, name, worldData = {}) {
  const stmt = db.prepare(`
    INSERT INTO worlds (
      api_world_id, name, model, marble_url, caption,
      splats_urls, mesh_url, panorama_url, thumbnail_url
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    apiWorldId,
    name,
    worldData.model || 'Marble 0.1-mini',
    worldData.marbleUrl || null,
    worldData.caption || null,
    worldData.splats ? JSON.stringify(worldData.splats) : null,
    worldData.mesh || null,
    worldData.panorama || null,
    worldData.thumbnail || null
  );

  return result.lastInsertRowid;
}

/**
 * Link a memory to a world
 */
function linkMemoryToWorld(db, memoryId, worldId) {
  const stmt = db.prepare(`
    UPDATE memories
    SET world_id = ?
    WHERE id = ?
  `);
  
  stmt.run(worldId, memoryId);
}

/**
 * Link a world to a memory
 */
function linkWorldToMemory(db, worldId, memoryId) {
  const stmt = db.prepare(`
    UPDATE worlds
    SET memory_id = ?
    WHERE id = ?
  `);
  
  stmt.run(memoryId, worldId);
}

/**
 * Get a memory by ID
 */
function getMemory(db, memoryId) {
  const stmt = db.prepare(`
    SELECT * FROM memories
    WHERE id = ?
  `);
  
  return stmt.get(memoryId);
}

/**
 * Get all memories for a user
 */
function getUserMemories(db, userId) {
  const stmt = db.prepare(`
    SELECT m.*, w.api_world_id, w.marble_url
    FROM memories m
    LEFT JOIN worlds w ON m.world_id = w.id
    WHERE m.user_id = ?
    ORDER BY m.created_at DESC
  `);
  
  return stmt.all(userId);
}

/**
 * Get a world by ID
 */
function getWorld(db, worldId) {
  const stmt = db.prepare(`
    SELECT * FROM worlds
    WHERE id = ?
  `);
  
  const world = stmt.get(worldId);
  if (world && world.splats_urls) {
    world.splats_urls = JSON.parse(world.splats_urls);
  }
  return world;
}

/**
 * Get a world by API world ID
 */
function getWorldByApiId(db, apiWorldId) {
  const stmt = db.prepare(`
    SELECT * FROM worlds
    WHERE api_world_id = ?
  `);
  
  const world = stmt.get(apiWorldId);
  if (world && world.splats_urls) {
    world.splats_urls = JSON.parse(world.splats_urls);
  }
  return world;
}

/**
 * Create a new session
 */
function createSession(db, userId, worldId) {
  const stmt = db.prepare(`
    INSERT INTO sessions (user_id, world_id)
    VALUES (?, ?)
  `);
  
  const result = stmt.run(userId, worldId);
  return result.lastInsertRowid;
}

/**
 * Add message to session conversation log
 */
function addSessionMessage(db, sessionId, role, content, timestamp = null) {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const conversationLog = session.conversation_log ? JSON.parse(session.conversation_log) : [];
  
  conversationLog.push({
    timestamp: timestamp || new Date().toISOString(),
    role,
    content,
  });

  const stmt = db.prepare(`
    UPDATE sessions
    SET conversation_log = ?
    WHERE id = ?
  `);
  
  stmt.run(JSON.stringify(conversationLog), sessionId);
}

/**
 * Get session with full details
 */
function getSession(db, sessionId) {
  const stmt = db.prepare(`
    SELECT s.*, w.api_world_id, w.marble_url
    FROM sessions s
    LEFT JOIN worlds w ON s.world_id = w.id
    WHERE s.id = ?
  `);
  
  const session = stmt.get(sessionId);
  if (session && session.conversation_log) {
    session.conversation_log = JSON.parse(session.conversation_log);
  }
  if (session && session.metadata) {
    session.metadata = JSON.parse(session.metadata);
  }
  return session;
}

/**
 * Get all sessions for a user
 */
function getUserSessions(db, userId) {
  const stmt = db.prepare(`
    SELECT s.*, w.api_world_id, w.name as world_name
    FROM sessions s
    LEFT JOIN worlds w ON s.world_id = w.id
    WHERE s.user_id = ?
    ORDER BY s.started_at DESC
  `);
  
  const sessions = stmt.all(userId);
  return sessions.map(session => {
    if (session.conversation_log) {
      session.conversation_log = JSON.parse(session.conversation_log);
    }
    if (session.metadata) {
      session.metadata = JSON.parse(session.metadata);
    }
    return session;
  });
}

/**
 * End a session
 */
function endSession(db, sessionId) {
  const stmt = db.prepare(`
    UPDATE sessions
    SET ended_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(sessionId);
}

/**
 * Get session history for a world
 */
function getWorldSessions(db, worldId) {
  const stmt = db.prepare(`
    SELECT s.*
    FROM sessions s
    WHERE s.world_id = ?
    ORDER BY s.started_at DESC
  `);
  
  const sessions = stmt.all(worldId);
  return sessions.map(session => {
    if (session.conversation_log) {
      session.conversation_log = JSON.parse(session.conversation_log);
    }
    if (session.metadata) {
      session.metadata = JSON.parse(session.metadata);
    }
    return session;
  });
}

/**
 * Update memory
 */
function updateMemory(db, memoryId, updates) {
  const allowedFields = ['title', 'description', 'tags', 'image_url', 'image_path'];
  const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
  
  if (fields.length === 0) return;

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const values = fields.map(field => updates[field]);
  values.push(memoryId);

  const stmt = db.prepare(`
    UPDATE memories
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(...values);
}

/**
 * Delete memory and its associated world
 */
function deleteMemory(db, memoryId) {
  const memory = getMemory(db, memoryId);
  if (!memory) return;

  if (memory.world_id) {
    db.prepare('DELETE FROM worlds WHERE id = ?').run(memory.world_id);
  }

  db.prepare('DELETE FROM memories WHERE id = ?').run(memoryId);
}

module.exports = {
  initializeDatabase,
  createMemory,
  createWorld,
  linkMemoryToWorld,
  linkWorldToMemory,
  getMemory,
  getUserMemories,
  getWorld,
  getWorldByApiId,
  createSession,
  addSessionMessage,
  getSession,
  getUserSessions,
  endSession,
  getWorldSessions,
  updateMemory,
  deleteMemory,
};
