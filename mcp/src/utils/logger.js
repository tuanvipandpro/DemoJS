import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const logFormat = process.env.LOG_FORMAT || 'pretty';

// Custom format cho development - hiển thị đẹp và dễ đọc
const prettyFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Format meta data một cách đẹp mắt
    if (Object.keys(meta).length > 0) {
      const formattedMeta = Object.entries(meta)
        .map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return `${key}=${JSON.stringify(value, null, 2)}`;
          }
          return `${key}=${value}`;
        })
        .join(' | ');
      
      log += ` | ${formattedMeta}`;
    }
    
    return log;
  })
);

// JSON format cho production
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Simple format cho console
const simpleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      const simpleMeta = Object.entries(meta)
        .map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return `${key}=${JSON.stringify(value)}`;
          }
          return `${key}=${value}`;
        })
        .join(', ');
      
      log += ` (${simpleMeta})`;
    }
    
    return log;
  })
);

// Chọn format dựa trên environment
let format;
if (logFormat === 'json') {
  format = jsonFormat;
} else if (logFormat === 'pretty') {
  format = prettyFormat;
} else {
  format = simpleFormat;
}

export const logger = winston.createLogger({
  level: logLevel,
  format,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'logs/mcp-server.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: jsonFormat // File log luôn dùng JSON format
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Tạo thư mục logs nếu chưa có
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logsDir = join(__dirname, '../../logs');

if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}
