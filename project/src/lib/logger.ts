/**
 * AdCraft: Logger — ponytail: structured console wrapper, no JSON roundtrip.
 */

type Level = 'error' | 'warn' | 'info' | 'debug';
const isDev = process.env.NODE_ENV === 'development';

function log(level: Level, msg: string, ctx?: Record<string, unknown>) {
  const entry = { timestamp: new Date().toISOString(), level, message: msg, ...(ctx?.key ? { context: ctx } : {}) };
  if (isDev) { const p = `[${entry.timestamp}] ${level.toUpperCase()} ${msg}`; console[level](ctx ? `${p} ${JSON.stringify(ctx)}` : p); }
  else console[level](JSON.stringify(entry));
}

export const logger = {
  error: (m: string, c?: Record<string, unknown>) => log('error', m, c),
  warn: (m: string, c?: Record<string, unknown>) => log('warn', m, c),
  info: (m: string, c?: Record<string, unknown>) => log('info', m, c),
  debug: (m: string, c?: Record<string, unknown>) => isDev && log('debug', m, c),
};
