'use server';

import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-guard';
import { logger } from '@/lib/logger';
import type { ActionResult } from './types';

export interface AnalyticsData {
  totalSessions: number;
  totalTimeMinutes: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  quizzesAttempted: number;
  simsGraded: number;
  avgSimScore: number;
  mentorChats: number;
  eventsByType: { eventType: string; count: number }[];
  recentActivity: { eventType: string; createdAt: Date }[];
}

export async function getAnalytics(): Promise<ActionResult<AnalyticsData>> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated', code: 'UNAUTHENTICATED' };

    const events = await db.eventLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { eventType: true, createdAt: true, metadata: true },
    });

    // Aggregate
    const lessonsCompleted = events.filter(e => e.eventType === 'lesson_completed').length;
    const quizzesAttempted = events.filter(e => e.eventType === 'quiz_completed').length;
    const simsGraded = events.filter(e => e.eventType === 'simulation_graded').length;
    const mentorChats = events.filter(e => e.eventType === 'mentor_chat').length;

    // ponytail: estimate quiz pass rate from metadata
    let quizzesPassed = 0;
    for (const e of events) {
      if (e.eventType === 'quiz_completed' && e.metadata) {
        try {
          const meta = JSON.parse(e.metadata);
          if (meta.passed) quizzesPassed++;
        } catch {}
      }
    }

    // ponytail: estimate avg sim score from metadata
    let avgSimScore = 0;
    const simScores: number[] = [];
    for (const e of events) {
      if (e.eventType === 'simulation_graded' && e.metadata) {
        try {
          const meta = JSON.parse(e.metadata);
          if (typeof meta.score === 'number') simScores.push(meta.score);
        } catch {}
      }
    }
    avgSimScore = simScores.length > 0
      ? Math.round(simScores.reduce((a, b) => a + b, 0) / simScores.length)
      : 0;

    // Events by type
    const typeCount = new Map<string, number>();
    for (const e of events) {
      typeCount.set(e.eventType, (typeCount.get(e.eventType) || 0) + 1);
    }
    const eventsByType = Array.from(typeCount.entries()).map(([eventType, count]) => ({ eventType, count }));

    // ponytail: estimate session count (unique days with activity)
    const activeDays = new Set(events.map(e => e.createdAt.toISOString().slice(0, 10)));
    const totalSessions = activeDays.size;

    // ponytail: rough time estimate — 10 min per lesson, 15 per sim, 5 per chat
    const totalTimeMinutes = lessonsCompleted * 10 + simsGraded * 15 + mentorChats * 5;

    return {
      success: true,
      data: {
        totalSessions,
        totalTimeMinutes,
        lessonsCompleted,
        quizzesPassed,
        quizzesAttempted,
        simsGraded,
        avgSimScore,
        mentorChats,
        eventsByType,
        recentActivity: events.slice(0, 10),
      },
    };
  } catch (error) {
    logger.error('getAnalytics failed', { error: String(error) });
    return { success: false, error: 'Failed to load analytics', code: 'ANALYTICS_ERROR' };
  }
}
