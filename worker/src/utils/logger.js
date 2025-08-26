import winston from 'winston';
import config from '../config/env.js';

/**
 * Winston logger configuration
 */
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'insighttestai-worker' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add file transport in production
if (config.server.env === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/worker-error.log',
    level: 'error'
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/worker-combined.log'
  }));
}

export { logger };
