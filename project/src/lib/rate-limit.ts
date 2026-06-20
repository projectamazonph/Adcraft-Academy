/**
 * AdCraft: Rate Limiter
 *
 * In-memory sliding window rate limiter for API routes.
 * Uses a Map of IP → request timestamps. Each request records its
 * timestamp; on check, expired entries are pruned and the count
 * is compared against the limit.
 *
 * Note: In-memory rate limiting resets on server restart and doesn't
 * work across multiple instances. For production multi-instance deploys,
 * replace with Redis-backed rate limiting (e.g., @upstash/ratelimit).
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < 60_000);
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 5 * 60_000);
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/** Pre-configured rate limiters */
export const RATE_LIMITS = {
  /** Signup: 5 requests per minute per IP */
  signup: { limit: 5, windowMs: 60_000 },
  /** AI Mentor streaming: 20 requests per minute per IP */
  mentorStream: { limit: 20, windowMs: 60_000 },
  /** General API: 60 requests per minute per IP */
  general: { limit: 60, windowMs: 60_000 },
} as const;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a request is allowed under the rate limit.
 * @param key - Identifier (typically IP address)
 * @param config - Rate limit configuration
 * @returns Whether the request is allowed and metadata
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Prune expired timestamps
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  const remaining = Math.max(0, config.limit - entry.timestamps.length);
  const allowed = entry.timestamps.length < config.limit;

  if (allowed) {
    entry.timestamps.push(now);
  }

  // Calculate when the oldest request in the window will expire
  const oldestInWindow = entry.timestamps[0] ?? now;
  const resetAt = oldestInWindow + config.windowMs;

  return { allowed, remaining, resetAt };
}

/**
 * Extract client IP from request headers.
 * Handles X-Forwarded-For and X-Real-IP proxies.
 */
export function getClientIp(request: { headers: Headers }): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs; first is the client
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}
