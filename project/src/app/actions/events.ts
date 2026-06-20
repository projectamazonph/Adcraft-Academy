'use server';

import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-guard';
import { logger } from '@/lib/logger';
import type { ActionResult } from './types';

// ponytail: simple event types, add new ones as needed
export type EventType =
  | 'lesson_started' | 'lesson_completed'
  | 'quiz_started' | 'quiz_completed'
  | 'simulation_started' | 'simulation_graded'
  | 'mentor_chat';

export async function trackEvent(
  eventType: EventType,
  metadata?: Record<string, unknown>
): Promise<ActionResult<null>> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated', code: 'UNAUTHENTICATED' };

    await db.eventLog.create({
      data: {
        userId,
        eventType,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return { success: true, data: null };
  } catch (error) {
    logger.error('trackEvent failed', { error: String(error) });
    return { success: false, error: 'Failed to track event', code: 'TRACK_ERROR' };
  }
}

export async function getEventLog(
  limit = 50
): Promise<ActionResult<{ eventType: string; metadata: string | null; createdAt: Date }[]>> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated', code: 'UNAUTHENTICATED' };

    const events = await db.eventLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { eventType: true, metadata: true, createdAt: true },
    });

    return { success: true, data: events };
  } catch (error) {
    logger.error('getEventLog failed', { error: String(error) });
    return { success: false, error: 'Failed to load events', code: 'EVENTS_ERROR' };
  }
}

// ponytail: active XP multipliers
export async function getActiveMultipliers(): Promise<{ name: string; multiplier: number } | null> {
  try {
    const now = new Date();
    const m = await db.xpMultiplier.findFirst({
      where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { multiplier: 'desc' },
      select: { name: true, multiplier: true },
    });
    return m;
  } catch {
    return null;
  }
}
