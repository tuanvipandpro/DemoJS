import '../config/env.js';
import pkg from 'pg';

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    // Enable pgvector extension and create table
    await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgjwt;`).catch(() => {});
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        namespace TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding VECTOR(1536) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS documents_namespace_idx ON documents (namespace);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents USING ivfflat (embedding vector_l2_ops);
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Add email column if missing and ensure uniqueness when not null
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;`);
    await client.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (email) WHERE email IS NOT NULL;`
    );
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_provider_tokens (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        access_token TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, provider)
      );
    `);

    // Add updated_at column if it doesn't exist (for existing installations)
    await client.query(`
      ALTER TABLE user_provider_tokens 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        token TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        revoked BOOLEAN NOT NULL DEFAULT false
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'Planning',
        progress INTEGER DEFAULT 0,
        start_date TIMESTAMPTZ,
        end_date TIMESTAMPTZ,
        team TEXT,
        priority TEXT DEFAULT 'Medium',
        budget TEXT,
        coverage INTEGER DEFAULT 0,
        last_run TEXT DEFAULT 'Not run',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        git_provider TEXT,
        repository TEXT,
        branch TEXT,
        notifications TEXT DEFAULT '[]',
        personal_access_token TEXT
      );
    `);

    // Add indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects(created_at);
    `);
  } finally {
    client.release();
  }
}

export async function insertDocument({ namespace, content, embedding }) {
  const embeddingStr = Array.isArray(embedding) ? `[${embedding.join(',')}]` : String(embedding);
  const result = await pool.query(
    `INSERT INTO documents (namespace, content, embedding) VALUES ($1, $2, $3::vector) RETURNING id`,
    [namespace, content, embeddingStr]
  );
  return result.rows[0];
}

export async function searchDocuments({ namespace, embedding, limit = 5 }) {
  const embeddingStr = Array.isArray(embedding) ? `[${embedding.join(',')}]` : String(embedding);
  const result = await pool.query(
    `SELECT id, namespace, content, 1 - (embedding <#> $1::vector) AS similarity
     FROM documents
     WHERE namespace = $2
     ORDER BY embedding <-> $1::vector
     LIMIT $3`,
    [embeddingStr, namespace, limit]
  );
  return result.rows;
}


