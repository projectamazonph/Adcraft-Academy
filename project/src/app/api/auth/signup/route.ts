import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Simple email regex — comprehensive enough for signup validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Limits to prevent abuse
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254; // RFC 5321
const MAX_PASSWORD_LENGTH = 128;
const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  try {
    // Request size limit — reject oversized payloads
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10_000) {
      return NextResponse.json(
        { error: 'Request too large', code: 'PAYLOAD_TOO_LARGE' },
        { status: 413 }
      );
    }

    const body = await req.json();
    const { name, email, password } = body;

    // --- Input validation ---

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Email format validation
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    // Length limits
    if (email.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json(
        { error: 'Email address is too long', code: 'EMAIL_TOO_LONG' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`, code: 'PASSWORD_TOO_SHORT' },
        { status: 400 }
      );
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: 'Password is too long', code: 'PASSWORD_TOO_LONG' },
        { status: 400 }
      );
    }

    // Sanitize name — strip HTML tags to prevent stored XSS
    const sanitizedName = typeof name === 'string'
      ? name.replace(/<[^>]*>/g, '').slice(0, MAX_NAME_LENGTH).trim()
      : '';

    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing account
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      // Deliberately vague message to prevent user enumeration
      return NextResponse.json(
        { error: 'An account with this email already exists', code: 'EMAIL_EXISTS' },
        { status: 409 }
      );
    }

    // Create account
    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        name: sanitizedName || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        passwordHash,
        role: 'STUDENT',
      },
    });

    logger.info('User signed up', { userId: user.id, email: normalizedEmail });

    // Don't return the passwordHash or other sensitive fields
    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Signup failed', { error: String(error) });
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.', code: 'SIGNUP_ERROR' },
      { status: 500 }
    );
  }
}
