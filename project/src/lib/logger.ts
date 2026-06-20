/**
 * AdCraft: Structured Logger
 *
 * Replaces bare console.error/console.warn with structured, JSON-parseable
 * log entries that include timestamp, level, context, and metadata.
 *
 * In production, these structured logs can be ingested by monitoring
 * services (Datadog, Logflare, Vercel Logs, etc.).
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.error('Failed to grade attempt', { action: 'gradeStrTriage', attemptId, error });
 *   logger.warn('Rate limit exceeded', { ip, endpoint: '/api/mentor/stream' });
 *   logger.info('User signed up', { userId, email });
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

const isDev = process.env.NODE_ENV === 'development';

function formatEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && Object.keys(context).length > 0 ? { context } : {}),
  };
}

function output(entry: LogEntry): void {
  const prefix = isDev
    ? `[${entry.timestamp}] ${entry.level.toUpperCase()} `
    : '';

  const text = isDev
    ? `${prefix}${entry.message}${entry.context ? ' ' + JSON.stringify(entry.context) : ''}`
    : JSON.stringify(entry);

  switch (entry.level) {
    case 'error':
      console.error(text);
      break;
    case 'warn':
      console.warn(text);
      break;
    case 'info':
      console.info(text);
      break;
    case 'debug':
      if (isDev) console.debug(text);
      break;
  }
}

export const logger = {
  error(message: string, context?: Record<string, unknown>): void {
    output(formatEntry('error', message, context));
  },

  warn(message: string, context?: Record<string, unknown>): void {
    output(formatEntry('warn', message, context));
  },

  info(message: string, context?: Record<string, unknown>): void {
    output(formatEntry('info', message, context));
  },

  debug(message: string, context?: Record<string, unknown>): void {
    output(formatEntry('debug', message, context));
  },
};
