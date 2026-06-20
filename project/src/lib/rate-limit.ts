/**
 * AdCraft: Rate Limiter — ponytail: in-memory sliding window, auto-cleanup.
 */

const store = new Map<string, number[]>();

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  signup: { limit: 5, windowMs: 60_000 },
  mentorStream: { limit: 20, windowMs: 60_000 },
  general: { limit: 60, windowMs: 60_000 },
} as const;

export function checkRateLimit(key: string, config: RateLimitConfig) {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  let timestamps = store.get(key) || [];
  timestamps = timestamps.filter((t) => t > windowStart);
  const allowed = timestamps.length < config.limit;
  if (allowed) timestamps.push(now);
  store.set(key, timestamps);
  return { allowed, remaining: Math.max(0, config.limit - timestamps.length), resetAt: (timestamps[0] || now) + config.windowMs };
}

export function getClientIp(request: { headers: Headers }): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}
