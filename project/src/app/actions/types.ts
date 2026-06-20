/**
 * AdCraft: Shared types for Server Actions
 *
 * IMPORTANT: This file does NOT have 'use server' — it only exports
 * TypeScript types and interfaces that are shared between the server
 * action files and their consumers.
 *
 * Next.js 16 enforces that 'use server' files can ONLY export async
 * functions. Type exports from those files cause "Invalid Server Actions
 * request" errors at runtime.
 */

// ============================================================================
// LESSON ACTION TYPES
// ============================================================================

export interface LessonMeta {
  title: string;
  slug: string;
  moduleNumber: number;
  lessonNumber: number;
  type: string;
  estimatedMinutes: number;
  xpReward: number;
}

export interface LessonContent {
  meta: LessonMeta;
  body: string;
}

// ============================================================================
// SIMULATION ACTION TYPES
// ============================================================================

/** Result of any server action — follows the "result" pattern */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

/** Input for starting a new simulation attempt */
export interface StartAttemptInput {
  userId: string;
  simulationType: 'STR_TRIAGE_ARENA' | 'BID_ELEVATOR' | 'CAMPAIGN_BUILDER';
  simulationSlug: string;
}

/** Output for starting an attempt */
export interface StartAttemptOutput {
  attemptId: string;
  attemptNumber: number;
}

/** Input for grading a STR Triage attempt */
export interface GradeStrTriageInput {
  attemptId: string;
  previewScore: number;
  searchTerms: any[];
  userActions: any[];
  expectedActions: any[];
  context: any;
  timeSpentSeconds: number;
}

/** Input for grading a Bid Elevator attempt */
export interface GradeBidElevatorInput {
  attemptId: string;
  previewScore: number;
  scenarios: any[];
  decisions: any[];
  context: any;
  timeSpentSeconds: number;
}

/** Input for grading a Campaign Builder attempt */
export interface GradeCampaignBuilderInput {
  attemptId: string;
  previewScore: number;
  campaign: any;
  evaluation: any;
  timeSpentSeconds: number;
}

/** Output for grading any attempt */
export interface GradeAttemptOutput {
  attemptId: string;
  officialScore: number;
  previewScore: number;
  scoreDiscrepancy: boolean;
  xpEarned: number;
  evaluation: any;
}

/** Output for attempt history */
export interface AttemptHistoryItem {
  id: string;
  attemptNumber: number;
  previewScore: number;
  officialScore: number | null;
  scoreDiscrepancy: boolean;
  status: string;
  timeSpentSeconds: number;
  startedAt: string;
  submittedAt: string | null;
  gradedAt: string | null;
}

/** Output for user stats */
export interface UserStatsOutput {
  userId: string;
  xp: number;
  level: number;
  totalAttempts: number;
  bestScores: Record<string, number>;
}

// ============================================================================
// PROGRESS TRACKING TYPES
// ============================================================================

/** Input for marking a lesson complete */
export interface MarkLessonCompleteInput {
  moduleNumber: number;
  lessonNumber: number;
  userId?: string;
}

/** Output for marking a lesson complete */
export interface MarkLessonCompleteOutput {
  lessonSlug: string;
  xpEarned: number;
  moduleStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  lessonsCompletedInModule: number;
  totalLessonsInModule: number;
}

/** Progress for a single lesson */
export interface LessonProgressItem {
  lessonNumber: number;
  lessonSlug: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  completedAt: string | null;
}

/** Progress for a single module */
export interface ModuleProgressItem {
  moduleNumber: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  lessonsCompleted: number;
  totalLessons: number;
  score: number;
  xpEarned: number;
}

/** Full progress overview for dashboard */
export interface ProgressOverview {
  userId: string;
  xp: number;
  level: number;
  streakDays: number;
  modulesCompleted: number;
  totalModules: number;
  simsPassed: number;
  totalSims: number;
  bestSimScores: Record<string, number>;
  moduleProgress: ModuleProgressItem[];
}

// ============================================================================
// AI MENTOR TYPES
// ============================================================================

/** Output from the AI mentor chat */
export interface MentorChatOutput {
  message: string;
  latencyMs: number;
  model: string;
}
