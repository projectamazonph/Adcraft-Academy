'use server';

/**
 * AdCraft: Progress Tracking Server Actions
 *
 * Handles lesson completion persistence, module progress tracking,
 * and the full progress overview for the dashboard.
 *
 * IMPORTANT: This file ONLY exports async functions.
 * Types are in ./types.ts to avoid "Invalid Server Actions request" errors
 * in Next.js 16 (which forbids non-function exports from 'use server' files).
 *
 * Flow:
 * 1. markLessonComplete — Persists lesson completion, awards XP, updates module status
 * 2. getLessonProgress — Returns completed lessons for a specific module
 * 3. getProgressOverview — Returns full dashboard-ready progress data
 */

import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-guard';
import { logger } from '@/lib/logger';
import { trackEvent, getActiveMultipliers } from './events';
import type {
  ActionResult,
  MarkLessonCompleteOutput,
  LessonProgressItem,
  ProgressOverview,
  ModuleProgressItem,
} from './types';

// ============================================================================
// Module metadata (mirrors MDX content structure)
// ============================================================================

const MODULE_META: Record<number, { slug: string; title: string; icon: string; color: string; description: string; totalLessons: number }> = {
  0: { slug: 'onboarding', title: 'Onboarding', icon: 'Rocket', color: 'emerald', description: 'Welcome, platform tour, first simulation intro', totalLessons: 3 },
  1: { slug: 'foundations', title: 'Foundations', icon: 'BookOpen', color: 'sky', description: 'PPC basics, key metrics (CPC, ACoS, TACoS, RoAS)', totalLessons: 5 },
  4: { slug: 'campaign-architecture', title: 'Campaign Architecture', icon: 'Layout', color: 'amber', description: 'Sponsored Products, Brands, Display', totalLessons: 4 },
  6: { slug: 'bidding-lab', title: 'Bidding Lab', icon: 'TrendingUp', color: 'rose', description: 'Bid strategies, position economics, budget pacing', totalLessons: 3 },
  7: { slug: 'search-term-triage', title: 'Search Term Triage', icon: 'Filter', color: 'violet', description: 'Negative keywords, STR analysis, optimization', totalLessons: 3 },
};

// XP rewards per lesson (matches MDX frontmatter defaults)
const LESSON_XP_DEFAULT = 50;

// ============================================================================
// SERVER ACTION: Mark Lesson Complete
// ============================================================================

export async function markLessonComplete(
  moduleNumber: number,
  lessonNumber: number,
  userId?: string
): Promise<ActionResult<MarkLessonCompleteOutput>> {
  try {
    const uid = userId || await getAuthUserId();
    if (!uid) {
      return { success: false, error: 'You must be signed in to track progress', code: 'UNAUTHENTICATED' };
    }
    const moduleMeta = MODULE_META[moduleNumber];

    if (!moduleMeta) {
      return { success: false, error: `Module ${moduleNumber} not found`, code: 'MODULE_NOT_FOUND' };
    }

    if (lessonNumber < 1 || lessonNumber > moduleMeta.totalLessons) {
      return { success: false, error: `Invalid lesson number ${lessonNumber} for module ${moduleNumber}`, code: 'INVALID_LESSON' };
    }

    const lessonSlug = `${moduleNumber}.${lessonNumber}`;

    // Get the authenticated user (must exist since auth is enforced)
    const user = await db.user.findUnique({ where: { id: uid } });
    if (!user) {
      return { success: false, error: 'User account not found', code: 'USER_NOT_FOUND' };
    }

    // Ensure module exists
    let moduleRecord = await db.module.findFirst({ where: { moduleNumber } });
    if (!moduleRecord) {
      moduleRecord = await db.module.create({
        data: {
          moduleNumber,
          title: moduleMeta.title,
          slug: moduleMeta.slug,
          description: moduleMeta.description,
          icon: moduleMeta.icon,
          color: moduleMeta.color,
          order: moduleNumber,
          isPublished: true,
          estimatedMinutes: moduleMeta.totalLessons * 10,
        },
      });
    }

    // Ensure lesson exists
    let lessonRecord = await db.lesson.findFirst({
      where: { moduleId: moduleRecord.id, lessonNumber },
    });
    if (!lessonRecord) {
      lessonRecord = await db.lesson.create({
        data: {
          moduleId: moduleRecord.id,
          lessonNumber,
          title: `Lesson ${lessonNumber}`,
          slug: lessonSlug,
          content: '',
          xpReward: LESSON_XP_DEFAULT,
          isPublished: true,
        },
      });
    }

    // Check if already completed — idempotent
    const existingProgress = await db.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: uid, lessonId: lessonRecord.id } },
    });

    let xpEarned = 0;

    if (existingProgress?.status === 'COMPLETED') {
      // Already completed — return current state without double-awarding XP
      const completedInModule = await db.lessonProgress.count({
        where: {
          userId: uid,
          lesson: { moduleId: moduleRecord.id },
          status: 'COMPLETED',
        },
      });

      const moduleProgress = await db.moduleProgress.findUnique({
        where: { userId_moduleId: { userId: uid, moduleId: moduleRecord.id } },
      });

    await trackEvent('lesson_completed', { lessonSlug }).catch(() => {});
      return {
        success: true,
        data: {
          lessonSlug,
          xpEarned: 0,
          moduleStatus: moduleProgress?.status || 'IN_PROGRESS',
          lessonsCompletedInModule: completedInModule,
          totalLessonsInModule: moduleMeta.totalLessons,
        },
      };
    }

    // Create or update lesson progress
    await db.lessonProgress.upsert({
      where: { userId_lessonId: { userId: uid, lessonId: lessonRecord.id } },
      update: {
        status: 'COMPLETED',
        completedAt: new Date(),
        xpEarned: LESSON_XP_DEFAULT,
      },
      create: {
        userId: uid,
        lessonId: lessonRecord.id,
        status: 'COMPLETED',
        completedAt: new Date(),
        xpEarned: LESSON_XP_DEFAULT,
      },
    });

    xpEarned = LESSON_XP_DEFAULT;

    // Count completed lessons in this module
    const completedInModule = await db.lessonProgress.count({
      where: {
        userId: uid,
        lesson: { moduleId: moduleRecord.id },
        status: 'COMPLETED',
      },
    });

    // Determine module status
    const moduleStatus = completedInModule >= moduleMeta.totalLessons ? 'COMPLETED' : 'IN_PROGRESS';
    const moduleXpEarned = completedInModule * LESSON_XP_DEFAULT;
    const moduleScore = moduleStatus === 'COMPLETED' ? 100 : Math.round((completedInModule / moduleMeta.totalLessons) * 100);

    // Upsert module progress
    await db.moduleProgress.upsert({
      where: { userId_moduleId: { userId: uid, moduleId: moduleRecord.id } },
      update: {
        status: moduleStatus,
        score: moduleScore,
        xpEarned: moduleXpEarned,
        completedAt: moduleStatus === 'COMPLETED' ? new Date() : undefined,
        startedAt: new Date(),
      },
      create: {
        userId: uid,
        moduleId: moduleRecord.id,
        status: moduleStatus,
        score: moduleScore,
        xpEarned: moduleXpEarned,
        startedAt: new Date(),
        completedAt: moduleStatus === 'COMPLETED' ? new Date() : null,
      },
    });

    // Update user XP and level
    const newXP = user.xp + xpEarned;
    const newLevel = Math.max(1, Math.floor(newXP / 500) + 1);

    await db.user.update({
      where: { id: uid },
      data: {
        xp: newXP,
        level: newLevel,
        lastActiveAt: new Date(),
      },
    });

    return {
      success: true,
      data: {
        lessonSlug,
        finalXp,
        moduleStatus,
        lessonsCompletedInModule: completedInModule,
        totalLessonsInModule: moduleMeta.totalLessons,
      },
    };
  } catch (error) {
    logger.error('markLessonComplete failed', { error: String(error) });
    return { success: false, error: 'Failed to mark lesson complete', code: 'MARK_FAILED' };
  }
}

// ============================================================================
// SERVER ACTION: Get Lesson Progress for a Module
// ============================================================================

export async function getLessonProgress(
  moduleNumber: number,
  userId?: string
): Promise<ActionResult<LessonProgressItem[]>> {
  try {
    const uid = userId || await getAuthUserId();
    if (!uid) {
      return { success: false, error: 'You must be signed in to view progress', code: 'UNAUTHENTICATED' };
    }
    const moduleMeta = MODULE_META[moduleNumber];

    if (!moduleMeta) {
      return { success: false, error: `Module ${moduleNumber} not found`, code: 'MODULE_NOT_FOUND' };
    }

    // Find module in DB
    const moduleRecord = await db.module.findFirst({ where: { moduleNumber } });

    if (!moduleRecord) {
      // Module not in DB yet — no progress, return all NOT_STARTED
      const lessons: LessonProgressItem[] = [];
      for (let i = 1; i <= moduleMeta.totalLessons; i++) {
        lessons.push({
          lessonNumber: i,
          lessonSlug: `${moduleNumber}.${i}`,
          status: 'NOT_STARTED',
          completedAt: null,
        });
      }
      return { success: true, data: lessons };
    }

    // Get all lessons for this module with their progress
    const lessonRecords = await db.lesson.findMany({
      where: { moduleId: moduleRecord.id },
      orderBy: { lessonNumber: 'asc' },
      include: {
        progress: {
          where: { userId: uid },
        },
      },
    });

    // Build result — include lessons even if not in DB yet
    const completedMap = new Map<number, { status: string; completedAt: Date | null }>();
    for (const lr of lessonRecords) {
      const p = lr.progress[0];
      if (p) {
        completedMap.set(lr.lessonNumber, { status: p.status, completedAt: p.completedAt });
      }
    }

    const result: LessonProgressItem[] = [];
    for (let i = 1; i <= moduleMeta.totalLessons; i++) {
      const p = completedMap.get(i);
      result.push({
        lessonNumber: i,
        lessonSlug: `${moduleNumber}.${i}`,
        status: (p?.status as any) || 'NOT_STARTED',
        completedAt: p?.completedAt?.toISOString() || null,
      });
    }

    return { success: true, data: result };
  } catch (error) {
    logger.error('getLessonProgress failed', { error: String(error) });
    return { success: false, error: 'Failed to get lesson progress', code: 'PROGRESS_FAILED' };
  }
}

// ============================================================================
// SERVER ACTION: Get Full Progress Overview (Dashboard)
// ============================================================================

export async function getProgressOverview(
  userId?: string
): Promise<ActionResult<ProgressOverview>> {
  try {
    const uid = userId || await getAuthUserId();
    if (!uid) {
      return { success: false, error: 'You must be signed in to view progress', code: 'UNAUTHENTICATED' };
    }

    // Get the authenticated user
    const user = await db.user.findUnique({ where: { id: uid } });
    if (!user) {
      return { success: false, error: 'User account not found', code: 'USER_NOT_FOUND' };
    }

    // Get simulation stats
    const gradedAttempts = await db.simulationAttempt.findMany({
      where: { userId: uid, status: 'GRADED' },
      include: { simulation: true },
    });

    const bestSimScores: Record<string, number> = {};
    let simsPassed = 0;
    const simTypes = new Set<string>();

    for (const attempt of gradedAttempts) {
      const simType = attempt.simulation.type;
      simTypes.add(simType);
      const score = attempt.officialScore ?? 0;
      if (!bestSimScores[simType] || score > bestSimScores[simType]) {
        bestSimScores[simType] = score;
      }
      if (score >= 70) simsPassed++;
    }

    // Build module progress
    const moduleProgress: ModuleProgressItem[] = [];
    let modulesCompleted = 0;

    // ponytail: daily streak from lastActiveAt
    const now = new Date();
    const lastDate = new Date(user.lastActiveAt.getFullYear(), user.lastActiveAt.getMonth(), user.lastActiveAt.getDate());
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / 86400000);
    let streakDays = user.streakDays;
    if (diffDays === 1) {
      streakDays += 1;
      await db.user.update({ where: { id: uid }, data: { streakDays, lastActiveAt: now } });
    } else if (diffDays > 1) {
      streakDays = 1;
      await db.user.update({ where: { id: uid }, data: { streakDays, lastActiveAt: now } });
    } else if (diffDays === 0) {
      await db.user.update({ where: { id: uid }, data: { lastActiveAt: now } });
    }
    const moduleNumbers = Object.keys(MODULE_META).map(Number).sort((a, b) => a - b);

    for (const modNum of moduleNumbers) {
      const meta = MODULE_META[modNum];
      const moduleRecord = await db.module.findFirst({ where: { moduleNumber: modNum } });

      let status: ModuleProgressItem['status'] = 'NOT_STARTED';
      let lessonsCompleted = 0;
      let score = 0;
      let xpEarned = 0;

      if (moduleRecord) {
        const mp = await db.moduleProgress.findUnique({
          where: { userId_moduleId: { userId: uid, moduleId: moduleRecord.id } },
        });

        if (mp) {
          status = mp.status as any;
          score = mp.score;
          xpEarned = mp.xpEarned;
        }

        lessonsCompleted = await db.lessonProgress.count({
          where: {
            userId: uid,
            lesson: { moduleId: moduleRecord.id },
            status: 'COMPLETED',
          },
        });
      }

      if (status === 'COMPLETED') modulesCompleted++;

      moduleProgress.push({
        moduleNumber: modNum,
        status,
        lessonsCompleted,
        totalLessons: meta.totalLessons,
        score,
        xpEarned,
      });
    }

    return {
      success: true,
      data: {
        userId: uid,
        xp: user.xp,
        level: user.level,
        streakDays,
        modulesCompleted,
        totalModules: moduleNumbers.length,
        simsPassed,
        totalSims: 3,
        bestSimScores,
        moduleProgress,
      },
    };
  } catch (error) {
    logger.error('getProgressOverview failed', { error: String(error) });
    return { success: false, error: 'Failed to get progress overview', code: 'OVERVIEW_FAILED' };
  }
}
