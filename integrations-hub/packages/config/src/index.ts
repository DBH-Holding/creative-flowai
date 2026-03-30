import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

function env(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) throw new Error(`Missing env var: ${key}`);
  return value;
}

function envInt(key: string, fallback?: number): number {
  const raw = process.env[key];
  if (raw !== undefined) return parseInt(raw, 10);
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing env var: ${key}`);
}

export const config = {
  nodeEnv: env('NODE_ENV', 'development'),
  isDev: env('NODE_ENV', 'development') === 'development',

  api: {
    port: envInt('API_PORT', 3000),
    host: env('API_HOST', '0.0.0.0'),
  },

  database: {
    url: env('DATABASE_URL'),
  },

  redis: {
    url: env('REDIS_URL', 'redis://localhost:6379'),
  },

  auth: {
    jwtSecret: env('JWT_SECRET', 'dev-secret'),
    apiKeySalt: env('API_KEY_SALT', 'dev-salt'),
  },

  creativeflow: {
    apiUrl: env('CREATIVEFLOW_API_URL', ''),
    apiKey: env('CREATIVEFLOW_API_KEY', ''),
  },

  rateLimit: {
    max: envInt('RATE_LIMIT_MAX', 100),
    windowMs: envInt('RATE_LIMIT_WINDOW_MS', 60000),
  },

  logging: {
    level: env('LOG_LEVEL', 'info'),
  },
} as const;
