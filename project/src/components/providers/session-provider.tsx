'use client';

/**
 * AdCraft: Session Provider Wrapper
 *
 * Wraps the NextAuth SessionProvider so we can use it in the
 * root layout (which must be a Server Component).
 * All client components can then call useSession() to access auth state.
 */

import { SessionProvider } from 'next-auth/react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
