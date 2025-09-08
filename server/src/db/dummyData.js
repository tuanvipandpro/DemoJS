import { Pool } from 'pg';

// Create a separate pool for dummy data to avoid circular import
const dummyPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'insighttestai',
  user: process.env.DB_USER || 'insight',
  password: process.env.DB_PASSWORD || 'insightp',
});

// Insert dummy data for development
async function insertDummyData() {
  const client = await dummyPool.connect();
  
  try {
    console.log('Inserting dummy data for development...');
    
    // Truncate all tables first
    await client.query('TRUNCATE TABLE project_members, projects, users, git_providers RESTART IDENTITY CASCADE');
    
    // Insert git providers
    await client.query(`
      INSERT INTO git_providers (name, display_name, domain, is_selfhost, is_active) 
      VALUES 
        ('github', 'GitHub', 'github.com', FALSE, TRUE),
        ('gitlab-selfhost', 'GitLab Self-hosted', 'gitlab.company.com', TRUE, TRUE)
      RETURNING id;
    `);
    
    // Get git provider IDs
    const githubProvider = await client.query('SELECT id FROM git_providers WHERE name = $1', ['github']);
    const gitlabSelfhostProvider = await client.query('SELECT id FROM git_providers WHERE name = $1', ['gitlab-selfhost']);
    
    // Insert users
    await client.query(`
      INSERT INTO users (username, email, password_hash, display_name, phone, address) 
      VALUES 
        ('admin', 'admin@company.com', '$2a$10$H01iZg.B2YUlHqGdT9ixqOhM5pv7RkBVGrVkpFFL7bWrmuRPMBicS', 'Administrator', '+1234567890', 'Admin Address'),
        ('developer1', 'developer1@company.com', '$2a$10$Nh3.yMlkUMVBzPp3R0xNF.Xy2Mlp7.vk8EeRc.dVsV2zclBoQr5N6', 'Developer One', '+1234567891', 'Dev1 Address'),
        ('developer2', 'developer2@company.com', '$2a$10$1QT9Td6qwJdttcF6k4lwweSv.G2VxG/CcA8u6zNGCwlZYKpAn30YK', 'Developer Two', '+1234567892', 'Dev2 Address'),
        ('tester1', 'tester1@company.com', '$2a$10$QQHssmkoOup1x/kVwaXi/.Isz1DN//y091YqP0xnSJjk5L8YbeDpS', 'Tester One', '+1234567893', 'Tester1 Address')
      RETURNING id;
    `);
    
    // Get user IDs
    const adminUser = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
    const dev1User = await client.query('SELECT id FROM users WHERE username = $1', ['developer1']);
    const dev2User = await client.query('SELECT id FROM users WHERE username = $1', ['developer2']);
    const testerUser = await client.query('SELECT id FROM users WHERE username = $1', ['tester1']);
    
    // Insert projects
    await client.query(`
      INSERT INTO projects (id, owner_id, name, description, repo_url, git_provider_id, domain, personal_access_token, notify_channel, config_json, is_delete, is_disabled, status, created_at, updated_at, instruction_templates, custom_instructions, testing_language, testing_framework, instruction) 
      VALUES 
        (4, 1, 'Test', null, 'https://github.com/tuanvipandpro/DemoJS', 1, 'github.com', 'fG1PkFkPWvGTKTzAJM6T2mjZ0/AagXLvGpNSyzL77bLvolTSejKAV+ujvSvpr2gqKdn8J4uNGhLLAAMsyaw8yw==', 'email', '{}', false, false, 'active', '2025-09-05 17:50:49.983653', '2025-09-05 17:50:49.983653', '[]', null, null, null, '{"config": {"testingLanguage": "javascript", "testingFramework": "jest", "selectedTemplates": [1], "customInstructions": null}, "templates": [{"id": 1, "name": "JavaScript Unit Testing", "testCases": [], "viewpoints": ["Input validation testing", "Output validation testing", "Edge case testing", "Error handling testing", "Boundary value testing"], "description": "Mẫu instruction test view point cho JavaScript Unit Testing với Jest framework", "templateData": {"scope": "Unit Testing", "language": "JavaScript", "templates": [{"id": "js-ut-function-testing", "name": "Function Testing", "examples": ["Test function với null/undefined input", "Test function với empty string/array", "Test function với negative numbers", "Test function với very large numbers", "Test function với special characters"], "viewpoints": ["Input validation testing", "Output validation testing", "Edge case testing", "Error handling testing", "Boundary value testing"], "description": "Test các function đơn lẻ với các input/output khác nhau", "test_patterns": ["Arrange-Act-Assert (AAA)", "Given-When-Then", "Setup-Execute-Verify"], "coverage_focus": ["Statement coverage", "Branch coverage", "Function coverage"]}], "description": "Mẫu instruction test view point cho JavaScript Unit Testing sử dụng Jest framework", "testing_framework": "Jest"}, "testPatterns": ["Arrange-Act-Assert (AAA)", "Given-When-Then", "Setup-Execute-Verify"]}], "testingLanguage": "javascript", "testingFramework": "jest", "selectedTemplates": [1], "customInstructions": null}')
      RETURNING id;
    `);
    
    // Get project IDs
    const testProject = await client.query('SELECT id FROM projects WHERE name = $1', ['Test']);
    
    // Insert project members
    if (testProject.rows[0] && dev1User.rows[0] && dev2User.rows[0] && testerUser.rows[0]) {
      await client.query(`
        INSERT INTO project_members (project_id, user_id, role, added_by) 
        VALUES 
          ($1, $2, 'member', $3),
          ($1, $4, 'member', $3),
          ($1, $5, 'member', $3)
      `, [
        testProject.rows[0].id, 
        dev1User.rows[0].id, 
        adminUser.rows[0]?.id,
        dev2User.rows[0].id,
        testerUser.rows[0].id
      ]);
    }
    
    console.log('Dummy data inserted successfully!');
    console.log('');
    console.log('=== AVAILABLE USERS ===');
    console.log('- admin/admin@company.com (password: admin)');
    console.log('- developer1/developer1@company.com (password: developer1)');
    console.log('- developer2/developer2@company.com (password: developer2)');
    console.log('- tester1/tester1@company.com (password: tester1)');
    console.log('');
    console.log('=== AVAILABLE GIT PROVIDERS ===');
    console.log('- GitHub - Cloud provider');
    console.log('- GitLab Self-hosted - Self-hosted provider');
    console.log('');
    console.log('=== SAMPLE PROJECTS ===');
    console.log('- Frontend Web App (GitHub) - owned by admin');
    console.log('- Backend API Service (GitLab Self-hosted) - owned by admin');
    console.log('- Mobile App (GitHub) - owned by developer1');
    console.log('');
    console.log('=== PROJECT MEMBERS ===');
    console.log('- Frontend Web App: admin (owner), dev1, dev2, tester1 (members)');
    console.log('- Backend API Service: admin (owner), dev1 (member)');
    console.log('- Mobile App: dev1 (owner), dev2, tester1 (members)');
    
  } catch (error) {
    console.error('Error inserting dummy data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  insertDummyData()
    .then(() => {
      console.log('Dummy data insertion completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Dummy data insertion failed:', error);
      process.exit(1);
    });
}

export { insertDummyData };
