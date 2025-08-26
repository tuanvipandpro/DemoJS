import pkg from 'pg';
const { Pool } = pkg;
import { logger } from '../utils/logger.js';

// Tạo kết nối PostgreSQL pool
export const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'insighttestai',
  password: process.env.DB_PASS || 'postgres',
  port: process.env.DB_PORT || 5432,
  max: process.env.PG_POOL_MAX || 20, // maximum number of connections in the pool
  idleTimeoutMillis: process.env.PG_IDLE_TIMEOUT_MS || 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
});

// Event listeners for pool
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Function to initialize database tables
export async function initializeDatabase() {
  try {
    // Enable pgvector extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector');

    // Create users table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255),
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create projects table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        repository_url VARCHAR(500),
        status VARCHAR(50) DEFAULT 'active',
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_disabled BOOLEAN DEFAULT FALSE
      )
    `);

    // Create tokens table if not exists (for refresh tokens)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create refresh_tokens table if not exists (for JWT refresh tokens)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        token VARCHAR(512) NOT NULL UNIQUE,
        user_id INTEGER REFERENCES users(id),
        revoked BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create vector documents table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        namespace VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        embedding vector(1536),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for vector similarity search (only if table is newly created)
    const indexExists = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'documents_embedding_idx'
      )
    `);
    
    if (!indexExists.rows[0].exists) {
      await pool.query(`
        CREATE INDEX documents_embedding_idx 
        ON documents USING ivfflat (embedding vector_cosine_ops) 
        WITH (lists = 100)
      `);
    }

    // Create index for namespace filtering
    const namespaceIndexExists = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'documents_namespace_idx'
      )
    `);
    
    if (!namespaceIndexExists.rows[0].exists) {
      await pool.query(`
        CREATE INDEX documents_namespace_idx 
        ON documents (namespace)
      `);
    }

    logger.info('Database tables initialized successfully');
  } catch (error) {
    logger.error('Error initializing database:', error);
    throw error;
  }
}

// Vector operations
export async function insertDocument({ namespace, content, embedding, metadata = {} }) {
  try {
    const result = await pool.query(
      `INSERT INTO documents (namespace, content, embedding, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING id, namespace, content, metadata, created_at`,
      [namespace, content, JSON.stringify(embedding), metadata]
    );
    return result.rows[0];
  } catch (error) {
    logger.error('Error inserting document:', error);
    throw error;
  }
}

export async function searchDocuments({ namespace, embedding, limit = 5 }) {
  try {
    const result = await pool.query(
      `SELECT id, namespace, content, metadata, 
              (embedding <=> $2::vector) as distance,
              created_at
       FROM documents 
       WHERE namespace = $1
       ORDER BY embedding <=> $2::vector
       LIMIT $3`,
      [namespace, JSON.stringify(embedding), limit]
    );
    return result.rows;
  } catch (error) {
    logger.error('Error searching documents:', error);
    throw error;
  }
}

export async function deleteDocument(id) {
  try {
    const result = await pool.query(
      'DELETE FROM documents WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount > 0;
  } catch (error) {
    logger.error('Error deleting document:', error);
    throw error;
  }
}

export async function getDocumentsByNamespace(namespace, limit = 100) {
  try {
    const result = await pool.query(
      `SELECT id, namespace, content, metadata, created_at
       FROM documents 
       WHERE namespace = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [namespace, limit]
    );
    return result.rows;
  } catch (error) {
    logger.error('Error getting documents:', error);
    throw error;
  }
}
