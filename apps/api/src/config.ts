import 'dotenv/config';
import { z } from 'zod';
const envSchema = z.object({
  NODE_ENV:z.enum(['development','production','test']).default('development'),
  PORT:z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN:z.string().min(1).default('http://localhost:3000'),
  MONGODB_URI:z.string().min(1), FIREBASE_PROJECT_ID:z.string().min(1).default('mdsakibmollahportfolio'),
  FIREBASE_SERVICE_ACCOUNT_JSON_B64:z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS:z.string().optional(),
  ADMIN_EMAILS:z.string().min(1), OPENAI_API_KEY:z.string().optional(),
  OPENAI_MODEL:z.string().default('gpt-4.1-mini'),
  RESEND_API_KEY:z.string().optional(), RESEND_FROM_EMAIL:z.string().optional(), OWNER_NOTIFICATION_EMAIL:z.string().email().optional()
});
export const env=envSchema.parse(process.env);
export const admins = new Set(env.ADMIN_EMAILS.toLowerCase().split(',').map(x=>x.trim()).filter(Boolean));
