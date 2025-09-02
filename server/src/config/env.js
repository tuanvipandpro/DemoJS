import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root directory (../../.env)
const envPath = path.join(__dirname, '../../.env');
console.log('Loading .env from:', envPath);
console.log('File exists:', existsSync(envPath));

const result = dotenv.config({ path: envPath });
console.log('Dotenv result:', result);

export function getEnv(key, defaultValue) {
  return process.env[key] ?? defaultValue;
}


