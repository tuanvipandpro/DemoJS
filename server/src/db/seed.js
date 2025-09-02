import { Pool } from 'pg';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcryptjs';

// Create a separate pool for seeding to avoid circular import
const seedPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'insighttestai',
  user: process.env.DB_USER || 'insight',
  password: process.env.DB_PASSWORD || 'insightp',
});

async function seedDatabase() {
  const client = await seedPool.connect();
  
  try {
    console.log('Starting database seeding...');
    
    // Seed git providers
    await client.query(`
      INSERT INTO git_providers (name, display_name, domain, is_selfhost) 
      VALUES 
        ('github', 'GitHub', 'github.com', FALSE),
        ('gitlab', 'GitLab', 'gitlab.com', FALSE),
        ('bitbucket', 'Bitbucket', 'bitbucket.org', FALSE),
        ('gitea', 'Gitea', 'gitea.com', FALSE),
        ('gogs', 'Gogs', 'gogs.io', FALSE),
        ('selfhost-gitlab', 'Self-hosted GitLab', 'gitlab.company.com', TRUE),
        ('selfhost-gitea', 'Self-hosted Gitea', 'gitea.company.com', TRUE)
      ON CONFLICT (name) DO NOTHING;
    `);
    
    // Seed users
    await client.query(`
      INSERT INTO users (username, email, password_hash, display_name, role) 
      VALUES 
        ('admin', 'admin@example.com', '$2b$10$rQZ9K8L2mN3pQ4sT5uV6w', 'Administrator', 'admin'),
        ('developer', 'dev@example.com', '$2b$10$rQZ9K8L2mN3pQ4sT5uV6w', 'Developer', 'user')
      ON CONFLICT (username) DO NOTHING;
    `);
    
    // Get user IDs
    const adminUser = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
    const devUser = await client.query('SELECT id FROM users WHERE username = $1', ['developer']);
    
    // Get git provider IDs
    const githubProvider = await client.query('SELECT id FROM git_providers WHERE name = $1', ['github']);
    
    // Seed projects
    await client.query(`
      INSERT INTO projects (owner_id, name, description, repo_url, git_provider_id, notify_channel, config_json) 
      VALUES 
        ($1, 'Sample Project', 'A sample project for testing', 'https://github.com/example/sample-project', $2, 'email', '{"templateInstructions": ["unit-testing"], "customInstructions": "Focus on API testing"}'),
        ($1, 'Test Project', 'Another test project', 'https://github.com/example/test-project', $2, 'slack', '{"templateInstructions": ["integration-testing"]}')
      ON CONFLICT DO NOTHING;
    `, [adminUser.rows[0]?.id, githubProvider.rows[0]?.id]);
    
    // Get project ID
    const sampleProject = await client.query('SELECT id FROM projects WHERE name = $1', ['Sample Project']);
    
    // Seed project members
    if (sampleProject.rows[0] && devUser.rows[0]) {
      await client.query(`
        INSERT INTO project_members (project_id, user_id, role, added_by) 
        VALUES ($1, $2, 'member', $3)
        ON CONFLICT DO NOTHING;
      `, [sampleProject.rows[0].id, devUser.rows[0].id, adminUser.rows[0]?.id]);
    }
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

export { seedDatabase };
