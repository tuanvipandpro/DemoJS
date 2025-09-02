import { Pool } from 'pg';
import { migrateInstructions } from './migrate.js';
import { seedDatabase } from './seed.js';
import { insertDummyData } from './dummyData.js';

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'insighttestai',
  user: process.env.DB_USER || 'insight',
  password: process.env.DB_PASSWORD || 'insightp',
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize database
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // Run migrations
    await migrateInstructions();
    
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode detected, inserting dummy data...');
      await insertDummyData();
    } else {
      // In production, just run seed
      console.log('Production mode detected, running seed...');
      await seedDatabase();
    }
    
    console.log('Database initialization completed!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Export pool for use in other modules
export { pool };

// RAG Operations
export async function insertRAGDocument(projectId, namespace, content, embedding, metadata = {}) {
  try {
    const result = await pool.query(`
      INSERT INTO rag_documents (project_id, namespace, content, embedding, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, namespace, created_at
    `, [projectId, namespace, content, embedding, metadata]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error inserting RAG document:', error);
    throw error;
  }
}

export async function searchRAGDocuments(projectId, namespace, embedding, limit = 5) {
  try {
    const result = await pool.query(`
      SELECT id, content, metadata, 
              1 - (embedding <=> $3) as similarity
      FROM rag_documents
      WHERE project_id = $1 AND namespace = $2
      ORDER BY embedding <=> $3
      LIMIT $4
    `, [projectId, namespace, embedding, limit]);
    
    return result.rows;
  } catch (error) {
    console.error('Error searching RAG documents:', error);
    throw error;
  }
}

export async function getRAGDocumentsByNamespace(projectId, namespace, limit = 100) {
  try {
    const result = await pool.query(`
      SELECT id, content, metadata, created_at
      FROM rag_documents
      WHERE project_id = $1 AND namespace = $2
      ORDER BY created_at DESC
      LIMIT $3
    `, [projectId, namespace, limit]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting RAG documents:', error);
    throw error;
  }
}

export async function deleteRAGDocument(id) {
  try {
    const result = await pool.query(`
      DELETE FROM rag_documents
      WHERE id = $1
      RETURNING id
    `, [id]);
    
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error deleting RAG document:', error);
    throw error;
  }
}

// Health check
export async function healthCheck() {
  try {
    await pool.query('SELECT 1');
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
}
