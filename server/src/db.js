import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:TaskManager%40123@db.vhhitfyrljjpvriwdkzr.supabase.co:5432/postgres';

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create basecamp_workspace table to store full synced workspace state
    await client.query(`
      CREATE TABLE IF NOT EXISTS basecamp_workspace (
        id VARCHAR(64) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS basecamp_projects (
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

    // Create trash table
    await client.query(`
      CREATE TABLE IF NOT EXISTS basecamp_trash (
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

    console.log('Supabase PostgreSQL tables verified/created successfully.');
    return true;
  } catch (err) {
    console.error('Database init error:', err.message);
    return false;
  } finally {
    client.release();
  }
}

export async function saveWorkspaceToDatabase(workspace) {
  try {
    await pool.query(
      `
      INSERT INTO basecamp_workspace (id, data, updated_at)
      VALUES ('default', $1, NOW())
      ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data, updated_at = NOW();
    `,
      [workspace]
    );
    return true;
  } catch (err) {
    console.warn('Failed to save to Supabase DB:', err.message);
    return false;
  }
}

export async function loadWorkspaceFromDatabase() {
  try {
    const res = await pool.query(`SELECT data FROM basecamp_workspace WHERE id = 'default' LIMIT 1;`);
    if (res.rows.length > 0 && res.rows[0].data) {
      return res.rows[0].data;
    }
    return null;
  } catch (err) {
    console.warn('Failed to load from Supabase DB:', err.message);
    return null;
  }
}
