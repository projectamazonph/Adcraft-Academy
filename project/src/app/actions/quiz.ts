'use server';

/**
 * AdCraft: Quiz Server Actions (Post-MVP: Atomic Build A4)
 *
 * Handles quiz lifecycle: retrieval, submission & grading, and history.
 * Quiz content is seeded from fixtures/quiz-questions.json into the database
 * on first access (lazy seed pattern).
 *
 * XP Flow:
 * - Quizzes award XP only when score >= quiz.passThreshold (default 70%)
 * - XP is added to the user's total and level is recalculated
 * - Quiz completion also marks the associated lesson as complete
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
import { checkAndAwardBadges } from './badge';
import { trackEvent } from './events';
import type {
  ActionResult,
  QuizView,
  QuizQuestionView,
  SubmitQuizOutput,
  GradedQuestion,
  QuizAttemptSummary,
} from './types';

// XP reward for passing a quiz (distinct from lesson XP)
const QUIZ_XP_REWARD = 100;

// Module metadata — mirrors the MODULE_META in progress.ts for lesson lookups
const MODULE_META: Record<number, { slug: string; title: string; totalLessons: number }> = {
  0: { slug: 'onboarding', title: 'Onboarding', totalLessons: 3 },
  1: { slug: 'foundations', title: 'Foundations', totalLessons: 5 },
  4: { slug: 'campaign-architecture', title: 'Campaign Architecture', totalLessons: 4 },
  6: { slug: 'bidding-lab', title: 'Bidding Lab', totalLessons: 3 },
  7: { slug: 'search-term-triage', title: 'Search Term Triage', totalLessons: 3 },
};

// Cache the fixture data in memory after first load
let fixtureCache: any = null;

async function loadFixture() {
  if (fixtureCache) return fixtureCache;
  try {
    const raw = await readFile(join(process.cwd(), 'fixtures/quiz-questions.json'), 'utf-8');
    fixtureCache = JSON.parse(raw);
    return fixtureCache;
  } catch (error) {
    logger.error('Failed to load quiz fixture', { error: String(error) });
    return null;
  }
}

// ============================================================================
// LAZY SEED: Ensure quiz + questions exist in DB for a module
// ============================================================================

async function ensureQuizSeeded(moduleNumber: number): Promise<string | null> {
  const fixture = await loadFixture();
  if (!fixture) return null;

  const quizData = fixture.quizzes.find((q: any) => q.moduleNumber === moduleNumber);
  if (!quizData) return null;

  const moduleMeta = MODULE_META[moduleNumber];
  if (!moduleMeta) return null;

  // Ensure module exists in DB
  let moduleRecord = await db.module.findFirst({ where: { moduleNumber } });
  if (!moduleRecord) {
    moduleRecord = await db.module.create({
      data: {
        moduleNumber,
        title: moduleMeta.title,
        slug: moduleMeta.slug,
        description: `Module ${moduleNumber}`,
        icon: 'BookOpen',
        color: 'emerald',
        order: moduleNumber,
        isPublished: true,
        estimatedMinutes: moduleMeta.totalLessons * 10,
      },
    });
  }

  // Quiz is attached to the LAST lesson of the module (knowledge check)
  const lessonNumber = moduleMeta.totalLessons;
  const lessonSlug = `${moduleNumber}.${lessonNumber}`;

  // Ensure lesson exists
  let lessonRecord = await db.lesson.findFirst({
    where: { moduleId: moduleRecord.id, lessonNumber },
  });
  if (!lessonRecord) {
    lessonRecord = await db.lesson.create({
      data: {
        moduleId: moduleRecord.id,
        lessonNumber,
        title: `${moduleMeta.title} Knowledge Check`,
        slug: lessonSlug,
        content: '',
        type: 'QUIZ',
        xpReward: QUIZ_XP_REWARD,
        isPublished: true,
      },
    });
  } else {
    // Update type to QUIZ if it was created as READING before
    if (lessonRecord.type !== 'QUIZ') {
      await db.lesson.update({
        where: { id: lessonRecord.id },
        data: { type: 'QUIZ', xpReward: QUIZ_XP_REWARD },
      });
    }
  }

  // Check if quiz already exists for this lesson
  const existingQuiz = await db.quiz.findUnique({ where: { lessonId: lessonRecord.id } });
  if (existingQuiz) return existingQuiz.id;

  // Create quiz + questions
  const quiz = await db.quiz.create({
    data: {
      lessonId: lessonRecord.id,
      title: quizData.title,
      description: quizData.description || '',
      passThreshold: quizData.passThreshold || 70,
      timeLimitSeconds: quizData.timeLimitSeconds || null,
      isPublished: true,
      questions: {
        create: quizData.questions.map((q: any) => ({
          order: q.order,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          points: q.points || 1,
        })),
      },
    },
  });

  logger.info('Quiz seeded', { moduleNumber, quizId: quiz.id, questionCount: quizData.questions.length });
  return quiz.id;
}

// ============================================================================
// SERVER ACTION: Get Quiz
// ============================================================================

export async function getQuiz(
  moduleNumber: number,
  userId?: string
): Promise<ActionResult<QuizView>> {
  try {
    const uid = userId || await getAuthUserId();
    if (!uid) {
      return { success: false, error: 'You must be signed in to take quizzes', code: 'UNAUTHENTICATED' };
    }

    // Ensure quiz is seeded
    const quizId = await ensureQuizSeeded(moduleNumber);
    if (!quizId) {
      return { success: false, error: `No quiz available for module ${moduleNumber}`, code: 'QUIZ_NOT_FOUND' };
    }

    // Fetch quiz with questions
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });

    if (!quiz) {
      return { success: false, error: 'Quiz not found', code: 'QUIZ_NOT_FOUND' };
    }

    // Get user's best score and attempt count
    const attempts = await db.quizAttempt.findMany({
      where: { userId: uid, quizId: quiz.id, status: 'GRADED' },
      orderBy: { score: 'desc' },
    });

    const bestScore = attempts.length > 0 ? attempts[0].score : null;

    // Map questions — OMIT correctAnswer for client
    const questions: QuizQuestionView[] = quiz.questions.map((q) => ({
      id: q.id,
      order: q.order,
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      points: q.points,
    }));

    return {
      success: true,
      data: {
        quizId: quiz.id,
        lessonId: quiz.lessonId,
        title: quiz.title,
        description: quiz.description,
        passThreshold: quiz.passThreshold,
        timeLimitSeconds: quiz.timeLimitSeconds,
        questions,
        bestScore,
        attemptCount: attempts.length,
      },
    };
  } catch (error) {
    logger.error('getQuiz failed', { error: String(error) });
    return { success: false, error: 'Failed to load quiz', code: 'GET_QUIZ_FAILED' };
  }
}

// ============================================================================
// SERVER ACTION: Submit Quiz
// ============================================================================

export async function submitQuiz(
  quizId: string,
  answers: Record<number, string>,
  timeSpentSeconds: number,
  userId?: string
): Promise<ActionResult<SubmitQuizOutput>> {
  try {
    const uid = userId || await getAuthUserId();
    if (!uid) {
      return { success: false, error: 'You must be signed in to submit quizzes', code: 'UNAUTHENTICATED' };
    }

    // Fetch quiz with questions (need correctAnswer for grading)
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });

    if (!quiz) {
      return { success: false, error: 'Quiz not found', code: 'QUIZ_NOT_FOUND' };
    }

    // Determine attempt number
    const lastAttempt = await db.quizAttempt.findFirst({
      where: { userId: uid, quizId },
      orderBy: { attemptNumber: 'desc' },
    });
    const attemptNumber = (lastAttempt?.attemptNumber ?? 0) + 1;

    // Grade each question
    let correctCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedQuestions: GradedQuestion[] = [];

    for (const q of quiz.questions) {
      totalPoints += q.points;
      const selected = answers[q.order] || '';
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) {
        correctCount++;
        earnedPoints += q.points;
      }

      gradedQuestions.push({
        id: q.id,
        order: q.order,
        question: q.question,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        points: q.points,
        selectedAnswer: selected as 'A' | 'B' | 'C' | 'D',
        correctAnswer: q.correctAnswer as 'A' | 'B' | 'C' | 'D',
        isCorrect,
        explanation: q.explanation,
      });
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= quiz.passThreshold;

    // Calculate XP — only award if passed AND this is the user's first pass
    let xpEarned = 0;
    if (passed) {
      const existingPass = await db.quizAttempt.findFirst({
        where: { userId: uid, quizId, score: { gte: quiz.passThreshold } },
      });
      if (!existingPass) {
        xpEarned = QUIZ_XP_REWARD;
      }
    }

    // Create attempt record
    const attempt = await db.quizAttempt.create({
      data: {
        userId: uid,
        quizId,
        attemptNumber,
        status: 'GRADED',
        answers: JSON.stringify(answers),
        score,
        correctCount,
        totalQuestions: quiz.questions.length,
        xpEarned,
        timeSpentSeconds,
        completedAt: new Date(),
      },
    });

    // Award XP to user if earned
    if (xpEarned > 0) {
      const user = await db.user.findUnique({ where: { id: uid } });
      if (user) {
        const newXP = user.xp + xpEarned;
        const newLevel = Math.max(1, Math.floor(newXP / 500) + 1);
        await db.user.update({
          where: { id: uid },
          data: { xp: newXP, level: newLevel, lastActiveAt: new Date() },
        });
      }

      // Also mark the associated lesson as complete
      const lesson = await db.lesson.findUnique({ where: { id: quiz.lessonId } });
      if (lesson) {
        await db.lessonProgress.upsert({
          where: { userId_lessonId: { userId: uid, lessonId: lesson.id } },
          update: {
            status: 'COMPLETED',
            completedAt: new Date(),
            xpEarned: xpEarned,
          },
          create: {
            userId: uid,
            lessonId: lesson.id,
            status: 'COMPLETED',
            completedAt: new Date(),
            xpEarned: xpEarned,
          },
        });

        // Update module progress
        const moduleId = lesson.moduleId;
        const totalLessons = await db.lesson.count({ where: { moduleId } });
        const completedLessons = await db.lessonProgress.count({
          where: { userId: uid, lesson: { moduleId }, status: 'COMPLETED' },
        });
        const moduleStatus = completedLessons >= totalLessons ? 'COMPLETED' : 'IN_PROGRESS';
        const moduleScore = Math.round((completedLessons / totalLessons) * 100);

        await db.moduleProgress.upsert({
          where: { userId_moduleId: { userId: uid, moduleId } },
          update: {
            status: moduleStatus,
            score: moduleScore,
            completedAt: moduleStatus === 'COMPLETED' ? new Date() : undefined,
          },
          create: {
            userId: uid,
            moduleId,
            status: moduleStatus,
            score: moduleScore,
            startedAt: new Date(),
            completedAt: moduleStatus === 'COMPLETED' ? new Date() : null,
          },
        });
      }
    }

    // Check for badge awards (quiz ace, quiz master, perfectionist, XP milestones)
    try {
      await checkAndAwardBadges(uid);
    } catch (badgeError) {
      logger.warn('Badge check failed after quiz submission', { error: String(badgeError) });
    }

    logger.info('Quiz submitted', {
      userId: uid,
      quizId,
      attemptNumber,
      score,
      passed,
      xpEarned,
    });

    return {
      success: true,
      data: {
        attemptId: attempt.id,
        attemptNumber,
        score,
        correctCount,
        totalQuestions: quiz.questions.length,
        xpEarned,
        passed,
        gradedQuestions,
      },
    };
  } catch (error) {
    logger.error('submitQuiz failed', { error: String(error) });
    return { success: false, error: 'Failed to submit quiz', code: 'SUBMIT_QUIZ_FAILED' };
  }
}

// ============================================================================
// SERVER ACTION: Get Quiz Attempt History
// ============================================================================

export async function getQuizHistory(
  quizId: string,
  userId?: string
): Promise<ActionResult<QuizAttemptSummary[]>> {
  try {
    const uid = userId || await getAuthUserId();
    if (!uid) {
      return { success: false, error: 'You must be signed in to view quiz history', code: 'UNAUTHENTICATED' };
    }

    const quiz = await db.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      return { success: false, error: 'Quiz not found', code: 'QUIZ_NOT_FOUND' };
    }

    const attempts = await db.quizAttempt.findMany({
      where: { userId: uid, quizId },
      orderBy: { attemptNumber: 'desc' },
      take: 20,
    });

    const summaries: QuizAttemptSummary[] = attempts.map((a) => ({
      id: a.id,
      attemptNumber: a.attemptNumber,
      score: a.score,
      correctCount: a.correctCount,
      totalQuestions: a.totalQuestions,
      xpEarned: a.xpEarned,
      passed: a.score >= quiz.passThreshold,
      timeSpentSeconds: a.timeSpentSeconds,
      completedAt: a.completedAt?.toISOString() || null,
    }));

    return { success: true, data: summaries };
  } catch (error) {
    logger.error('getQuizHistory failed', { error: String(error) });
    return { success: false, error: 'Failed to load quiz history', code: 'QUIZ_HISTORY_FAILED' };
  }
}
