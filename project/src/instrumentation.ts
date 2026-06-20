/**
 * AdCraft: Instrumentation
 *
 * Runs once when the Next.js server starts.
 * Validates environment variables before the app begins serving requests.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on the server (not during build)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('@/lib/env');
    validateEnv();

    const { logger } = await import('@/lib/logger');
    logger.info('AdCraft server started', {
      nodeEnv: process.env.NODE_ENV,
      runtime: process.env.NEXT_RUNTIME,
    });
  }
}
