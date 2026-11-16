import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${encodeURIComponent(process.env.PGUSER || 'postgres')}:${encodeURIComponent(
    process.env.PGPASSWORD || ''
  )}@${process.env.PGHOST || '127.0.0.1'}:${process.env.PGPORT || 5432}/${
    process.env.PGDATABASE || 'postgres'
  }`;

export let pool = null;
let isConnected = false;

export function getPool() {
  if (!pool && process.env.PGPASSWORD) {
    try {
      pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 3000,
      });
      pool.on('error', (err) => {
        console.warn('PostgreSQL pool error:', err.message);
        isConnected = false;
      });
    } catch (err) {
      console.warn('Failed to construct PostgreSQL pool:', err.message);
      pool = null;
    }
  }
  return pool;
}

export async function checkDatabaseConnection() {
  const p = getPool();
  if (!p) return false;
  try {
    const client = await p.connect();
    try {
      await client.query('SELECT 1;');
      isConnected = true;
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    isConnected = false;
    return false;
  }
}

export async function initDatabase() {
  const p = getPool();
  if (!p) return false;

  try {
    const client = await p.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS taskmanager_workspace (
          id VARCHAR(64) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS taskmanager_projects (
          id VARCHAR(128) PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          status VARCHAR(64) DEFAULT 'In Progress',
          status_tone VARCHAR(32) DEFAULT 'green',
          cover_image TEXT,
          members JSONB DEFAULT '["alex"]'::jsonb,
          active_ago TEXT DEFAULT 'Active just now',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS taskmanager_trash (
          id VARCHAR(128) PRIMARY KEY,
          type VARCHAR(32) NOT NULL,
          title TEXT NOT NULL,
          project_id VARCHAR(128),
          project_title TEXT,
          list_id VARCHAR(128),
          list_title TEXT,
          original_location TEXT,
          deleted_at TIMESTAMPTZ NOT NULL,
          data JSONB NOT NULL
        );
      `);

      isConnected = true;
      console.log('Local PostgreSQL connected and tables initialized successfully.');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('Local PostgreSQL init notice:', err.message);
    isConnected = false;
    return false;
  }
}

export async function saveWorkspaceToDatabase(workspace) {
  const p = getPool();
  if (!p) return false;
  try {
    await p.query(
      `
      INSERT INTO taskmanager_workspace (id, data, updated_at)
      VALUES ('default', $1, NOW())
      ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data, updated_at = NOW();
    `,
      [workspace]
    );
    isConnected = true;
    return true;
  } catch (err) {
    console.warn('Failed to save to local PostgreSQL:', err.message);
    return false;
  }
}

export async function loadWorkspaceFromDatabase() {
  const p = getPool();
  if (!p) return null;
  try {
    const res = await p.query(
      `SELECT data FROM taskmanager_workspace WHERE id = 'default' LIMIT 1;`
    );
    if (res.rows.length > 0 && res.rows[0].data) {
      return res.rows[0].data;
    }
    return null;
  } catch {
    return null;
  }
}

export function isDatabaseConnected() {
  return isConnected;
}
