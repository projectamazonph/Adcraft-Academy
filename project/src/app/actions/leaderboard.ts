'use server';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { ActionResult } from './types';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  level: number;
  xp: number;
  modulesCompleted: number;
  avatarLetter: string;
}

export async function getLeaderboard(): Promise<ActionResult<LeaderboardEntry[]>> {
  try {
    const users = await db.user.findMany({
      orderBy: { xp: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        email: true,
        level: true,
        xp: true,
      },
    });

    // Count modules completed per user
    const entries: LeaderboardEntry[] = await Promise.all(
      users.map(async (user, i) => {
        const completed = await db.moduleProgress.count({
          where: { userId: user.id, status: 'COMPLETED' },
        });
        return {
          rank: i + 1,
          name: user.name || user.email?.split('@')[0] || 'Anonymous',
          level: user.level,
          xp: user.xp,
          modulesCompleted: completed,
          avatarLetter: (user.name || user.email || '?')[0].toUpperCase(),
        };
      })
    );

    return { success: true, data: entries };
  } catch (error) {
    logger.error('getLeaderboard failed', { error: String(error) });
    return { success: false, error: 'Failed to load leaderboard', code: 'LEADERBOARD_ERROR' };
  }
}
