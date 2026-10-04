import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().default('student_feedback_portal'),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  JWT_SECRET: z.string().min(16).default('local-development-secret-change-me'),
  JWT_EXPIRES_IN: z.string().default('8h'),
});

export const env = envSchema.parse(process.env);

if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'local-development-secret-change-me') {
  throw new Error('JWT_SECRET must be configured with a private value in production');
}