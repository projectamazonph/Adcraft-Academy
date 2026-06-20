'use server';

/**
 * AdCraft: Simulation Server Actions
 *
 * Implements the server-side half of the Hybrid Execution Model (ADR-001):
 * - Client runs preview scoring for instant feedback (<100ms)
 * - Server runs the SAME engine functions for authoritative grading
 * - Server result is persisted to the database
 * - If preview != official, scoreDiscrepancy flag is set
 *
 * IMPORTANT: This file ONLY exports async functions.
 * Types are in ./types.ts to avoid "Invalid Server Actions request" errors
 * in Next.js 16 (which forbids non-function exports from 'use server' files).
 *
 * Lifecycle:
 * 1. startAttempt — Creates a SimulationAttempt record (status: IN_PROGRESS)
 * 2. gradeAttempt — Runs server-side evaluation, computes official score, persists
 * 3. getAttemptHistory — Retrieves past attempts for a user/simulation
 */

import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-guard';
import { logger } from '@/lib/logger';
import {
  evaluateStrTriage,
  evaluateBidElevator,
  previewCampaignBuilderScore,
} from '@/engine';
import { trackEvent } from './events';
import type {
  SearchTermEntry,
  StrUserAction,
  StrExpectedAction,
  SimulationContext,
  BidScenario,
  BidDecision,
  CampaignStructure,
  StrTriageEvaluation,
  BidElevatorEvaluation,
  CampaignBuilderEvaluation,
} from '@/engine';
import type {
  ActionResult,
  StartAttemptInput,
  StartAttemptOutput,
  GradeStrTriageInput,
  GradeBidElevatorInput,
  GradeCampaignBuilderInput,
  GradeAttemptOutput,
  AttemptHistoryItem,
  UserStatsOutput,
} from './types';

// ============================================================================
// HELPER: Map simulation type to slug
// ============================================================================

const SIMULATION_SLUG_MAP: Record<string, string> = {
  STR_TRIAGE_ARENA: 'str-triage-arena',
  BID_ELEVATOR: 'bid-elevator',
  CAMPAIGN_BUILDER: 'campaign-builder',
};

// ============================================================================
// SERVER ACTION: Start Attempt
// ============================================================================

export async function startAttempt(
  input: StartAttemptInput
): Promise<ActionResult<StartAttemptOutput>> {
  try {
    const userId = input.userId || await getAuthUserId();
    if (!userId) {
      return { success: false, error: 'You must be signed in to start simulations', code: 'UNAUTHENTICATED' };
    }

    // Find or create the simulation record
    let simulation = await db.simulation.findFirst({
      where: { type: input.simulationType as any },
    });

    if (!simulation) {
      // Auto-create simulation record for MVP
      const moduleId = getModuleIdForSim(input.simulationType);
      simulation = await db.simulation.create({
        data: {
          type: input.simulationType as any,
          title: getSimTitle(input.simulationType),
          slug: input.simulationSlug || SIMULATION_SLUG_MAP[input.simulationType] || input.simulationType.toLowerCase(),
          description: getSimDescription(input.simulationType),
          difficulty: input.simulationType === 'STR_TRIAGE_ARENA' ? 'ADVANCED' : 'INTERMEDIATE',
          moduleId,
          xpReward: 200,
          isPublished: true,
        },
      });
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: 'User account not found', code: 'USER_NOT_FOUND' };
    }

    // Count existing attempts to determine attempt number
    const existingAttempts = await db.simulationAttempt.count({
      where: { userId, simulationId: simulation.id },
    });

    const attempt = await db.simulationAttempt.create({
      data: {
        userId,
        simulationId: simulation.id,
        attemptNumber: existingAttempts + 1,
        status: 'IN_PROGRESS',
        previewScore: 0,
        state: '{}',
        actions: '[]',
        timeSpentSeconds: 0,
      },
    });

    return {
      success: true,
      data: {
        attemptId: attempt.id,
        attemptNumber: attempt.attemptNumber,
      },
    };
  } catch (error) {
    logger.error('startAttempt failed', { error: String(error) });
    return {
      success: false,
      error: 'Failed to start simulation attempt',
      code: 'START_FAILED',
    };
  }
}

// ============================================================================
// SERVER ACTION: Grade STR Triage Attempt
// ============================================================================

export async function gradeStrTriageAttempt(
  input: GradeStrTriageInput
): Promise<ActionResult<GradeAttemptOutput>> {
  try {
    // Run the SAME evaluation engine function on the server
    const evaluation = evaluateStrTriage(
      input.searchTerms as SearchTermEntry[],
      input.userActions as StrUserAction[],
      input.expectedActions as StrExpectedAction[],
      input.context as SimulationContext
    );

    const officialScore = evaluation.score;
    const scoreDiscrepancy = officialScore !== input.previewScore;
    const xpEarned = Math.round(officialScore * 2); // Max 200 XP

    // Get userId from the attempt record
    const attempt = await db.simulationAttempt.findUnique({ where: { id: input.attemptId } });
    const userId = attempt?.userId || await getAuthUserId();
    if (!userId) {
      return { success: false, error: 'You must be signed in to grade attempts', code: 'UNAUTHENTICATED' };
    }

    // Persist the result
    await db.simulationAttempt.update({
      where: { id: input.attemptId },
      data: {
        status: 'GRADED',
        previewScore: input.previewScore,
        officialScore,
        scoreDiscrepancy,
        state: JSON.stringify({
          searchTerms: input.searchTerms,
          userActions: input.userActions,
        }),
        actions: JSON.stringify(input.userActions),
        timeSpentSeconds: input.timeSpentSeconds,
        submittedAt: new Date(),
        gradedAt: new Date(),
      },
    });

    // Update user XP (FIX: now uses the actual userId, not hardcoded MVP_USER_ID)
    await updateUserXP(userId, xpEarned);

    return {
      success: true,
      data: {
        attemptId: input.attemptId,
        officialScore,
        previewScore: input.previewScore,
        scoreDiscrepancy,
        xpEarned,
        evaluation,
      },
    };
  } catch (error) {
    logger.error('gradeStrTriageAttempt failed', { error: String(error) });
    return {
      success: false,
      error: 'Failed to grade STR Triage attempt',
      code: 'GRADE_FAILED',
    };
  }
}

// ============================================================================
// SERVER ACTION: Grade Bid Elevator Attempt
// ============================================================================

export async function gradeBidElevatorAttempt(
  input: GradeBidElevatorInput
): Promise<ActionResult<GradeAttemptOutput>> {
  try {
    // Run the SAME evaluation engine function on the server
    const evaluation = evaluateBidElevator(
      input.scenarios as BidScenario[],
      input.decisions as BidDecision[],
      input.context as SimulationContext
    );

    const officialScore = evaluation.score;
    const scoreDiscrepancy = officialScore !== input.previewScore;
    const xpEarned = Math.round(officialScore * 2); // Max 200 XP

    // Get userId from the attempt record
    const attempt = await db.simulationAttempt.findUnique({ where: { id: input.attemptId } });
    const userId = attempt?.userId || await getAuthUserId();
    if (!userId) {
      return { success: false, error: 'You must be signed in to grade attempts', code: 'UNAUTHENTICATED' };
    }

    // Persist the result
    await db.simulationAttempt.update({
      where: { id: input.attemptId },
      data: {
        status: 'GRADED',
        previewScore: input.previewScore,
        officialScore,
        scoreDiscrepancy,
        state: JSON.stringify({
          scenarios: input.scenarios,
          decisions: input.decisions,
        }),
        actions: JSON.stringify(input.decisions),
        timeSpentSeconds: input.timeSpentSeconds,
        submittedAt: new Date(),
        gradedAt: new Date(),
      },
    });

    // Update user XP (FIX: now uses the actual userId)
    await updateUserXP(userId, xpEarned);

    return {
      success: true,
      data: {
        attemptId: input.attemptId,
        officialScore,
        previewScore: input.previewScore,
        scoreDiscrepancy,
        xpEarned,
        evaluation,
      },
    };
  } catch (error) {
    logger.error('gradeBidElevatorAttempt failed', { error: String(error) });
    return {
      success: false,
      error: 'Failed to grade Bid Elevator attempt',
      code: 'GRADE_FAILED',
    };
  }
}

// ============================================================================
// SERVER ACTION: Grade Campaign Builder Attempt
// ============================================================================

export async function gradeCampaignBuilderAttempt(
  input: GradeCampaignBuilderInput
): Promise<ActionResult<GradeAttemptOutput>> {
  try {
    // The Campaign Builder evaluation is done client-side in the store
    // (because it uses function-valued criteria that can't be serialized).
    // For the server action, we re-compute a verification score using the
    // engine's preview function and compare it to the client's evaluation.

    const verificationScore = previewCampaignBuilderScore(input.campaign as CampaignStructure);
    const officialScore = (input.evaluation as CampaignBuilderEvaluation).totalScore;
    const scoreDiscrepancy = Math.abs(officialScore - verificationScore) > 10;

    const xpEarned = Math.round(officialScore * 2); // Max 200 XP

    // Get userId from the attempt record
    const attempt = await db.simulationAttempt.findUnique({ where: { id: input.attemptId } });
    const userId = attempt?.userId || await getAuthUserId();
    if (!userId) {
      return { success: false, error: 'You must be signed in to grade attempts', code: 'UNAUTHENTICATED' };
    }

    // Persist the result
    await db.simulationAttempt.update({
      where: { id: input.attemptId },
      data: {
        status: 'GRADED',
        previewScore: input.previewScore,
        officialScore,
        scoreDiscrepancy,
        state: JSON.stringify({
          campaign: input.campaign,
          evaluation: input.evaluation,
        }),
        actions: JSON.stringify((input.evaluation as CampaignBuilderEvaluation).criteriaResults),
        timeSpentSeconds: input.timeSpentSeconds,
        submittedAt: new Date(),
        gradedAt: new Date(),
      },
    });

    // Update user XP (FIX: now uses the actual userId)
    await updateUserXP(userId, xpEarned);

    return {
      success: true,
      data: {
        attemptId: input.attemptId,
        officialScore,
        previewScore: input.previewScore,
        scoreDiscrepancy,
        xpEarned,
        evaluation: input.evaluation,
      },
    };
  } catch (error) {
    logger.error('gradeCampaignBuilderAttempt failed', { error: String(error) });
    return {
      success: false,
      error: 'Failed to grade Campaign Builder attempt',
      code: 'GRADE_FAILED',
    };
  }
}

// ============================================================================
// SERVER ACTION: Get Attempt History
// ============================================================================

export async function getAttemptHistory(
  simulationType: string,
  userId?: string
): Promise<ActionResult<AttemptHistoryItem[]>> {
  try {
    const uid = userId || await getAuthUserId();
    if (!uid) {
      return { success: false, error: 'You must be signed in to view history', code: 'UNAUTHENTICATED' };
    }

    const simulation = await db.simulation.findFirst({
      where: { type: simulationType as any },
    });

    if (!simulation) {
      return { success: true, data: [] };
    }

    const attempts = await db.simulationAttempt.findMany({
      where: { userId: uid, simulationId: simulation.id },
      orderBy: { attemptNumber: 'desc' },
      take: 20,
    });

    return {
      success: true,
      data: attempts.map((a) => ({
        id: a.id,
        attemptNumber: a.attemptNumber,
        previewScore: a.previewScore,
        officialScore: a.officialScore,
        scoreDiscrepancy: a.scoreDiscrepancy,
        status: a.status,
        timeSpentSeconds: a.timeSpentSeconds,
        startedAt: a.startedAt.toISOString(),
        submittedAt: a.submittedAt?.toISOString() || null,
        gradedAt: a.gradedAt?.toISOString() || null,
      })),
    };
  } catch (error) {
    logger.error('getAttemptHistory failed', { error: String(error) });
    return {
      success: false,
      error: 'Failed to get attempt history',
      code: 'HISTORY_FAILED',
    };
  }
}

// ============================================================================
// SERVER ACTION: Get User Stats
// ============================================================================

export async function getUserStats(
  userId?: string
): Promise<ActionResult<UserStatsOutput>> {
  try {
    const uid = userId || await getAuthUserId();
    if (!uid) {
      return { success: false, error: 'You must be signed in to view stats', code: 'UNAUTHENTICATED' };
    }

    // Get the authenticated user
    const user = await db.user.findUnique({ where: { id: uid } });
    if (!user) {
      return { success: false, error: 'User account not found', code: 'USER_NOT_FOUND' };
    }

    const attempts = await db.simulationAttempt.findMany({
      where: { userId: uid, status: 'GRADED' },
      include: { simulation: true },
    });

    // Compute best scores per simulation type
    const bestScores: Record<string, number> = {};
    for (const attempt of attempts) {
      const simType = attempt.simulation.type;
      const score = attempt.officialScore ?? 0;
      if (!bestScores[simType] || score > bestScores[simType]) {
        bestScores[simType] = score;
      }
    }

    return {
      success: true,
      data: {
        userId: uid,
        xp: user.xp,
        level: user.level,
        totalAttempts: attempts.length,
        bestScores,
      },
    };
  } catch (error) {
    logger.error('getUserStats failed', { error: String(error) });
    return {
      success: false,
      error: 'Failed to get user stats',
      code: 'STATS_FAILED',
    };
  }
}

// ============================================================================
// INTERNAL HELPERS (NOT exported — only used internally)
// ============================================================================

/**
 * Update user XP — NOW accepts userId as parameter instead of using hardcoded MVP_USER_ID.
 * This fixes the bug where XP was always awarded to mvp-user-001 regardless of actual user.
 */
async function updateUserXP(userId: string, xpEarned: number): Promise<void> {
  if (xpEarned <= 0) return;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const newXP = user.xp + xpEarned;
  // Level up every 500 XP
  const newLevel = Math.max(1, Math.floor(newXP / 500) + 1);

  await db.user.update({
    where: { id: userId },
    data: {
      xp: newXP,
      level: newLevel,
      lastActiveAt: new Date(),
    },
  });
}

function getModuleIdForSim(simType: string): string {
  // For MVP, auto-create a module if it doesn't exist
  const moduleMap: Record<string, number> = {
    CAMPAIGN_BUILDER: 4,
    BID_ELEVATOR: 6,
    STR_TRIAGE_ARENA: 7,
  };
  return `module-${moduleMap[simType] || 0}`;
}

function getSimTitle(simType: string): string {
  const titles: Record<string, string> = {
    STR_TRIAGE_ARENA: 'STR Triage Arena',
    BID_ELEVATOR: 'Bid Elevator',
    CAMPAIGN_BUILDER: 'Campaign Builder',
  };
  return titles[simType] || simType;
}

function getSimDescription(simType: string): string {
  const descriptions: Record<string, string> = {
    STR_TRIAGE_ARENA: 'Analyze search terms and make keep/pause/negate decisions under time pressure.',
    BID_ELEVATOR: 'Practice bidding decisions across real-world scenarios with instant feedback.',
    CAMPAIGN_BUILDER: 'Build complete campaign structures with keywords, bids, and budgets.',
  };
  return descriptions[simType] || '';
}
