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
        repository VARCHAR(500),
        branch VARCHAR(100),
        git_provider VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        user_id INTEGER REFERENCES users(id),
        owner_id INTEGER REFERENCES users(id),
        personal_access_token TEXT,
        notifications JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_disabled BOOLEAN DEFAULT FALSE,
        is_delete BOOLEAN DEFAULT FALSE
      )
    `);

    // Create runs table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS runs (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id),
        state VARCHAR(50) DEFAULT 'QUEUED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP,
        finished_at TIMESTAMP,
        result_data JSONB DEFAULT '{}',
        error_message TEXT,
        metadata JSONB DEFAULT '{}'
      )
    `);

    // Create agent_runs table if not exists (for compatibility with existing code)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_runs (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id),
        state VARCHAR(50) DEFAULT 'QUEUED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP,
        finished_at TIMESTAMP,
        result_data JSONB DEFAULT '{}',
        error_message TEXT,
        metadata JSONB DEFAULT '{}',
        is_delete BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create run_logs table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS run_logs (
        id SERIAL PRIMARY KEY,
        run_id INTEGER REFERENCES agent_runs(id) ON DELETE CASCADE,
        level VARCHAR(20) DEFAULT 'INFO',
        message TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}'
      )
    `);

    // Create queue_messages table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS queue_messages (
        id SERIAL PRIMARY KEY,
        queue_name VARCHAR(100) NOT NULL,
        message_data JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP,
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3
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

      // Add missing columns to existing tables if they don't exist
      await addMissingColumns();

      // Insert sample data if tables are empty
      await insertSampleData();
  } catch (error) {
    logger.error('Error initializing database:', error);
    throw error;
  }
}

// Function to add missing columns to existing tables
async function addMissingColumns() {
  try {
    // Check and add missing columns to projects table
    const columnsToAdd = [
      { name: 'repository', type: 'VARCHAR(500)' },
      { name: 'branch', type: 'VARCHAR(100)' },
      { name: 'git_provider', type: 'VARCHAR(50)' },
      { name: 'owner_id', type: 'INTEGER REFERENCES users(id)' },
      { name: 'personal_access_token', type: 'TEXT' },
      { name: 'notifications', type: 'JSONB DEFAULT \'{}\'' },
      { name: 'is_disabled', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'is_delete', type: 'BOOLEAN DEFAULT FALSE' }
    ];

    for (const column of columnsToAdd) {
      try {
        await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}`);
        logger.info(`Added column ${column.name} to projects table`);
      } catch (error) {
        // Column might already exist, continue
        logger.debug(`Column ${column.name} might already exist: ${error.message}`);
      }
    }

    // Check and add missing columns to agent_runs table
    const agentRunsColumnsToAdd = [
      { name: 'is_delete', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'updated_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ];

    for (const column of agentRunsColumnsToAdd) {
      try {
        await pool.query(`ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}`);
        logger.info(`Added column ${column.name} to agent_runs table`);
      } catch (error) {
        // Column might already exist, continue
        logger.debug(`Column ${column.name} might already exist: ${error.message}`);
      }
    }

    logger.info('Missing columns check completed');
  } catch (error) {
    logger.error('Error adding missing columns:', error);
    // Don't throw error for column addition
  }
}

// Function to insert sample data
async function insertSampleData() {
  try {
    // Check if we already have data
    const projectsCount = await pool.query('SELECT COUNT(*) FROM projects');
    if (parseInt(projectsCount.rows[0].count) > 0) {
      logger.info('Sample data already exists, skipping...');
      return;
    }

    // Insert sample user
    const userResult = await pool.query(`
      INSERT INTO users (username, email, password_hash, display_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, ['demo', 'demo@example.com', '$2a$10$dummy.hash.for.demo', 'Demo User']);

    const userId = userResult.rows[0].id;

    // Insert sample projects
    const projectResult = await pool.query(`
      INSERT INTO projects (name, description, repository_url, repository, branch, git_provider, user_id, owner_id, notifications)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, ['Sample Project', 'A sample project for testing', 'https://github.com/example/sample', 'example/sample', 'main', 'github', userId, userId, JSON.stringify({ email: true, github_issues: true })]);

    const projectId = projectResult.rows[0].id;

    // Insert sample runs
    const sampleRuns = [
      { state: 'SUCCESS', hours_ago: 1 },
      { state: 'SUCCESS', hours_ago: 3 },
      { state: 'FAILED', hours_ago: 6 },
      { state: 'SUCCESS', hours_ago: 12 },
      { state: 'SUCCESS', hours_ago: 24 },
      { state: 'SUCCESS', hours_ago: 48 },
      { state: 'FAILED', hours_ago: 72 },
      { state: 'SUCCESS', hours_ago: 96 },
      { state: 'SUCCESS', hours_ago: 120 },
      { state: 'SUCCESS', hours_ago: 144 },
      { state: 'SUCCESS', hours_ago: 168 }
    ];

    for (const run of sampleRuns) {
      const created_at = new Date(Date.now() - run.hours_ago * 60 * 60 * 1000);
      const finished_at = new Date(created_at.getTime() + Math.random() * 30 * 60 * 1000); // 0-30 minutes later
      
      // Insert into both runs and agent_runs tables for compatibility
      await pool.query(`
        INSERT INTO runs (project_id, state, created_at, finished_at, result_data)
        VALUES ($1, $2, $3, $4, $5)
      `, [projectId, run.state, created_at, finished_at, JSON.stringify({ test_count: Math.floor(Math.random() * 100) + 10 })]);

      await pool.query(`
        INSERT INTO agent_runs (project_id, state, created_at, finished_at, result_data)
        VALUES ($1, $2, $3, $4, $5)
      `, [projectId, run.state, created_at, finished_at, JSON.stringify({ test_count: Math.floor(Math.random() * 100) + 10 })]);
    }

    logger.info('Sample data inserted successfully');
  } catch (error) {
    logger.error('Error inserting sample data:', error);
    // Don't throw error for sample data insertion
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
