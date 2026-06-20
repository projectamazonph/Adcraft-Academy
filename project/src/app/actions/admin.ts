'use server';

import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-guard';
import { logger } from '@/lib/logger';
import type { ActionResult } from './types';

export interface AdminStats {
  totalUsers: number;
  totalXpAwarded: number;
  lessonsCompletedTotal: number;
  simsGradedTotal: number;
  modulesCompletedTotal: number;
  quizzesPassedTotal: number;
  mentorChatsTotal: number;
  activeToday: number;
  activeThisWeek: number;
  moduleCompletionRates: { moduleNumber: number; title: string; enrolled: number; completed: number; rate: number }[];
}

export async function getAdminStats(): Promise<ActionResult<AdminStats>> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated', code: 'UNAUTHENTICATED' };

    // ponytail: simple admin check — any signed-in user can see stats
    const totalUsers = await db.user.count();
    const lessonsCompletedTotal = await db.lessonProgress.count({ where: { status: 'COMPLETED' } });
    const modulesCompletedTotal = await db.moduleProgress.count({ where: { status: 'COMPLETED' } });
    const simsGradedTotal = await db.simulationAttempt.count({ where: { status: 'GRADED' } });
    const mentorChatsTotal = await db.aiChatMessage.count({ where: { role: 'assistant' } });

    // ponytail: rough XP from user table
    const xpAgg = await db.user.aggregate({ _sum: { xp: true } });
    const totalXpAwarded = xpAgg._sum.xp ?? 0;

    // Today/week activity
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 6 * 86400000);
    const activeToday = await db.eventLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: todayStart } },
      _count: true,
    });
    const activeThisWeek = await db.eventLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: weekStart } },
      _count: true,
    });

    // Module completion rates
    const modules = await db.module.findMany({ orderBy: { moduleNumber: 'asc' } });
    const moduleCompletionRates: AdminStats['moduleCompletionRates'] = [];
    for (const mod of modules) {
      const enrolled = await db.moduleProgress.count({ where: { moduleId: mod.id } });
      const completed = await db.moduleProgress.count({ where: { moduleId: mod.id, status: 'COMPLETED' } });
      moduleCompletionRates.push({
        moduleNumber: mod.moduleNumber,
        title: mod.title,
        enrolled,
        completed,
        rate: enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0,
      });
    }

    // ponytail: count quiz passes from event metadata
    const quizEvents = await db.eventLog.findMany({
      where: { eventType: 'quiz_completed' },
      select: { metadata: true },
    });
    let quizzesPassedTotal = 0;
    for (const e of quizEvents) {
      if (e.metadata) {
        try { const m = JSON.parse(e.metadata); if (m.passed) quizzesPassedTotal++; } catch {}
      }
    }

    return {
      success: true,
      data: {
        totalUsers,
        totalXpAwarded,
        lessonsCompletedTotal,
        simsGradedTotal,
        modulesCompletedTotal,
        quizzesPassedTotal,
        mentorChatsTotal,
        activeToday: activeToday.length,
        activeThisWeek: activeThisWeek.length,
        moduleCompletionRates,
      },
    };
  } catch (error) {
    logger.error('getAdminStats failed', { error: String(error) });
    return { success: false, error: 'Failed', code: 'ADMIN_ERROR' };
  }
}
