import dotenv from 'dotenv';

// Load .env from current working directory (server/.env)
dotenv.config({ path: process.env.ENV_PATH || '.env' });

export function getEnv(key, defaultValue) {
  return process.env[key] ?? defaultValue;
}


