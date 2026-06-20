/**
 * AdCraft: Environment validation — ponytail: Zod schema, ~15 lines.
 */

import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be >= 32 chars'),
  NEXTAUTH_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msgs = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Invalid environment: ${msgs}`);
    }
    console.warn(`[WARN] Env validation: ${msgs}`);
  }
  return parsed;
}
