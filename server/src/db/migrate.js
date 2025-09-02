import { pool } from './init.js';
import { logger } from '../utils/logger.js';

export async function migrateInstructions() {
  try {
    logger.info('Starting instruction templates migration...');
    
    // Thêm cột mới cho instruction templates
    await pool.query(`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS instruction_templates JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS custom_instructions TEXT,
      ADD COLUMN IF NOT EXISTS testing_language VARCHAR(50),
      ADD COLUMN IF NOT EXISTS testing_framework VARCHAR(50),
      ADD COLUMN IF NOT EXISTS instruction JSONB DEFAULT '{}'
    `);
    
    // Cập nhật repo_url để cho phép NULL
    await pool.query(`
      ALTER TABLE projects 
      ALTER COLUMN repo_url DROP NOT NULL
    `);
    
    // Tạo bảng runs nếu chưa tồn tại
    await pool.query(`
      CREATE TABLE IF NOT EXISTS runs (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        state VARCHAR(50) DEFAULT 'queued',
        commit_id VARCHAR(100),
        branch VARCHAR(100),
        diff_summary TEXT,
        test_plan TEXT,
        proposals_json JSONB DEFAULT '[]',
        test_results JSONB DEFAULT '{}',
        coverage_json JSONB DEFAULT '{}',
        confidence_score DECIMAL(3,2),
        error_message TEXT,
        decision VARCHAR(50),
        decision_data JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        finished_at TIMESTAMP
      )
    `);
    
    // Tạo bảng run_logs nếu chưa tồn tại
    await pool.query(`
      CREATE TABLE IF NOT EXISTS run_logs (
        id SERIAL PRIMARY KEY,
        run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        message TEXT NOT NULL,
        level VARCHAR(20) DEFAULT 'info',
        metadata JSONB DEFAULT '{}'
      )
    `);
    
    // Tạo bảng mới cho instruction templates
    await pool.query(`
      CREATE TABLE IF NOT EXISTS instruction_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        language VARCHAR(50) NOT NULL,
        framework VARCHAR(50) NOT NULL,
        scope VARCHAR(50) NOT NULL,
        template_data JSONB NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tạo index cho instruction templates
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_instruction_templates_language ON instruction_templates(language);
      CREATE INDEX IF NOT EXISTS idx_instruction_templates_framework ON instruction_templates(framework);
      CREATE INDEX IF NOT EXISTS idx_instruction_templates_scope ON instruction_templates(scope);
    `);
    
    // Insert default instruction templates
    await insertDefaultTemplates();
    
    logger.info('Instruction templates migration completed successfully');
  } catch (error) {
    logger.error('Error during instruction templates migration:', error);
    throw error;
  }
}

async function insertDefaultTemplates() {
  try {
    // Kiểm tra xem đã có templates chưa
    const existingTemplates = await pool.query('SELECT COUNT(*) FROM instruction_templates');
    if (existingTemplates.rows[0].count > 0) {
      logger.info('Default templates already exist, skipping insertion');
      return;
    }
    
    // JavaScript Jest templates
    await pool.query(`
      INSERT INTO instruction_templates (name, description, language, framework, scope, template_data)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      'JavaScript Unit Testing',
      'Mẫu instruction test view point cho JavaScript Unit Testing với Jest framework',
      'javascript',
      'jest',
      'unit_testing',
      JSON.stringify({
        "language": "JavaScript",
        "testing_framework": "Jest",
        "scope": "Unit Testing",
        "description": "Mẫu instruction test view point cho JavaScript Unit Testing sử dụng Jest framework",
        "templates": [
          {
            "id": "js-ut-function-testing",
            "name": "Function Testing",
            "description": "Test các function đơn lẻ với các input/output khác nhau",
            "viewpoints": [
              "Input validation testing",
              "Output validation testing", 
              "Edge case testing",
              "Error handling testing",
              "Boundary value testing"
            ],
            "test_patterns": [
              "Arrange-Act-Assert (AAA)",
              "Given-When-Then",
              "Setup-Execute-Verify"
            ],
            "examples": [
              "Test function với null/undefined input",
              "Test function với empty string/array",
              "Test function với negative numbers",
              "Test function với very large numbers",
              "Test function với special characters"
            ],
            "coverage_focus": [
              "Statement coverage",
              "Branch coverage", 
              "Function coverage"
            ]
          }
        ]
      })
    ]);
    
    // Java JUnit 5 templates
    await pool.query(`
      INSERT INTO instruction_templates (name, description, language, framework, scope, template_data)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      'Java Unit Testing',
      'Mẫu instruction test view point cho Java Unit Testing với JUnit 5 framework',
      'java',
      'junit5',
      'unit_testing',
      JSON.stringify({
        "language": "Java",
        "testing_framework": "JUnit 5",
        "scope": "Unit Testing",
        "description": "Mẫu instruction test view point cho Java Unit Testing sử dụng JUnit 5 framework",
        "templates": [
          {
            "id": "java-ut-method-testing",
            "name": "Method Testing",
            "description": "Test các method đơn lẻ với các input/output khác nhau",
            "viewpoints": [
              "Parameter validation testing",
              "Return value testing",
              "Exception handling testing",
              "Edge case testing",
              "Boundary value testing"
            ],
            "test_patterns": [
              "Arrange-Act-Assert (AAA)",
              "Given-When-Then",
              "Setup-Execute-Verify"
            ],
            "examples": [
              "Test method với null parameters",
              "Test method với empty collections",
              "Test method với negative values",
              "Test method với maximum/minimum values",
              "Test method với invalid input types"
            ],
            "coverage_focus": [
              "Line coverage",
              "Branch coverage",
              "Method coverage"
            ]
          }
        ]
      })
    ]);
    
    // Python pytest templates
    await pool.query(`
      INSERT INTO instruction_templates (name, description, language, framework, scope, template_data)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      'Python Unit Testing',
      'Mẫu instruction test view point cho Python Unit Testing với pytest framework',
      'python',
      'pytest',
      'unit_testing',
      JSON.stringify({
        "language": "Python",
        "testing_framework": "pytest",
        "scope": "Unit Testing",
        "description": "Mẫu instruction test view point cho Python Unit Testing sử dụng pytest framework",
        "templates": [
          {
            "id": "python-ut-function-testing",
            "name": "Function Testing",
            "description": "Test các function đơn lẻ với các input/output khác nhau",
            "viewpoints": [
              "Parameter validation testing",
              "Return value testing",
              "Exception handling testing",
              "Edge case testing",
              "Boundary value testing"
            ],
            "test_patterns": [
              "Arrange-Act-Assert (AAA)",
              "Given-When-Then",
              "Setup-Execute-Verify"
            ],
            "examples": [
              "Test function với None input",
              "Test function với empty strings/lists",
              "Test function với negative numbers",
              "Test function với very large numbers",
              "Test function với special characters",
              "Test function với different data types"
            ],
            "coverage_focus": [
              "Statement coverage",
              "Branch coverage",
              "Function coverage"
            ]
          }
        ]
      })
    ]);
    
    logger.info('Default instruction templates inserted successfully');
  } catch (error) {
    logger.error('Error inserting default templates:', error);
    throw error;
  }
}

// Chạy migration
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateInstructions()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
