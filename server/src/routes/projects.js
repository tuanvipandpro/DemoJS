import express from 'express';
import { logger } from '../utils/logger.js';
import { encryptToken, decryptToken, maskToken } from '../utils/tokenEncryption.js';
import { pool } from '../db/init.js';
import { ensureAuthenticated, checkProjectAccess, checkProjectAdmin } from '../middleware/auth.js';

const router = express.Router();

// Áp dụng middleware authentication cho tất cả routes
router.use(ensureAuthenticated);

/**
 * @swagger
 * /api/projects/templates:
 *   get:
 *     summary: Get instruction templates
 *     description: Retrieve available instruction templates for test generation
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter by programming language
 *         example: "javascript"
 *       - in: query
 *         name: framework
 *         schema:
 *           type: string
 *         description: Filter by testing framework
 *         example: "jest"
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *         description: Filter by scope
 *         example: "unit"
 *       - in: query
 *         name: ids
 *         schema:
 *           type: array
 *           items:
 *             type: integer
 *         description: Filter by specific template IDs
 *         example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 templates:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InstructionTemplate'
 *       500:
 *         description: Failed to fetch templates
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/templates', ensureAuthenticated, async (req, res) => {
  try {
    const { language, framework, scope, ids } = req.query;
    
    let query = `
      SELECT 
        id, name, description, language, framework, scope, 
        template_data, is_active, created_at, updated_at
      FROM instruction_templates 
      WHERE is_active = TRUE
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (language) {
      query += ` AND language = $${paramIndex}`;
      params.push(language);
      paramIndex++;
    }
    
    if (framework) {
      query += ` AND framework = $${paramIndex}`;
      params.push(framework);
      paramIndex++;
    }
    
    if (scope) {
      query += ` AND scope = $${paramIndex}`;
      params.push(scope);
      paramIndex++;
    }
    
    // Filter by IDs if provided
    if (ids && Array.isArray(ids) && ids.length > 0) {
      const placeholders = ids.map((_, index) => `$${paramIndex + index}`).join(',');
      query += ` AND id IN (${placeholders})`;
      params.push(...ids);
      paramIndex += ids.length;
    }
    
    query += ` ORDER BY language, framework, name`;
    
    const result = await pool.query(query, params);
    
    const templates = result.rows.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      language: template.language,
      framework: template.framework,
      scope: template.scope,
      templateData: template.template_data,
      isActive: template.is_active,
      createdAt: template.created_at,
      updatedAt: template.updated_at
    }));
    
    res.json({
      success: true,
      templates: templates
    });
  } catch (error) {
    logger.error('Error fetching instruction templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch instruction templates'
    });
  }
});

/**
 * @swagger
 * /api/projects/templates/languages:
 *   get:
 *     summary: Get available languages and frameworks
 *     description: Retrieve list of available programming languages and testing frameworks
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Languages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 languages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       language:
 *                         type: string
 *                         example: "javascript"
 *                       framework:
 *                         type: string
 *                         example: "jest"
 *                       scope:
 *                         type: string
 *                         example: "unit_testing"
 *       500:
 *         description: Failed to fetch languages
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/projects/users/search:
 *   get:
 *     summary: Search users by email
 *     description: Search for users by email address to add as project members
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Email address to search for
 *         example: "user@example.com"
 *     responses:
 *       200:
 *         description: Users found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       username:
 *                         type: string
 *                         example: "john_doe"
 *                       email:
 *                         type: string
 *                         example: "john@example.com"
 *                       displayName:
 *                         type: string
 *                         example: "John Doe"
 *       400:
 *         description: Bad request - email parameter required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/projects/users/search - Tìm user bằng email
router.get('/users/search', ensureAuthenticated, async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Email parameter is required'
      });
    }
    
    const result = await pool.query(`
      SELECT id, username, email, display_name
      FROM users 
      WHERE email ILIKE $1
      ORDER BY email
      LIMIT 10
    `, [`%${email.trim()}%`]);
    
    const users = result.rows.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name
    }));
    
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    logger.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users'
    });
  }
});

// GET /api/projects/templates/languages - Lấy danh sách ngôn ngữ có sẵn
router.get('/templates/languages', ensureAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT language, framework, scope
      FROM instruction_templates 
      WHERE is_active = TRUE
      ORDER BY language, framework, scope
    `);
    
    const languages = result.rows.map(row => ({
      language: row.language,
      framework: row.framework,
      scope: row.scope
    }));
    
    res.json({
      success: true,
      languages: languages
    });
  } catch (error) {
    logger.error('Error fetching available languages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available languages'
    });
  }
});

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get user projects
 *     description: Retrieve all projects accessible by the current user
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *       500:
 *         description: Failed to fetch projects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.repo_url,
        p.git_provider_id,
        gp.name as git_provider_name,
        gp.display_name as git_provider_display_name,
        p.notify_channel,
        p.instruction,
        p.status,
        p.created_at,
        p.updated_at,
        u.username as owner_username,
        u.display_name as owner_display_name
      FROM projects p
      LEFT JOIN git_providers gp ON p.git_provider_id = gp.id
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.is_delete = FALSE 
      AND (p.owner_id = $1 OR EXISTS (
        SELECT 1 FROM project_members pm 
        WHERE pm.project_id = p.id AND pm.user_id = $1
      ))
      ORDER BY p.created_at DESC
    `, [userId]);
    
    const projects = result.rows.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      repository: project.repo_url,
      gitProvider: project.git_provider_name,
      gitProviderDisplayName: project.git_provider_display_name,
      notifyChannel: project.notify_channel,
      instruction: project.instruction,
      status: project.status,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      ownerUsername: project.owner_username,
      ownerDisplayName: project.owner_display_name
    }));
    
    res.json({
      success: true,
      projects: projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
});

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create new project
 *     description: Create a new project with configuration and settings
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My Test Project"
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 example: "A sample project for testing"
 *                 maxLength: 1000
 *               gitProvider:
 *                 type: string
 *                 example: "github"
 *               personalAccessToken:
 *                 type: string
 *                 example: "ghp_xxxxxxxxxxxx"
 *               repository:
 *                 type: string
 *                 example: "https://github.com/user/repo"
 *                 description: "Repository URL (optional)"
 *               notifyChannel:
 *                 type: string
 *                 example: "email"
 *               members:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [2, 3, 4]
 *                 description: "Array of user IDs to add as project members"
 *               instruction:
 *                 oneOf:
 *                   - type: string
 *                     description: Complete instruction JSON data as stringified JSON containing raw template data
 *                     example: '{"customInstructions":"Custom testing guidelines","selectedTemplates":[1,2,3],"testingLanguage":"javascript","testingFramework":"jest","templates":[{"id":1,"name":"Unit Test Template","description":"Template for unit testing","templateData":{"templates":[{"viewpoints":["Function behavior","Edge cases"],"test_patterns":["Arrange-Act-Assert"],"test_cases":["Happy path","Error cases"]}]},"viewpoints":["Function behavior","Edge cases"],"testPatterns":["Arrange-Act-Assert"],"testCases":["Happy path","Error cases"]}],"config":{"customInstructions":"Custom testing guidelines","selectedTemplates":[1,2,3],"testingLanguage":"javascript","testingFramework":"jest"}}'
 *                   - type: object
 *                     description: Complete instruction JSON data as object containing raw template data
 *                     example: {
 *                       "customInstructions": "Custom testing guidelines",
 *                       "selectedTemplates": [1, 2, 3],
 *                       "testingLanguage": "javascript",
 *                       "testingFramework": "jest",
 *                       "templates": [
 *                         {
 *                           "id": 1,
 *                           "name": "Unit Test Template",
 *                           "description": "Template for unit testing",
 *                           "templateData": {
 *                             "templates": [
 *                               {
 *                                 "viewpoints": ["Function behavior", "Edge cases"],
 *                                 "test_patterns": ["Arrange-Act-Assert"],
 *                                 "test_cases": ["Happy path", "Error cases"]
 *                               }
 *                             ]
 *                           },
 *                           "viewpoints": ["Function behavior", "Edge cases"],
 *                           "testPatterns": ["Arrange-Act-Assert"],
 *                           "testCases": ["Happy path", "Error cases"]
 *                         }
 *                       ],
 *                       "config": {
 *                         "customInstructions": "Custom testing guidelines",
 *                         "selectedTemplates": [1, 2, 3],
 *                         "testingLanguage": "javascript",
 *                         "testingFramework": "jest"
 *                       }
 *                     }
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Project created successfully"
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to create project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const {
      name,
      description,
      gitProvider,
      personalAccessToken,
      repository,
      notifyChannel,
      instruction,
      members // Array of user IDs to add as members
    } = req.body;
    
    const ownerId = req.user.id;
    
    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required'
      });
    }
    
    if (name.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Project name must be less than 255 characters'
      });
    }
    
    if (description && description.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Description must be less than 1000 characters'
      });
    }
    
    // Get git provider ID if gitProvider name is provided
    let gitProviderId = null;
    let domain = 'localhost'; // Default domain if no repository
    
    if (gitProvider) {
      const providerResult = await pool.query(
        'SELECT id, domain FROM git_providers WHERE name = $1 AND is_active = true',
        [gitProvider]
      );
      
      if (providerResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid git provider'
        });
      }
      
      gitProviderId = providerResult.rows[0].id;
      domain = providerResult.rows[0].domain;
    }
    
    // Extract domain from repository URL if not provided by git provider
    if (!domain && repository) {
      try {
        const url = new URL(repository);
        domain = url.hostname;
      } catch (error) {
        // If URL parsing fails, use repository as domain
        domain = repository;
      }
    }

    // Prepare instruction JSON (complete instruction data)
    let instructionData = {};
    
    if (instruction) {
      // If instruction is already a string, parse it; if it's an object, use it directly
      if (typeof instruction === 'string') {
        try {
          instructionData = JSON.parse(instruction);
        } catch (error) {
          console.error('Error parsing instruction JSON:', error);
          instructionData = {};
        }
      } else if (typeof instruction === 'object') {
        instructionData = instruction;
      }
    }

    // Insert project
    const result = await pool.query(`
      INSERT INTO projects (
        owner_id, name, description, repo_url, git_provider_id, domain,
        personal_access_token, notify_channel, config_json, instruction
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      ownerId,
      name.trim(),
      description ? description.trim() : null,
      repository || null,
      gitProviderId,
      domain,
      personalAccessToken ? encryptToken(personalAccessToken) : null,
      notifyChannel || 'email',
      JSON.stringify({}), // Empty config for now
      JSON.stringify(instructionData)
    ]);
    
    const newProject = result.rows[0];
    
    // Add owner as project member with 'owner' role
    await pool.query(`
      INSERT INTO project_members (project_id, user_id, role, added_by)
      VALUES ($1, $2, 'owner', $2)
    `, [newProject.id, ownerId]);
    
    // Add additional members if provided
    if (members && Array.isArray(members) && members.length > 0) {
      for (const memberId of members) {
        // Validate that user exists
        const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [memberId]);
        if (userResult.rows.length > 0) {
          // Add member with 'member' role
          await pool.query(`
            INSERT INTO project_members (project_id, user_id, role, added_by)
            VALUES ($1, $2, 'member', $3)
            ON CONFLICT (project_id, user_id) DO NOTHING
          `, [newProject.id, memberId, ownerId]);
        }
      }
    }
    
    // Format response
    const formattedProject = {
      id: newProject.id,
      name: newProject.name,
      description: newProject.description,
      repository: newProject.repo_url,
      domain: newProject.domain,
      gitProvider: gitProvider,
      gitProviderId: newProject.git_provider_id,
      personalAccessToken: newProject.personal_access_token,
      notifyChannel: newProject.notify_channel,
      configJson: newProject.config_json,
      instruction: newProject.instruction,
      status: newProject.status,
      createdAt: newProject.created_at,
      updatedAt: newProject.updated_at,
      ownerId: newProject.owner_id,
      ownerUsername: req.user.username,
      ownerDisplayName: req.user.display_name
    };
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: formattedProject
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     description: Retrieve detailed information about a specific project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       403:
 *         description: Access denied to project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', checkProjectAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        p.id, p.name, p.description, p.repo_url, p.domain,
        p.owner_id, p.personal_access_token, p.notify_channel, p.config_json, 
        p.instruction, p.created_at, p.updated_at, p.is_delete, p.is_disabled, p.status,
        u.username as owner_username, u.display_name as owner_display_name
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = $1 AND p.is_delete = false
    `;
    
    const result = await pool.query(query, [id]);
    
    const project = result.rows[0];
    
    // Format response - trả về personalAccessToken đã mã hóa
    const formattedProject = {
      id: project.id,
      name: project.name,
      description: project.description,
      repository: project.repo_url,
      domain: project.domain,
      ownerId: project.owner_id,
      ownerUsername: project.owner_username,
      ownerDisplayName: project.owner_display_name,
      personalAccessToken: project.personal_access_token ? '***ENCRYPTED***' : null,
      notifyChannel: project.notify_channel,
      configJson: project.config_json,
      instruction: (() => {
        try {
          return project.instruction ? JSON.parse(project.instruction) : {};
        } catch (error) {
          console.error('Error parsing instruction JSON:', error);
          return {};
        }
      })(),
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      isDelete: project.is_delete,
      isDisabled: project.is_disabled,
      status: project.status
    };
    
    res.json({
      success: true,
      project: formattedProject
    });
  } catch (error) {
    logger.error('Error fetching project by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update project
 *     description: Update an existing project with new information
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Project Name"
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 example: "Updated project description"
 *                 maxLength: 1000
 *               gitProvider:
 *                 type: string
 *                 example: "github"
 *               personalAccessToken:
 *                 type: string
 *                 example: "ghp_xxxxxxxxxxxx"
 *               repository:
 *                 type: string
 *                 example: "https://github.com/user/repo"
 *               notifyChannel:
 *                 type: string
 *                 example: "email"
 *               instructionTemplates:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *               customInstructions:
 *                 type: string
 *                 example: "Updated custom testing guidelines"
 *               testingLanguage:
 *                 type: string
 *                 example: "javascript"
 *               testingFramework:
 *                 type: string
 *                 example: "jest"
 *               instruction:
 *                 type: string
 *                 description: "Complete instruction data as JSON string"
 *                 example: '{"customInstructions": "Test guidelines", "selectedTemplates": [1,2], "testingLanguage": "javascript", "testingFramework": "jest"}'
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Bad request - no valid fields to update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied to project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', checkProjectAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Xóa các field không được phép update
    delete updateData.id;
    delete updateData.owner_id;
    delete updateData.created_at;
    delete updateData.is_delete;
    
    // Mã hóa token nếu có update
    if (updateData.personalAccessToken) {
      updateData.personal_access_token = encryptToken(updateData.personalAccessToken);
      delete updateData.personalAccessToken;
    }
    
    // Xử lý notifyChannel
    if (updateData.notifyChannel) {
      updateData.notify_channel = updateData.notifyChannel;
      delete updateData.notifyChannel;
    }
    
    // Xử lý configJson
    if (updateData.configJson) {
      updateData.config_json = JSON.stringify(updateData.configJson);
      delete updateData.configJson;
    }
    
    // Xử lý instructionTemplates
    if (updateData.instructionTemplates) {
      updateData.instruction_templates = JSON.stringify(updateData.instructionTemplates);
      delete updateData.instructionTemplates;
    }
    
    // Xử lý customInstructions
    if (updateData.customInstructions !== undefined) {
      updateData.custom_instructions = updateData.customInstructions;
      delete updateData.customInstructions;
    }
    
    // Xử lý testingLanguage
    if (updateData.testingLanguage !== undefined) {
      updateData.testing_language = updateData.testingLanguage;
      delete updateData.testingLanguage;
    }
    
    // Xử lý testingFramework
    if (updateData.testingFramework !== undefined) {
      updateData.testing_framework = updateData.testingFramework;
      delete updateData.testingFramework;
    }
    
    // Xử lý instruction (JSONB field)
    if (updateData.instruction !== undefined) {
      // Nếu là string, parse thành JSON
      if (typeof updateData.instruction === 'string') {
        try {
          updateData.instruction = JSON.parse(updateData.instruction);
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: 'Invalid instruction JSON format'
          });
        }
      }
      // Nếu đã là object, giữ nguyên
    }
    
    // Xử lý git provider
    if (updateData.gitProvider) {
      // Tìm git_provider_id từ git_providers table
      const providerResult = await pool.query(
        'SELECT id FROM git_providers WHERE name = $1',
        [updateData.gitProvider]
      );
      
      if (providerResult.rows.length > 0) {
        updateData.git_provider_id = providerResult.rows[0].id;
      } else {
        return res.status(400).json({
          success: false,
          error: `Git provider '${updateData.gitProvider}' not found`
        });
      }
      delete updateData.gitProvider;
    }
    
    // Xử lý repository -> repo_url mapping
    if (updateData.repository) {
      updateData.repo_url = updateData.repository;
      delete updateData.repository;
    }
    
    // Tạo dynamic query
    const fields = Object.keys(updateData);
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }
    
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const query = `
      UPDATE projects 
      SET ${setClause}
      WHERE id = $1 AND is_delete = false
      RETURNING *
    `;
    
    const params = [id, ...fields.map(field => updateData[field])];
    const result = await pool.query(query, params);
    
    const updatedProject = result.rows[0];
    
    // Format response - trả về personalAccessToken đã mã hóa
    const formattedProject = {
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject.description,
      repository: updatedProject.repo_url,
      domain: updatedProject.domain,
      ownerId: updatedProject.owner_id,
      personalAccessToken: updatedProject.personal_access_token ? '***ENCRYPTED***' : null,
      notifyChannel: updatedProject.notify_channel,
      configJson: updatedProject.config_json,
      instructionTemplates: (() => {
        try {
          return updatedProject.instruction_templates ? JSON.parse(updatedProject.instruction_templates) : [];
        } catch (error) {
          console.error('Error parsing instruction_templates JSON:', error);
          return [];
        }
      })(),
      customInstructions: updatedProject.custom_instructions,
      testingLanguage: updatedProject.testing_language,
      testingFramework: updatedProject.testing_framework,
      createdAt: updatedProject.created_at,
      updatedAt: updatedProject.updated_at,
      isDelete: updatedProject.is_delete,
      isDisabled: updatedProject.is_disabled,
      status: updatedProject.status
    };

    res.json({
      success: true,
      project: formattedProject
    });
  } catch (error) {
    logger.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete project
 *     description: Soft delete a project (mark as deleted but keep in database)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Project with ID 1 has been deleted successfully"
 *       403:
 *         description: Access denied to project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', checkProjectAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'UPDATE projects SET is_delete = true WHERE id = $1 AND is_delete = false RETURNING id';
    const result = await pool.query(query, [id]);
    
    res.json({
      success: true,
      message: `Project with ID ${id} has been deleted successfully`
    });
  } catch (error) {
    logger.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PATCH /api/projects/:id/disable - Vô hiệu hóa dự án
router.patch('/:id/disable', checkProjectAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { isDisabled } = req.body;
    
    if (typeof isDisabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isDisabled must be a boolean value'
      });
    }
    
    const query = `
      UPDATE projects 
      SET is_disabled = $2 
      WHERE id = $1 AND is_delete = false
      RETURNING *
    `;
    
    const result = await pool.query(query, [id, isDisabled]);
    
    const updatedProject = result.rows[0];
    
    // Format response - trả về personalAccessToken đã mã hóa
    const formattedProject = {
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject.description,
      gitProvider: updatedProject.git_provider,
      repository: updatedProject.repo_url,
      ownerId: updatedProject.owner_id,
      personalAccessToken: updatedProject.personal_access_token ? '***ENCRYPTED***' : null,
      notifyChannel: updatedProject.notify_channel,
      configJson: updatedProject.config_json,
      createdAt: updatedProject.created_at,
      updatedAt: updatedProject.updated_at,
      isDelete: updatedProject.is_delete,
      isDisabled: updatedProject.is_disabled,
      status: updatedProject.status
    };
    
    res.json({
      success: true,
      project: formattedProject
    });
  } catch (error) {
    logger.error('Error updating project disable status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PATCH /api/projects/:id/status - Cập nhật trạng thái dự án
router.patch('/:id/status', checkProjectAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const query = `
      UPDATE projects 
      SET status = $2 
      WHERE id = $1 AND is_delete = false
      RETURNING *
    `;
    
    const result = await pool.query(query, [id, status]);
    
    const updatedProject = result.rows[0];
    
    // Format response - trả về personalAccessToken đã mã hóa
    const formattedProject = {
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject.description,
      gitProvider: updatedProject.git_provider,
      repository: updatedProject.repo_url,
      domain: updatedProject.domain,
      ownerId: updatedProject.owner_id,
      personalAccessToken: updatedProject.personal_access_token ? '***ENCRYPTED***' : null,
      notifyChannel: updatedProject.notify_channel,
      configJson: updatedProject.config_json,
      createdAt: updatedProject.created_at,
      updatedAt: updatedProject.updated_at,
      isDelete: updatedProject.is_delete,
      isDisabled: updatedProject.is_disabled,
      status: updatedProject.status
    };
    
    res.json({
      success: true,
      project: formattedProject
    });
  } catch (error) {
    logger.error('Error updating project status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/projects/{id}/members:
 *   get:
 *     summary: Get project members
 *     description: Retrieve list of all members in a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Project members retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       userId:
 *                         type: integer
 *                         example: 1
 *                       username:
 *                         type: string
 *                         example: "john_doe"
 *                       email:
 *                         type: string
 *                         example: "john@example.com"
 *                       displayName:
 *                         type: string
 *                         example: "John Doe"
 *                       role:
 *                         type: string
 *                         enum: [owner, admin, member]
 *                         example: "member"
 *                       permissions:
 *                         type: object
 *                         example: {"read": true, "write": false}
 *                       addedAt:
 *                         type: string
 *                         format: date-time
 *                       addedByUsername:
 *                         type: string
 *                         example: "admin_user"
 *       403:
 *         description: Access denied to project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/members', checkProjectAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        pm.id, pm.role, pm.permissions, pm.added_at,
        u.id as user_id, u.username, u.email, u.display_name,
        added_by_user.username as added_by_username
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      LEFT JOIN users added_by_user ON pm.added_by = added_by_user.id
      WHERE pm.project_id = $1
      ORDER BY pm.role DESC, pm.added_at ASC
    `;
    
    const result = await pool.query(query, [id]);
    
    const members = result.rows.map(member => ({
      id: member.id,
      userId: member.user_id,
      username: member.username,
      email: member.email,
      displayName: member.display_name,
      role: member.role,
      permissions: member.permissions,
      addedAt: member.added_at,
      addedByUsername: member.added_by_username
    }));
    
    res.json({
      success: true,
      members
    });
  } catch (error) {
    logger.error('Error fetching project members:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/projects/:id/members - Thêm member vào project
router.post('/:id/members', checkProjectAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role = 'member', permissions = {} } = req.body;
    const currentUserId = req.user?.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    // Kiểm tra xem user có tồn tại không
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Kiểm tra xem user đã là member chưa
    const existingMember = await pool.query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (existingMember.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User is already a member of this project'
      });
    }
    
    // Thêm member
    const result = await pool.query(`
      INSERT INTO project_members (project_id, user_id, role, permissions, added_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, userId, role, JSON.stringify(permissions), currentUserId]);
    
    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      member: {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        role: result.rows[0].role,
        permissions: result.rows[0].permissions,
        addedAt: result.rows[0].added_at
      }
    });
  } catch (error) {
    logger.error('Error adding project member:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// DELETE /api/projects/:id/members/:memberId - Xóa member khỏi project
router.delete('/:id/members/:memberId', checkProjectAdmin, async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const currentUserId = req.user?.id;
    
    // Kiểm tra xem member có tồn tại không
    const memberCheck = await pool.query(
      'SELECT * FROM project_members WHERE id = $1 AND project_id = $2',
      [memberId, id]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }
    
    const member = memberCheck.rows[0];
    
    // Không cho phép xóa owner
    if (member.role === 'owner') {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove project owner'
      });
    }
    
    // Xóa member
    await pool.query(
      'DELETE FROM project_members WHERE id = $1',
      [memberId]
    );
    
    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    logger.error('Error removing project member:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/projects/:id/git-status - Kiểm tra trạng thái kết nối Git
router.get('/:id/git-status', checkProjectAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        p.git_provider_id,
        gp.name as git_provider_name,
        p.repo_url,
        p.personal_access_token
      FROM projects p
      LEFT JOIN git_providers gp ON p.git_provider_id = gp.id
      WHERE p.id = $1 AND p.is_delete = false
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    const project = result.rows[0];
    
    const hasGitProvider = !!project.git_provider_name;
    const hasToken = !!project.personal_access_token;
    const hasRepository = !!project.repo_url;
    
    const isConnected = hasGitProvider && hasToken && hasRepository;
    
    res.json({
      success: true,
      gitStatus: {
        isConnected,
        hasGitProvider,
        hasToken,
        hasRepository,
        gitProvider: project.git_provider_name,
        repository: project.repo_url
      }
    });
  } catch (error) {
    logger.error('Error checking git status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/projects/:id/github-token - Lấy GitHub token đã lưu cho project
router.get('/:id/github-token', checkProjectAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT personal_access_token, git_provider, repo_url
      FROM projects 
      WHERE id = $1 AND is_delete = false
    `;
    
    const result = await pool.query(query, [id]);
    
    const project = result.rows[0];
    
    if (!project.personal_access_token) {
      return res.status(404).json({
        success: false,
        error: 'No GitHub token found for this project'
      });
    }
    
    // Giải mã token để trả về
    const decryptedToken = decryptToken(project.personal_access_token);
    
    if (!decryptedToken) {
      return res.status(500).json({
        success: false,
        error: 'Failed to decrypt GitHub token'
      });
    }
    
    res.json({
      success: true,
      token: decryptedToken,
      gitProvider: project.git_provider,
      repository: project.repo_url
    });
    
  } catch (error) {
    logger.error('Error getting GitHub token:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/projects/import-documents:
 *   post:
 *     summary: Import documents for AI context
 *     description: Upload and process documents for AI test generation using local RAG
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: integer
 *                 description: Project ID to associate documents with
 *                 example: 1
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Document files to upload (PDF, TXT, MD, DOCX)
 *     responses:
 *       200:
 *         description: Documents imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Documents imported successfully"
 *                 importedCount:
 *                   type: integer
 *                   example: 3
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to import documents
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/import-documents', ensureAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.body;
    const files = req.files?.documents || [];
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one document file is required'
      });
    }

    // Verify project access
    const projectResult = await pool.query(`
      SELECT id FROM projects 
      WHERE id = $1 AND is_delete = FALSE 
      AND (owner_id = $2 OR EXISTS (
        SELECT 1 FROM project_members pm 
        WHERE pm.project_id = $1 AND pm.user_id = $2 AND pm.role IN ('owner', 'admin')
      ))
    `, [projectId, req.user.id]);

    if (projectResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this project'
      });
    }

    let importedCount = 0;
    const errors = [];

    // Process each file
    for (const file of files) {
      try {
        // Validate file type
        const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.mimetype)) {
          errors.push(`File ${file.originalname}: Unsupported file type`);
          continue;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          errors.push(`File ${file.originalname}: File size exceeds 10MB limit`);
          continue;
        }

        // Extract text from document
        let textContent = '';
        if (file.mimetype === 'application/pdf') {
          // TODO: Implement PDF text extraction
          textContent = `PDF content from ${file.originalname}`;
        } else if (file.mimetype === 'text/plain' || file.mimetype === 'text/markdown') {
          textContent = file.buffer.toString('utf-8');
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // TODO: Implement DOCX text extraction
          textContent = `DOCX content from ${file.originalname}`;
        }

        // Split text into chunks
        const chunks = splitTextIntoChunks(textContent, 1000); // 1000 chars per chunk

        // Process each chunk
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          
          // Get embedding from local RAG (LM Studio)
          const embedding = await getEmbeddingFromLMStudio(chunk);
          
          if (embedding) {
            // Store in pgvector
            await pool.query(`
              INSERT INTO document_embeddings (project_id, filename, chunk_index, content, embedding, created_at)
              VALUES ($1, $2, $3, $4, $5, NOW())
            `, [projectId, file.originalname, i, chunk, JSON.stringify(embedding)]);
          }
        }

        importedCount++;
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        errors.push(`File ${file.originalname}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: 'Documents processed successfully',
      importedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error importing documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import documents'
    });
  }
});

// Helper function to split text into chunks
function splitTextIntoChunks(text, chunkSize) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

// Helper function to get embedding from LM Studio
async function getEmbeddingFromLMStudio(text) {
  try {
    const response = await fetch('http://localhost:1234/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-ada-002' // or whatever model you're using
      })
    });

    if (!response.ok) {
      throw new Error(`LM Studio API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error getting embedding from LM Studio:', error);
    return null;
  }
}

export default router;
