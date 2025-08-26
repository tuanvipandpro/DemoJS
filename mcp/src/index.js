import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { authMiddleware } from './middleware/auth.js';
import { healthRouter } from './routes/health.js';
import { toolsRouter } from './routes/tools.js';
import { welcomeRouter } from './routes/welcome.js';
import { specs, swaggerUi } from './swagger.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.MCP_PORT || 8081;
const HOST = process.env.MCP_HOST || '0.0.0.0';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for welcome page
app.use('/static', express.static(join(__dirname, '../public')));

// Rate limiting
app.use(rateLimiter);

// Routes
app.use('/health', healthRouter);
app.use('/tools', authMiddleware, toolsRouter);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'InsightTestAI MCP Server API Documentation',
  customfavIcon: '/static/insight-test-ai-icon.svg'
}));
app.use('/', welcomeRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  
  logger.info('🚀 MCP Server đang chạy', {
    host: displayHost,
    port: PORT,
    url: `http://${displayHost}:${PORT}`
  });
  
  logger.info('📊 Health check endpoint', {
    url: `http://${displayHost}:${PORT}/health`
  });
  
  logger.info('🛠️ Tools endpoint', {
    url: `http://${displayHost}:${PORT}/tools`
  });
  
  logger.info('📚 API Documentation', {
    url: `http://${displayHost}:${PORT}/docs`
  });
  
  logger.info('🏠 Welcome page', {
    url: `http://${displayHost}:${PORT}/`
  });
  
  logger.info('✅ Server khởi động thành công', {
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    uptime: process.uptime()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;
