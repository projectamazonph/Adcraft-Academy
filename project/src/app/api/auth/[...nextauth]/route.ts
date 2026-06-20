/**
 * AdCraft: NextAuth API Route Handler
 *
 * Catches all /api/auth/* requests and delegates to NextAuth.
 * This is the required setup for NextAuth v4 with App Router.
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
