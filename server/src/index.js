import './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { initializeDatabase } from './db/init.js';

import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import ragRouter from './routes/rag.js';
import projectsRouter from './routes/projects.js';
import gitRouter from './routes/git.js';
import runsRouter from './routes/runs.js';
import statsRouter from './routes/stats.js';
import specs from './swagger.js';
import swaggerUi from 'swagger-ui-express';
import { logger } from './utils/logger.js';
import { httpLogger } from './middleware/httpLogger.js';

const app = express();

// CORS configuration - support multiple origins and ports
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174', 
  'http://localhost:5175',
  'http://localhost:3000',
  'http://localhost:3001'
];

// Add custom origin from environment variable if provided
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(helmet());
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // Log blocked origins for debugging
        logger.info(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

app.use(httpLogger);

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/rag', ragRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/git', gitRouter);
app.use('/api/runs', runsRouter);
app.use('/api/stats', statsRouter);

// Swagger Documentation
app.get('/api/docs.json', (_req, res) => res.json(specs));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Root endpoint
app.get('/', (_req, res) => {
  res.json({ 
    ok: true, 
    service: 'InsightTestAI Server',
    version: '0.1.0',
    description: 'AI-powered testing automation system',
    features: [
      'RAG-powered test generation',
      'Vector similarity search',
      'Project management',
      'Git integration',
      'Test execution and coverage'
    ]
  });
});

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';

// Initialize database
initializeDatabase()
  .then(() => {
    app.listen(port, host, () => {
      const displayHost = host === '0.0.0.0' ? 'localhost' : host;
      logger.info(`🚀 InsightTestAI Server started successfully`);
      logger.info(`📍 Server listening on ${displayHost}:${port}`);
      logger.info(`📚 Swagger UI: http://${displayHost}:${port}/api/docs`);
      logger.info(`🔍 API Spec: http://${displayHost}:${port}/api/docs.json`);
      logger.info('📋 Available API endpoints:');
      logger.info('  - /api/health - Health check');
      logger.info('  - /api/auth - Authentication & user management');
      logger.info('  - /api/rag - RAG operations (guidelines, context)');
      logger.info('  - /api/projects - Project management');
      logger.info('  - /api/git - Git integration');
      logger.info('  - /api/runs - Test run management');
      logger.info('  - /api/stats - Statistics and analytics');
      logger.info('');
      logger.info('🎯 System ready for AI-powered testing automation!');
    });
  })
  .catch((error) => {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('🛑 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 Server terminated');
  process.exit(0);
});


