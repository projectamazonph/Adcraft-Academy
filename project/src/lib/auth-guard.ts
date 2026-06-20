/**
 * AdCraft: Auth Guard Utility
 *
 * Server-side helper to get the current authenticated user from the session.
 * Used by server actions to replace the hardcoded MVP_USER_ID.
 *
 * Usage in server actions:
 *   const userId = await getAuthUserId();
 *   if (!userId) return { success: false, error: 'Not authenticated', code: 'UNAUTHENTICATED' };
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Get the current authenticated user's ID from the session.
 * Returns null if not authenticated.
 */
export async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id ?? null;
}

/**
 * Get the current authenticated user's full session.
 * Returns null if not authenticated.
 */
export async function getAuthSession() {
  return getServerSession(authOptions);
}
