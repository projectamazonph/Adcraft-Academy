'use server';

/**
 * AdCraft: "Explain My Mistake" Server Action (Phase 3)
 *
 * Retrieves a graded quiz attempt, runs the mistake analysis engine,
 * and returns a structured report explaining each wrong answer.
 *
 * Integrated into quiz results screen via the "Review Answers" button.
 */

import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-guard';
import { logger } from '@/lib/logger';
import { generateMistakeReport } from '@/engine/mistake-analysis';
import { trackEvent } from './events';
import type { ActionResult } from './types';

export interface MistakeAnalysisResult {
  attemptId: string;
  quizId: string;
  title: string;
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctCount: number;
  weakAreas: { concept: string; count: number }[];
  recommendedModules: { moduleNumber: number; reason: string }[];
  mistakeAnalyses: {
    questionText: string;
    selectedLabel: string;
    correctLabel: string;
    selectedAnswerValue: string;
    correctAnswerValue: string;
    isCorrect: boolean;
    mistakeType: string | null;
    mistakeLabel: string;
    conceptTags: string[];
    suggestion: string;
  }[];
}

/**
 * Get mistake analysis for a completed quiz attempt.
 */
export async function getMistakeAnalysis(
  attemptId: string
): Promise<ActionResult<MistakeAnalysisResult>> {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { success: false, error: 'Not authenticated', code: 'UNAUTHENTICATED' };
    }

    // Fetch attempt with quiz + questions
    const attempt = await db.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: { questions: { orderBy: { order: 'asc' } } },
        },
      },
    });

    if (!attempt) {
      return { success: false, error: 'Attempt not found', code: 'NOT_FOUND' };
    }

    if (attempt.userId !== userId) {
      return { success: false, error: 'Not your attempt', code: 'FORBIDDEN' };
    }

    if (attempt.status !== 'GRADED') {
      return { success: false, error: 'Attempt not yet graded', code: 'NOT_GRADED' };
    }

    const answers = JSON.parse(attempt.answers) as Record<number, string>;

    const questionResults = attempt.quiz.questions.map((q) => {
      const selected = answers[q.order] || '';
      const isCorrect = selected === q.correctAnswer;
      return {
        question: q.question,
        selectedLabel: selected,
        selectedAnswer: selected,
        correctLabel: q.correctAnswer,
        correctAnswer: q.correctAnswer,
        options: [
          { label: 'A', text: q.optionA },
          { label: 'B', text: q.optionB },
          { label: 'C', text: q.optionC },
          { label: 'D', text: q.optionD },
        ].filter((o) => o.text),
        isCorrect,
      };
    });

    const report = generateMistakeReport({
      attemptId: attempt.id,
      quizId: attempt.quizId,
      title: attempt.quiz.title,
      score: attempt.score,
      passed: attempt.score >= attempt.quiz.passThreshold,
      questionResults,
    });

    const mistakeTypeLabels: Record<string, string> = {
      'formula-error': 'Formula Error',
      'logic-error': 'Logic Error',
      'knowledge-gap': 'Knowledge Gap',
      'misread-data': 'Misread Data',
      'careless-error': 'Careless Error',
      'confused-terms': 'Confused Terms',
      'threshold-error': 'Threshold Error',
    };

    // Track the review event
    await trackEvent('mistake_review', {
      attemptId,
      score: attempt.score,
      mistakes: report.mistakeAnalyses.filter((m) => !m.isCorrect).length,
    }).catch(() => {});

    return {
      success: true,
      data: {
        attemptId: report.attemptId,
        quizId: report.quizId,
        title: report.title,
        score: report.score,
        passed: report.passed,
        totalQuestions: report.totalQuestions,
        correctCount: report.correctCount,
        weakAreas: report.weakAreas,
        recommendedModules: report.recommendedModules,
        mistakeAnalyses: report.mistakeAnalyses.map((m) => ({
          questionText: m.questionText,
          selectedLabel: m.selectedLabel,
          correctLabel: m.correctLabel,
          selectedAnswerValue: m.selectedAnswer,
          correctAnswerValue: m.correctAnswer,
          isCorrect: m.isCorrect,
          mistakeType: m.mistakeType,
          mistakeLabel: m.mistakeType ? (mistakeTypeLabels[m.mistakeType] || m.mistakeType) : '',
          conceptTags: m.conceptTags,
          suggestion: m.suggestion,
        })),
      },
    };
  } catch (error) {
    logger.error('getMistakeAnalysis failed', { error: String(error), attemptId });
    return { success: false, error: 'Failed to analyze mistakes', code: 'ANALYSIS_FAILED' };
  }
}

/**
 * Get all graded quiz attempts for a user (to pick one for review).
 */
export async function getUserQuizAttempts(): Promise<
  ActionResult<
    {
      attemptId: string;
      quizTitle: string;
      score: number;
      passed: boolean;
      completedAt: string;
    }[]
  >
> {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { success: false, error: 'Not authenticated', code: 'UNAUTHENTICATED' };
    }

    const attempts = await db.quizAttempt.findMany({
      where: { userId, status: 'GRADED' },
      include: { quiz: { select: { title: true } } },
      orderBy: { completedAt: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: attempts.map((a) => ({
        attemptId: a.id,
        quizTitle: a.quiz.title,
        score: a.score,
        passed: a.score >= 70,
        completedAt: a.completedAt?.toISOString() || '',
      })),
    };
  } catch (error) {
    logger.error('getUserQuizAttempts failed', { error: String(error) });
    return { success: false, error: 'Failed to load attempts', code: 'LOAD_FAILED' };
  }
}
