import './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { initializeDatabase } from './db/init.js';
import { QueueFactory } from './services/queue/QueueFactory.js';

import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import vectorsRouter from './routes/vectors.js';
import projectsRouter from './routes/projects.js';
import gitRouter from './routes/git.js';
import workerRouter from './routes/worker.js';
import runsRouter from './routes/runs.js';
import queueRouter from './routes/queue.js';
import statsRouter from './routes/stats.js';
import { openApiSpec } from './swagger.js';
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

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/vectors', vectorsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/git', gitRouter);
app.use('/api/worker', workerRouter);
app.use('/api/runs', runsRouter);
app.use('/api/queue', queueRouter);
app.use('/api/stats', statsRouter);
app.get('/api/docs.json', (_req, res) => res.json(openApiSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'InsightTestAI Server' });
});

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';

// Initialize database and queue service
Promise.all([
  initializeDatabase(),
  QueueFactory.createDefaultQueueService().connect()
])
  .then(() => {
    app.listen(port, host, () => {
      const displayHost = host === '0.0.0.0' ? 'localhost' : host;
      logger.info(`Server listening on ${displayHost}:${port}`);
      logger.info(`Swagger UI: http://${displayHost}:${port}/api/docs`);
      logger.info('Available API endpoints:');
      logger.info('  - /api/health - Health check');
      logger.info('  - /api/auth - Authentication');
      logger.info('  - /api/vectors - Vector operations');
      logger.info('  - /api/projects - Project management');
      logger.info('  - /api/git - Git integration');
      logger.info('  - /api/worker - Worker integration');
      logger.info('  - /api/runs - Agent runs management');
      logger.info('  - /api/queue - Queue management');
      logger.info('  - /api/stats - Statistics and analytics');
      logger.info('Redis queue initialized successfully');
    });
  })
  .catch((error) => {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});


