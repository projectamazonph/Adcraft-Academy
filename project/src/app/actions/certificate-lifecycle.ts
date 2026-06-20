'use server';

/**
 * AdCraft: Certification Lifecycle System (Phase 3)
 *
 * Full certificate lifecycle: issue, verify, revoke, track progress.
 * Builds on existing D1 Certificate Generation.
 *
 * Verification portal at /verify/[hash] — public, no auth required.
 */

import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-guard';
import { logger } from '@/lib/logger';
import { trackEvent } from './events';
import type { ActionResult } from './types';

// Hash generation for public verification URLs
function generateVerificationHash(userId: string): string {
  const raw = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'ADC-' + Math.abs(hash).toString(36).toUpperCase().padStart(8, '0');
}

export interface CertificateView {
  id: string;
  title: string;
  certType: string;
  status: string;
  verificationHash: string;
  issuedAt: string;
  expiresAt: string | null;
  userName: string | null;
  userLevel: number;
  userXP: number;
  modulesCompleted: number;
  totalModules: number;
}

export interface CertProgressInfo {
  modulesCompleted: number;
  totalModules: number;
  allQuizzesPassed: boolean;
  canIssue: boolean;
  existingCert: CertificateView | null;
}

/**
 * Check certificate eligibility and return progress info.
 */
export async function getCertProgress(): Promise<ActionResult<CertProgressInfo>> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated', code: 'UNAUTHENTICATED' };

    const totalModules = 5;
    const completedModules = await db.moduleProgress.count({
      where: { userId, status: 'COMPLETED' },
    });

    // Check if user has passed one quiz per module (at minimum 70%)
    const quizAttempts = await db.quizAttempt.findMany({
      where: {
        userId,
        status: 'GRADED',
        score: { gte: 70 },
      },
      select: { quizId: true },
      distinct: ['quizId'],
    });

    // At least 3 modules should have quiz passes
    const allQuizzesPassed = quizAttempts.length >= 3;

    // Check for existing certificate
    const existingCert = await db.certificate.findFirst({
      where: { userId, status: 'active' },
      orderBy: { issuedAt: 'desc' },
    });

    const canIssue = completedModules >= totalModules && allQuizzesPassed;

    return {
      success: true,
      data: {
        modulesCompleted: completedModules,
        totalModules,
        allQuizzesPassed,
        canIssue,
        existingCert: existingCert ? {
          id: existingCert.id,
          title: existingCert.title,
          certType: existingCert.certType,
          status: existingCert.status,
          verificationHash: existingCert.verificationHash,
          issuedAt: existingCert.issuedAt.toISOString(),
          expiresAt: existingCert.expiresAt?.toISOString() || null,
          userName: null,
          userLevel: 0,
          userXP: 0,
          modulesCompleted: 0,
          totalModules,
        } : null,
      },
    };
  } catch (error) {
    logger.error('getCertProgress failed', { error: String(error) });
    return { success: false, error: 'Failed to check certificate progress', code: 'PROGRESS_ERROR' };
  }
}

/**
 * Issue a new certificate for the current user.
 */
export async function issueCertificate(): Promise<ActionResult<CertificateView>> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated', code: 'UNAUTHENTICATED' };

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, xp: true, level: true },
    });
    if (!user) return { success: false, error: 'User not found', code: 'NOT_FOUND' };

    // Check eligibility
    const totalModules = 5;
    const completedModules = await db.moduleProgress.count({
      where: { userId, status: 'COMPLETED' },
    });

    if (completedModules < totalModules) {
      return {
        success: false,
        error: `Complete all ${totalModules} modules first (${completedModules}/${totalModules} done)`,
        code: 'INCOMPLETE',
      };
    }

    // Check for existing active cert
    const existing = await db.certificate.findFirst({
      where: { userId, status: 'active' },
    });
    if (existing) {
      return {
        success: false,
        error: 'You already have an active certificate',
        code: 'ALREADY_ISSUED',
        data: await getCertViewFromDb(existing.id, userId),
      };
    }

    // Create certificate
    const hash = generateVerificationHash(userId);
    const cert = await db.certificate.create({
      data: {
        userId,
        certType: 'completion',
        title: 'AdCraft PPC Command Center',
        status: 'active',
        verificationHash: hash,
        metadata: JSON.stringify({
          completedModules,
          totalModules,
          xpAtIssuance: user.xp,
          levelAtIssuance: user.level,
        }),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });

    await trackEvent('certificate_issued', { certId: cert.id, hash }).catch(() => {});

    return {
      success: true,
      data: await getCertViewFromDb(cert.id, userId),
    };
  } catch (error) {
    logger.error('issueCertificate failed', { error: String(error) });
    return { success: false, error: 'Failed to issue certificate', code: 'ISSUE_ERROR' };
  }
}

/**
 * Verify a certificate by its public verification hash.
 * Public endpoint — no auth required.
 */
export async function verifyCertificate(
  hash: string
): Promise<ActionResult<{
  valid: boolean;
  title: string;
  userName: string;
  issuedAt: string;
  expiresAt: string | null;
  status: string;
  certType: string;
}>> {
  try {
    const cert = await db.certificate.findUnique({
      where: { verificationHash: hash },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!cert) {
      return {
        success: true,
        data: { valid: false, title: '', userName: '', issuedAt: '', expiresAt: null, status: 'not_found', certType: '' },
      };
    }

    const now = new Date();
    const isExpired = cert.expiresAt && cert.expiresAt < now;
    const effectiveStatus = cert.status === 'active' && isExpired ? 'expired' : cert.status;

    return {
      success: true,
      data: {
        valid: effectiveStatus === 'active',
        title: cert.title,
        userName: cert.user.name || cert.user.email?.split('@')[0] || 'Anonymous',
        issuedAt: cert.issuedAt.toISOString(),
        expiresAt: cert.expiresAt?.toISOString() || null,
        status: effectiveStatus,
        certType: cert.certType,
      },
    };
  } catch (error) {
    logger.error('verifyCertificate failed', { error: String(error) });
    return { success: false, error: 'Verification failed', code: 'VERIFY_ERROR' };
  }
}

/**
 * Admin: List all certificates (for admin dashboard).
 */
export async function listAllCertificates(): Promise<
  ActionResult<{
    id: string;
    userName: string;
    title: string;
    status: string;
    issuedAt: string;
    verificationHash: string;
  }[]
>> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated', code: 'UNAUTHENTICATED' };

    const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || user.role !== 'ADMIN') {
      return { success: false, error: 'Admin access required', code: 'FORBIDDEN' };
    }

    const certs = await db.certificate.findMany({
      orderBy: { issuedAt: 'desc' },
      take: 100,
      include: { user: { select: { name: true, email: true } } },
    });

    return {
      success: true,
      data: certs.map((c) => ({
        id: c.id,
        userName: c.user.name || c.user.email?.split('@')[0] || 'Unknown',
        title: c.title,
        status: c.status,
        issuedAt: c.issuedAt.toISOString(),
        verificationHash: c.verificationHash,
      })),
    };
  } catch (error) {
    logger.error('listAllCertificates failed', { error: String(error) });
    return { success: false, error: 'Failed to list certificates', code: 'LIST_ERROR' };
  }
}

/**
 * Admin: Revoke a certificate.
 */
export async function revokeCertificate(
  certId: string,
  reason: string
): Promise<ActionResult<null>> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated', code: 'UNAUTHENTICATED' };

    const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || user.role !== 'ADMIN') {
      return { success: false, error: 'Admin access required', code: 'FORBIDDEN' };
    }

    await db.certificate.update({
      where: { id: certId },
      data: { status: 'revoked', revokedAt: new Date(), revokedReason: reason },
    });

    logger.info('Certificate revoked', { certId, reason, adminId: userId });
    return { success: true, data: null };
  } catch (error) {
    logger.error('revokeCertificate failed', { error: String(error) });
    return { success: false, error: 'Failed to revoke certificate', code: 'REVOKE_ERROR' };
  }
}

// Helpers

async function getCertViewFromDb(certId: string, userId: string): Promise<CertificateView> {
  const [cert, user, completedModules] = await Promise.all([
    db.certificate.findUnique({ where: { id: certId } }),
    db.user.findUnique({ where: { id: userId }, select: { name: true, level: true, xp: true } }),
    db.moduleProgress.count({ where: { userId, status: 'COMPLETED' } }),
  ]);

  return {
    id: cert!.id,
    title: cert!.title,
    certType: cert!.certType,
    status: cert!.status,
    verificationHash: cert!.verificationHash,
    issuedAt: cert!.issuedAt.toISOString(),
    expiresAt: cert!.expiresAt?.toISOString() || null,
    userName: user?.name || null,
    userLevel: user?.level || 0,
    userXP: user?.xp || 0,
    modulesCompleted: completedModules,
    totalModules: 5,
  };
}
