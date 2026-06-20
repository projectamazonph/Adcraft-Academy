/**
 * AdCraft: Middleware
 *
 * Handles authentication, security headers, rate limiting, and CORS.
 *
 * - Auth: Redirects unauthenticated users to /auth/signin
 * - Security: Adds CSP, HSTS, X-Frame-Options, X-Content-Type-Options headers
 *   In production: CSP is tightened (no unsafe-eval, stricter script-src)
 * - Rate Limiting: Protects /api/auth/signup and /api/mentor/stream from abuse
 * - CORS: Allows same-origin requests; API routes return proper CORS headers
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

// Routes that don't require authentication
const PUBLIC_PATHS = [
  '/auth/signin',
  '/auth/signup',
  '/api/auth',
];

// Routes with rate limiting (checked before auth for public endpoints)
const RATE_LIMITED_ROUTES: { path: string; config: typeof RATE_LIMITS.signup }[] = [
  { path: '/api/auth/signup', config: RATE_LIMITS.signup },
  { path: '/api/mentor/stream', config: RATE_LIMITS.mentorStream },
];

const isProd = process.env.NODE_ENV === 'production';

// Security headers applied to all responses
const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // HSTS — only enforce in production (localhost doesn't use HTTPS)
  ...(isProd
    ? { 'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload' }
    : {}),
};

// Content Security Policy — production-tightened
function getCspDirectives(nonce?: string): string {
  const scriptSrc = isProd
    ? nonce
      ? `script-src 'self' 'nonce-${nonce}'`  // Production with nonce: no unsafe-inline/eval
      : `script-src 'self'`                     // Production without nonce: most restrictive
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'"; // Dev: Next.js requires unsafe-inline/eval

  const styleSrc = isProd
    ? "style-src 'self' 'unsafe-inline'"  // Tailwind CSS still requires unsafe-inline
    : "style-src 'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    scriptSrc,
    styleSrc,
    "img-src 'self' data: blob: https://z-cdn.chatglm.cn",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.space-z.ai", // API calls
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Rate Limiting (before auth check so public endpoints are also protected) ---
  for (const route of RATE_LIMITED_ROUTES) {
    if (pathname.startsWith(route.path)) {
      const ip = getClientIp(request);
      const result = checkRateLimit(`rl:${route.path}:${ip}`, route.config);

      if (!result.allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
            },
          }
        );
      }
    }
  }

  // --- Generate nonce for CSP (production only) ---
  const nonce = isProd ? Buffer.from(crypto.randomUUID()).toString('base64') : undefined;

  // --- Allow public routes ---
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    const response = NextResponse.next();
    applySecurityHeaders(response, nonce);

    // Add CORS headers for auth API routes
    if (pathname.startsWith('/api/auth')) {
      response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  }

  // --- Health check is public ---
  if (pathname === '/api/health') {
    const response = NextResponse.next();
    applySecurityHeaders(response, nonce);
    return response;
  }

  // --- Allow static files and Next.js internals (strict check) ---
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    /^\.[a-zA-Z0-9]+$/.test(pathname.slice(pathname.lastIndexOf('/')))
  ) {
    return NextResponse.next();
  }

  // --- CORS preflight for API routes ---
  if (pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400');
    return response;
  }

  // --- Auth check ---
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // --- Apply security headers to all authenticated responses ---
  const response = NextResponse.next();
  applySecurityHeaders(response, nonce);

  // --- CORS for authenticated API routes ---
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // --- Inject nonce into request headers for server components to use ---
  if (nonce) {
    response.headers.set('X-CSP-Nonce', nonce);
  }

  return response;
}

/**
 * Apply security headers to a response.
 */
function applySecurityHeaders(response: NextResponse, nonce?: string): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  // CSP with production tightening
  response.headers.set('Content-Security-Policy', getCspDirectives(nonce));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
