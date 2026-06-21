'use server';

/**
 * AdCraft: Team Dashboard & Manager Actions (Phase 3)
 *
 * Organization management, member invitations, team progress tracking.
 */

import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-guard';
import { logger } from '@/lib/logger';
import { trackEvent } from './events';
import type { ActionResult } from './types';

export interface TeamMemberView {
  userId: string;
  name: string | null;
  email: string;
  role: string;
  joinedAt: string;
  modulesCompleted: number;
  totalModules: number;
  xp: number;
  level: number;
  streakDays: number;
  lastActive: string;
  quizAvgScore: number;
  certStatus: string | null;
}

export interface TeamDashboardData {
  orgId: string;
  orgName: string;
  memberCount: number;
  members: TeamMemberView[];
  orgAvgXP: number;
  orgAvgCompletion: number;
}

/**
 * Create a new organization.
 */
export async function createOrganization(
  name: string
): Promise<ActionResult<{ orgId: string; slug: string }>> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated', code: 'UNAUTHENTICATED' };

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const org = await db.organization.create({
      data: { name, slug },
    });

    // Add creator as OWNER
    await db.teamMember.create({
      data: { orgId: org.id, userId, role: 'OWNER' },
    });

    // Update user's orgId
    await db.user.update({ where: { id: userId }, data: { orgId: org.id } });

    await trackEvent('org_created', { orgId: org.id, orgName: name }).catch(() => {});

    return { success: true, data: { orgId: org.id, slug } };
  } catch (error) {
    logger.error('createOrganization failed', { error: String(error) });
    return { success: false, error: 'Failed to create organization', code: 'ORG_ERROR' };
  }
}

/**
 * Invite a user to the organization by email.
 */
export async function inviteMember(
  email: string
): Promise<ActionResult<null>> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated', code: 'UNAUTHENTICATED' };

    // Find user's org membership
    const membership = await db.teamMember.findFirst({
      where: { userId, role: { in: ['OWNER', 'MANAGER'] } },
      include: { org: true },
    });
    if (!membership) return { success: false, error: 'No organization or not a manager', code: 'FORBIDDEN' };

    // Find target user by email
    const targetUser = await db.user.findUnique({ where: { email } });
    if (!targetUser) return { success: false, error: 'User not found', code: 'USER_NOT_FOUND' };

    // Check if already a member
    const existing = await db.teamMember.findUnique({
      where: { orgId_userId: { orgId: membership.orgId, userId: targetUser.id } },
    });
    if (existing) return { success: false, error: 'Already a member', code: 'ALREADY_MEMBER' };

    await db.teamMember.create({
      data: { orgId: membership.orgId, userId: targetUser.id, role: 'MEMBER' },
    });

    // Update user orgId
    await db.user.update({ where: { id: targetUser.id }, data: { orgId: membership.orgId } });

    return { success: true, data: null };
  } catch (error) {
    logger.error('inviteMember failed', { error: String(error) });
    return { success: false, error: 'Failed to invite member', code: 'INVITE_ERROR' };
  }
}

/**
 * Get team dashboard data for the current user's organization.
 */
export async function getTeamDashboard(): Promise<ActionResult<TeamDashboardData>> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated', code: 'UNAUTHENTICATED' };

    const membership = await db.teamMember.findFirst({
      where: { userId },
      include: { org: true },
    });
    if (!membership) return { success: false, error: 'Not part of an organization', code: 'NO_ORG' };

    const allMembers = await db.teamMember.findMany({
      where: { orgId: membership.orgId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            xp: true,
            level: true,
            streakDays: true,
            lastActiveAt: true,
          },
        },
      },
    });

    // Build member views with progress data
    const memberViews: TeamMemberView[] = await Promise.all(
      allMembers.map(async (m) => {
        const [completedModules, quizAttempts, cert] = await Promise.all([
          db.moduleProgress.count({ where: { userId: m.user.id, status: 'COMPLETED' } }),
          db.quizAttempt.findMany({
            where: { userId: m.user.id, status: 'GRADED' },
            select: { score: true },
          }),
          db.certificate.findFirst({
            where: { userId: m.user.id, status: 'active' },
            select: { status: true },
          }),
        ]);

        const avgScore =
          quizAttempts.length > 0
            ? Math.round(quizAttempts.reduce((s, a) => s + a.score, 0) / quizAttempts.length)
            : 0;

        return {
          userId: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
          joinedAt: m.joinedAt.toISOString(),
          modulesCompleted: completedModules,
          totalModules: 5,
          xp: m.user.xp,
          level: m.user.level,
          streakDays: m.user.streakDays,
          lastActive: m.user.lastActiveAt.toISOString(),
          quizAvgScore: avgScore,
          certStatus: cert?.status || null,
        };
      })
    );

    const totalXp = memberViews.reduce((s, m) => s + m.xp, 0);
    const totalCompletion = memberViews.reduce((s, m) => s + m.modulesCompleted, 0);

    return {
      success: true,
      data: {
        orgId: membership.orgId,
        orgName: membership.org.name,
        memberCount: memberViews.length,
        members: memberViews,
        orgAvgXP: memberViews.length > 0 ? Math.round(totalXp / memberViews.length) : 0,
        orgAvgCompletion: memberViews.length > 0 ? Math.round((totalCompletion / (memberViews.length * 5)) * 100) : 0,
      },
    };
  } catch (error) {
    logger.error('getTeamDashboard failed', { error: String(error) });
    return { success: false, error: 'Failed to load team data', code: 'TEAM_ERROR' };
  }
}

/**
 * Get or create organization for single-user -> team transition.
 */
export async function getMyOrganization(): Promise<
  ActionResult<{ org: { id: string; name: string; slug: string } | null }>
> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated', code: 'UNAUTHENTICATED' };

    const membership = await db.teamMember.findFirst({
      where: { userId },
      include: { org: true },
    });

    return {
      success: true,
      data: {
        org: membership
          ? { id: membership.org.id, name: membership.org.name, slug: membership.org.slug }
          : null,
      },
    };
  } catch (error) {
    logger.error('getMyOrganization failed', { error: String(error) });
    return { success: false, error: 'Failed', code: 'ERROR' };
  }
}
