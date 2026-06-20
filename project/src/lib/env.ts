/**
 * AdCraft: Environment Configuration
 *
 * Validates required environment variables on application startup.
 * If any required variable is missing or invalid, the app will fail fast
 * with a clear error message rather than failing silently at runtime.
 *
 * Call validateEnv() once at app startup (in instrumentation.ts).
 *
 * In production:
 *   - Missing required variables cause a hard error (app won't start)
 *   - Placeholder/weak secrets cause a hard error (app won't start)
 * In development:
 *   - Missing/invalid variables produce warnings but don't block startup
 */

interface EnvConfig {
  key: string;
  required: boolean;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

// Known placeholder patterns that should never appear in production
const PLACEHOLDER_PATTERNS = [
  'change-in-production',
  'adcraft-mvp-dev-secret',
  'do-not-use-in-production',
  'replace-me',
  'your-secret-here',
  'xxx',
];

const ENV_SCHEMA: EnvConfig[] = [
  {
    key: 'DATABASE_URL',
    required: true,
    validator: (v) => v.startsWith('file:') || v.startsWith('postgresql://') || v.startsWith('postgres://'),
    errorMessage: 'DATABASE_URL must be a valid SQLite (file:) or PostgreSQL connection string',
  },
  {
    key: 'NEXTAUTH_SECRET',
    required: true,
    validator: (v) => v.length >= 32,
    errorMessage: 'NEXTAUTH_SECRET must be at least 32 characters. Generate with: openssl rand -base64 32',
  },
  {
    key: 'NEXTAUTH_URL',
    required: true,
    validator: (v) => {
      try {
        new URL(v);
        return true;
      } catch {
        return false;
      }
    },
    errorMessage: 'NEXTAUTH_URL must be a valid URL (e.g., http://localhost:3000 or https://adcraft.app)',
  },
];

let validated = false;
let validationError: string | null = null;

/**
 * Validate environment variables.
 * Call once at app startup. Returns true if all validations pass.
 * In development, warnings are logged but don't block startup.
 * In production, missing required variables or placeholder secrets cause a hard error.
 */
export function validateEnv(): boolean {
  if (validated) return validationError === null;

  const isProd = process.env.NODE_ENV === 'production';
  const errors: string[] = [];

  for (const config of ENV_SCHEMA) {
    const value = process.env[config.key];

    if (!value) {
      if (config.required) {
        errors.push(`Missing required env variable: ${config.key}`);
      }
      continue;
    }

    if (config.validator && !config.validator(value)) {
      errors.push(config.errorMessage || `Invalid value for ${config.key}`);
    }
  }

  // Check for placeholder/weak NEXTAUTH_SECRET
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret) {
    const hasPlaceholder = PLACEHOLDER_PATTERNS.some(
      (pattern) => secret.toLowerCase().includes(pattern.toLowerCase())
    );
    if (hasPlaceholder) {
      errors.push(
        'NEXTAUTH_SECRET contains a placeholder value. Generate a real secret with: openssl rand -base64 32'
      );
    }
  }

  // In production, also check that NEXTAUTH_URL uses HTTPS
  if (isProd) {
    const url = process.env.NEXTAUTH_URL;
    if (url && !url.startsWith('https://')) {
      errors.push('NEXTAUTH_URL must use HTTPS in production (e.g., https://adcraft.app)');
    }
  }

  if (errors.length > 0) {
    validationError = errors.join('; ');

    if (isProd) {
      // In production, fail hard — app will not start
      throw new Error(`[AdCraft] Environment validation failed: ${validationError}`);
    } else {
      // In development, warn but don't block
      console.warn(`[AdCraft] Environment validation warnings: ${validationError}`);
    }
  }

  validated = true;
  return validationError === null;
}

/**
 * Get the current NEXTAUTH_URL, defaulting to localhost in development.
 */
export function getNextAuthUrl(): string {
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}
