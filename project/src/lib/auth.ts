/**
 * AdCraft: NextAuth Configuration
 *
 * Credentials-based authentication for the MVP.
 * Uses email + password with bcrypt hashing.
 * Session strategy: JWT (stateless, no server session storage needed).
 *
 * Production hardening:
 *   - Secure cookies enabled in production
 *   - SameSite=Lax for session cookie (Strict breaks OAuth redirects)
 *   - Cookie prefix __Host- in production for extra security
 *
 * Post-MVP: Add GitHub/Google OAuth providers here.
 */

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db } from '@/lib/db';

const isProd = process.env.NODE_ENV === 'production';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'you@example.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) {
          // Deliberately vague message to prevent user enumeration
          throw new Error('Invalid email or password');
        }

        if (!user.passwordHash) {
          throw new Error('Invalid email or password');
        }

        const isValid = await compare(credentials.password, user.passwordHash);

        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        // Update lastActiveAt on successful login
        await db.user.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user }) {
      // On sign in, add user data to the JWT token
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },

    async session({ session, token }) {
      // Forward JWT data to the client session
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',

  // Production cookie hardening
  useSecureCookies: isProd,
  cookies: isProd
    ? {
        sessionToken: {
          name: `__Host-next-auth.session-token`,
          options: {
            httpOnly: true,
            sameSite: 'lax',    // Lax (not Strict) — Strict breaks redirect-based auth flows
            path: '/',
            secure: true,
          },
        },
        callbackUrl: {
          name: `__Host-next-auth.callback-url`,
          options: {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: true,
          },
        },
        csrfToken: {
          name: `__Host-next-auth.csrf-token`,
          options: {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: true,
          },
        },
      }
    : undefined,

  // Trust the proxy header for correct URL detection behind reverse proxies
  // (e.g., preview deployments, load balancers)
};

/**
 * Helper: Hash a plaintext password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const { hash } = await import('bcryptjs');
  return hash(password, 12);
}
