'use server';

/**
 * AdCraft: Badge Server Actions (Post-MVP: Atomic Build A1)
 *
 * Handles badge definitions, awarding, and listing. Badge definitions
 * are seeded from fixtures/badges.json into the database on first access
 * (lazy seed pattern, same as quiz).
 *
 * Badge Awarding Flow:
 * - checkAndAwardBadges() is called after key user actions
 *   (lesson complete, quiz pass, sim graded, mentor chat)
 * - It evaluates ALL badge criteria against the user's current stats
 * - Newly earned badges are created as UserBadge records with bonus XP
 * - Returns the list of newly awarded badges for UI notification
 *
 * IMPORTANT: This file ONLY exports async functions.
 * Types are in ./types.ts to avoid "Invalid Server Actions request" errors
 * in Next.js 16 (which forbids non-function exports from 'use server' files).
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-guard';
import { logger } from '@/lib/logger';
import type {
  ActionResult,
  BadgeView,
  BadgeAwardResult,
} from './types';

// Cache the fixture data in memory after first load
let fixtureCache: any = null;

async function loadFixture() {
  if (fixtureCache) return fixtureCache;
  try {
    const raw = await readFile(join(process.cwd(), 'fixtures/badges.json'), 'utf-8');
    fixtureCache = JSON.parse(raw);
    return fixtureCache;
  } catch (error) {
    logger.error('Failed to load badge fixture', { error: String(error) });
    return null;
  }
}

// ============================================================================
// LAZY SEED: Ensure all badges exist in DB
// ============================================================================

async function ensureBadgesSeeded(): Promise<boolean> {
  const fixture = await loadFixture();
  if (!fixture) return false;

  // Check if we already have badges in the DB
  const existingCount = await db.badge.count();
  if (existingCount >= fixture.badges.length) return true;

  // Seed badges that don't exist yet
  for (const badgeData of fixture.badges) {
    const existing = await db.badge.findUnique({ where: { slug: badgeData.slug } });
    if (!existing) {
      await db.badge.create({
        data: {
          slug: badgeData.slug,
          title: badgeData.title,
          description: badgeData.description,
          icon: badgeData.icon,
          category: badgeData.category as any,
          tier: badgeData.tier as any,
          xpReward: badgeData.xpReward || 0,
          criteria: badgeData.criteria,
          order: badgeData.order,
          isSecret: badgeData.isSecret || false,
          isPublished: true,
        },
      });
    }
  }

  logger.info('Badges seeded', { count: fixture.badges.length });
  return true;
}

// ============================================================================
// SERVER ACTION: Get All Badges (with user's earned status)
// ============================================================================

export async function getBadges(
  userId?: string
): Promise<ActionResult<BadgeView[]>> {
  try {
    const uid = userId || await getAuthUserId();
    if (!uid) {
      return { success: false, error: 'You must be signed in to view badges', code: 'UNAUTHENTICATED' };
    }

    // Ensure badges are seeded
    await ensureBadgesSeeded();

    // Fetch all published badges
    const allBadges = await db.badge.findMany({
      where: { isPublished: true },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });

    // Fetch user's earned badges
    const userBadges = await db.userBadge.findMany({
      where: { userId: uid },
      include: { badge: true },
    });

    const earnedMap = new Map<string, Date>();
    for (const ub of userBadges) {
      earnedMap.set(ub.badgeId, ub.earnedAt);
    }

    // Build response — hide secret badges unless earned
    const result: BadgeView[] = [];
    for (const badge of allBadges) {
      const earnedAt = earnedMap.get(badge.id);
      const isEarned = !!earnedAt;

      // Hide secret badges that haven't been earned
      if (badge.isSecret && !isEarned) continue;

      result.push({
        id: badge.id,
        slug: badge.slug,
        title: badge.title,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        tier: badge.tier,
        xpReward: badge.xpReward,
        order: badge.order,
        isSecret: badge.isSecret,
        earnedAt: earnedAt?.toISOString() || null,
        isEarned,
      });
    }

    return { success: true, data: result };
  } catch (error) {
    logger.error('getBadges failed', { error: String(error) });
    return { success: false, error: 'Failed to load badges', code: 'GET_BADGES_FAILED' };
  }
}

// ============================================================================
// SERVER ACTION: Check and Award Badges
// ============================================================================

/**
 * Evaluates all badge criteria against the user's current stats.
 * Called after key actions (lesson complete, quiz pass, sim graded, mentor chat).
 * Returns newly earned badges so the UI can show notifications.
 */
export async function checkAndAwardBadges(
  userId?: string
): Promise<ActionResult<BadgeAwardResult>> {
  try {
    const uid = userId || await getAuthUserId();
    if (!uid) {
      return { success: false, error: 'You must be signed in', code: 'UNAUTHENTICATED' };
    }

    // Ensure badges are seeded
    await ensureBadgesSeeded();

    // Get user data
    const user = await db.user.findUnique({ where: { id: uid } });
    if (!user) {
      return { success: false, error: 'User not found', code: 'USER_NOT_FOUND' };
    }

    // Compute stats for badge criteria evaluation
    const [
      lessonsCompleted,
      modulesCompleted,
      quizzesPassed,
      simsGraded,
      bestSimScore,
      mentorChats,
    ] = await Promise.all([
      // Lessons completed
      db.lessonProgress.count({
        where: { userId: uid, status: 'COMPLETED' },
      }),
      // Modules completed
      db.moduleProgress.count({
        where: { userId: uid, status: 'COMPLETED' },
      }),
      // Quizzes passed (score >= passThreshold)
      db.quizAttempt.count({
        where: { userId: uid, score: { gte: 70 } },
      }),
      // Simulations graded
      db.simulationAttempt.count({
        where: { userId: uid, status: 'GRADED' },
      }),
      // Best simulation score
      db.simulationAttempt.findFirst({
        where: { userId: uid, status: 'GRADED' },
        orderBy: { officialScore: 'desc' },
        select: { officialScore: true },
      }),
      // Mentor chat sessions
      db.aiChatSession.count({
        where: { userId: uid },
      }),
    ]);

    // Check for perfect quiz score
    const perfectQuiz = await db.quizAttempt.findFirst({
      where: { userId: uid, score: 100 },
    });

    // Build stats object for criteria evaluation
    const stats = {
      lessonCount: lessonsCompleted,
      moduleCompletedCount: modulesCompleted,
      quizPassedCount: quizzesPassed,
      simGradedCount: simsGraded,
      bestSimScore: bestSimScore?.officialScore ?? 0,
      xp: user.xp,
      streakDays: user.streakDays,
      mentorChatCount: mentorChats,
      hasPerfectQuiz: !!perfectQuiz,
    };

    // Fetch all badges and user's earned badges
    const allBadges = await db.badge.findMany({
      where: { isPublished: true },
    });

    const earnedBadgeIds = new Set(
      (await db.userBadge.findMany({
        where: { userId: uid },
        select: { badgeId: true },
      })).map((ub) => ub.badgeId)
    );

    // Evaluate each unearned badge against the criteria
    const newlyAwarded: BadgeView[] = [];

    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) continue; // Already earned

      let criteriaMet = false;
      try {
        const criteria = JSON.parse(badge.criteria);
        criteriaMet = evaluateCriteria(criteria, stats);
      } catch {
        logger.warn('Invalid badge criteria JSON', { badgeSlug: badge.slug });
        continue;
      }

      if (criteriaMet) {
        // Award the badge!
        await db.userBadge.create({
          data: {
            userId: uid,
            badgeId: badge.id,
            xpEarned: badge.xpReward,
          },
        });

        // Award bonus XP if the badge has a reward
        if (badge.xpReward > 0) {
          const newXP = user.xp + badge.xpReward;
          const newLevel = Math.max(1, Math.floor(newXP / 500) + 1);
          await db.user.update({
            where: { id: uid },
            data: {
              xp: newXP,
              level: newLevel,
              lastActiveAt: new Date(),
            },
          });
          // Update local user XP to avoid double-counting across iterations
          user.xp = newXP;
          user.level = newLevel;
        }

        // Build the BadgeView for the response
        newlyAwarded.push({
          id: badge.id,
          slug: badge.slug,
          title: badge.title,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          tier: badge.tier,
          xpReward: badge.xpReward,
          order: badge.order,
          isSecret: badge.isSecret,
          earnedAt: new Date().toISOString(),
          isEarned: true,
        });

        logger.info('Badge awarded', {
          userId: uid,
          badgeSlug: badge.slug,
          xpReward: badge.xpReward,
        });
      }
    }

    const totalEarned = earnedBadgeIds.size + newlyAwarded.length;
    const totalAvailable = allBadges.length;

    return {
      success: true,
      data: {
        newlyAwarded,
        totalEarned,
        totalAvailable,
      },
    };
  } catch (error) {
    logger.error('checkAndAwardBadges failed', { error: String(error) });
    return { success: false, error: 'Failed to check badges', code: 'BADGE_CHECK_FAILED' };
  }
}

// ============================================================================
// CRITERIA EVALUATION (Internal)
// ============================================================================

interface BadgeCriteria {
  type: string;
  threshold?: number;
}

interface UserBadgeStats {
  lessonCount: number;
  moduleCompletedCount: number;
  quizPassedCount: number;
  simGradedCount: number;
  bestSimScore: number;
  xp: number;
  streakDays: number;
  mentorChatCount: number;
  hasPerfectQuiz: boolean;
}

function evaluateCriteria(criteria: BadgeCriteria, stats: UserBadgeStats): boolean {
  switch (criteria.type) {
    case 'LESSON_COUNT':
      return stats.lessonCount >= (criteria.threshold ?? 1);

    case 'MODULE_COMPLETED_COUNT':
      return stats.moduleCompletedCount >= (criteria.threshold ?? 1);

    case 'QUIZ_PASSED_COUNT':
      return stats.quizPassedCount >= (criteria.threshold ?? 1);

    case 'QUIZ_PERFECT_SCORE':
      return stats.hasPerfectQuiz;

    case 'SIM_GRADED_COUNT':
      return stats.simGradedCount >= (criteria.threshold ?? 1);

    case 'SIM_HIGH_SCORE':
      return stats.bestSimScore >= (criteria.threshold ?? 90);

    case 'XP_THRESHOLD':
      return stats.xp >= (criteria.threshold ?? 100);

    case 'STREAK_DAYS':
      return stats.streakDays >= (criteria.threshold ?? 3);

    case 'MENTOR_CHAT_COUNT':
      return stats.mentorChatCount >= (criteria.threshold ?? 1);

    default:
      logger.warn('Unknown badge criteria type', { type: criteria.type });
      return false;
  }
}
