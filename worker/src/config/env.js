import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = Joi.object({
  // Environment
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  
  // Queue Configuration - Auto-detect based on environment
  QUEUE_TYPE: Joi.string().valid('local', 'sqs', 'redis').default('local'),
  SQS_QUEUE_URL: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  REDIS_URL: Joi.string().when('QUEUE_TYPE', {
    is: 'redis',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  // Database Configuration - Individual parameters
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().integer().min(1).max(65535).default(5432),
  DB_NAME: Joi.string().default('insighttestai'),
  DB_USER: Joi.string().default('insight'),
  DB_PASS: Joi.string().default('insightp'),
  DB_POOL_SIZE: Joi.number().integer().min(1).max(50).default(10),
  DB_SSL: Joi.boolean().default(false),
  DB_SSL_REJECT_UNAUTHORIZED: Joi.boolean().default(true),
  
  // AWS Configuration (required for production)
  AWS_REGION: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  AWS_ACCESS_KEY_ID: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  AWS_SECRET_ACCESS_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  // LLM Configuration - Auto-detect based on environment
  LLM_PROVIDER: Joi.string().valid('gemini', 'bedrock').default('gemini'),
  
  // Gemini Configuration (default for development)
  GEMINI_API_KEY: Joi.string().when('NODE_ENV', {
    is: 'development',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  GEMINI_MODEL: Joi.string().valid('gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp').default('gemini-1.5-flash'),
  GEMINI_API_URL: Joi.string().uri().default('https://generativelanguage.googleapis.com/v1beta'),
  
  // Bedrock Configuration (for production)
  BEDROCK_MODEL_ID: Joi.string().default('anthropic.claude-3.5-sonnet'),
  BEDROCK_REGION: Joi.string().default('us-east-1'),
  
  // MCP Server
  MCP_SERVER_URL: Joi.string().uri().required(),
  
  // Worker Configuration
  MAX_RETRY: Joi.number().integer().min(1).max(10).default(3),
  CONFIDENCE_THRESHOLD: Joi.number().min(0).max(1).default(0.8),
  WORKER_CONCURRENCY: Joi.number().integer().min(1).max(20).default(5),
  
  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  
  // Server
  PORT: Joi.number().integer().min(1).max(65535).default(3002)
});

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env, {
  allowUnknown: true,
  stripUnknown: true
});

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

// Auto-detect configuration based on environment
const isProduction = envVars.NODE_ENV === 'production';
const isDevelopment = envVars.NODE_ENV === 'development';

// Auto-configure queue type for production
const queueType = isProduction ? 'sqs' : (envVars.QUEUE_TYPE || 'local');

// Auto-configure LLM provider for production
const llmProvider = isProduction ? 'bedrock' : (envVars.LLM_PROVIDER || 'gemini');

// Build database connection string
const buildDatabaseUrl = () => {
  const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS, DB_SSL } = envVars;
  
  let connectionString = `postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
  
  if (DB_SSL) {
    connectionString += '?sslmode=require';
  }
  
  return connectionString;
};

// Export validated environment variables
export const config = {
  environment: envVars.NODE_ENV,
  isProduction,
  isDevelopment,
  
  queue: {
    type: queueType,
    sqs: {
      url: envVars.SQS_QUEUE_URL,
      region: envVars.AWS_REGION
    },
    redis: {
      url: envVars.REDIS_URL
    }
  },
  
  database: {
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    name: envVars.DB_NAME,
    user: envVars.DB_USER,
    password: envVars.DB_PASS,
    poolSize: envVars.DB_POOL_SIZE,
    ssl: envVars.DB_SSL,
    sslRejectUnauthorized: envVars.DB_SSL_REJECT_UNAUTHORIZED,
    url: buildDatabaseUrl() // Generated connection string
  },
  
  aws: {
    region: envVars.AWS_REGION,
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY
  },
  
  llm: {
    provider: llmProvider,
    gemini: {
      apiKey: envVars.GEMINI_API_KEY,
      model: envVars.GEMINI_MODEL,
      apiUrl: envVars.GEMINI_API_URL
    },
    bedrock: {
      modelId: envVars.BEDROCK_MODEL_ID,
      region: envVars.BEDROCK_REGION
    }
  },
  
  mcp: {
    serverUrl: envVars.MCP_SERVER_URL
  },
  
  worker: {
    maxRetry: envVars.MAX_RETRY,
    confidenceThreshold: envVars.CONFIDENCE_THRESHOLD,
    concurrency: envVars.WORKER_CONCURRENCY
  },
  
  logging: {
    level: envVars.LOG_LEVEL
  },
  
  server: {
    port: envVars.PORT
  }
};

export default config;
