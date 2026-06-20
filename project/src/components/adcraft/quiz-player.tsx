'use client';

/**
 * AdCraft: Quiz Player Component (Post-MVP: Atomic Build A4)
 *
 * Interactive quiz interface with:
 * - Step-by-step question navigation
 * - Answer selection with visual feedback
 * - Timer (optional, per quiz config)
 * - Results screen with per-question explanations
 * - XP award animation on pass
 * - Retry capability
 * - History of past attempts
 *
 * Phases: loading → ready → answering → submitted
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  RotateCcw,
  Loader2,
  Trophy,
  Target,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getMistakeAnalysis } from '@/app/actions/mistake-analysis';
import { MistakeReplay } from '@/components/adcraft/mistake-replay';
import type { MistakeAnalysisResult } from '@/app/actions/mistake-analysis';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { getQuiz, submitQuiz, getQuizHistory } from '@/app/actions/quiz';
import type {
  QuizView,
  QuizQuestionView,
  GradedQuestion,
  QuizAttemptSummary,
} from '@/app/actions/types';

// ============================================================================
// Types
// ============================================================================

type Phase = 'loading' | 'ready' | 'answering' | 'submitted';

interface QuizPlayerProps {
  moduleNumber: number;
  onBack: () => void;
  onComplete: (moduleNumber: number, xpEarned: number) => void;
}

// ============================================================================
// Component
// ============================================================================

export function QuizPlayer({ moduleNumber, onBack, onComplete }: QuizPlayerProps) {
  // Core state
  const [phase, setPhase] = useState<Phase>('loading');
  const [quiz, setQuiz] = useState<QuizView | null>(null);
  const [currentQ, setCurrentQ] = useState(0); // 0-based index
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [result, setResult] = useState<GradedQuestion[] | null>(null);
  const [submitData, setSubmitData] = useState<{
    score: number;
    correctCount: number;
    totalQuestions: number;
    xpEarned: number;
    passed: boolean;
    attemptNumber: number;
    attemptId: string;
  } | null>(null);
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<QuizAttemptSummary[]>([]);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load quiz on mount
  useEffect(() => {
    loadQuiz();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [moduleNumber]);

  const loadQuiz = useCallback(async () => {
    setPhase('loading');
    setError(null);
    const res = await getQuiz(moduleNumber);
    if (res.success) {
      setQuiz(res.data);
      // Load history
      const histRes = await getQuizHistory(res.data.quizId);
      if (histRes.success) setHistory(histRes.data);
      setPhase(res.data.bestScore !== null ? 'ready' : 'ready');
    } else {
      setError(res.error);
      setPhase('ready'); // Show error state
    }
  }, [moduleNumber]);

  // Start answering (reset state)
  const startQuiz = useCallback(() => {
    if (!quiz) return;
    setCurrentQ(0);
    setAnswers({});
    setResult(null);
    setSubmitData(null);
    setElapsedSeconds(0);
    setPhase('answering');

    // Start timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, [quiz]);

  // Select answer for current question
  const selectAnswer = useCallback((option: 'A' | 'B' | 'C' | 'D') => {
    if (!quiz) return;
    const questionOrder = quiz.questions[currentQ].order;
    setAnswers((prev) => ({ ...prev, [questionOrder]: option }));
  }, [quiz, currentQ]);

  // Navigate to next question
  const nextQuestion = useCallback(() => {
    if (!quiz) return;
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ((prev) => prev + 1);
    }
  }, [quiz, currentQ]);

  // Navigate to previous question
  const prevQuestion = useCallback(() => {
    if (currentQ > 0) {
      setCurrentQ((prev) => prev - 1);
    }
  }, [currentQ]);

  // Submit quiz
  const handleSubmit = useCallback(async () => {
    if (!quiz || saving) return;

    // Stop timer
    if (timerRef.current) clearInterval(timerRef.current);

    setSaving(true);
    try {
      const res = await submitQuiz(quiz.quizId, answers, elapsedSeconds);
      if (res.success) {
        setResult(res.data.gradedQuestions);
        setSubmitData({
          score: res.data.score,
          correctCount: res.data.correctCount,
          totalQuestions: res.data.totalQuestions,
          xpEarned: res.data.xpEarned,
          passed: res.data.passed,
          attemptId: res.data.attemptId,
          attemptNumber: res.data.attemptNumber,
        });
        setPhase('submitted');

        // Notify parent of XP earned
        if (res.data.xpEarned > 0) {
          onComplete(moduleNumber, res.data.xpEarned);
        }

        // Refresh history
        const histRes = await getQuizHistory(quiz.quizId);
        if (histRes.success) setHistory(histRes.data);
      } else {
        setError(res.error);
      }
    } finally {
      setSaving(false);
    }
  }, [quiz, answers, elapsedSeconds, saving, moduleNumber, onComplete]);

  // Retry quiz
  const handleRetry = useCallback(() => {
    startQuiz();
  const handleReviewMistakes = useCallback(async (attemptId: string) => {
    setLoadingMistakeAnalysis(true);
    try {
      const result = await getMistakeAnalysis(attemptId);
      if (result.success && result.data) {
        setMistakeAnalysis(result.data);
        setShowMistakeReview(true);
      }
    } finally {
      setLoadingMistakeAnalysis(false);
    }
  }, []);
  }, [startQuiz]);

  // Format seconds as mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Count answered questions
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz?.questions.length ?? 0;
  const allAnswered = answeredCount === totalQuestions;
  const currentQuestion = quiz?.questions[currentQ];
  const currentAnswer = currentQuestion ? answers[currentQuestion.order] : undefined;

  // ========================================================================
  // RENDER: Loading
  // ========================================================================
  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading quiz...</span>
      </div>
    );
  }

  // ========================================================================
  // RENDER: Error
  // ========================================================================
  if (error && !quiz) {
    return (
      <div className="text-center py-20 space-y-4">
        <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/40" />
        <p className="text-muted-foreground">No quiz available for this module yet</p>
        <Button variant="outline" size="sm" onClick={onBack}>
          Back to Modules
        </Button>
      </div>
    );
  }

  if (!quiz) return null;

  // ========================================================================
  // RENDER: Ready (before starting / after viewing results)
  // ========================================================================
  if (phase === 'ready') {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back to Modules
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.4 }}
        >
          <Card className="border-primary/20 overflow-hidden">
            <div className="bg-gradient-to-br from-primary/8 via-card to-card px-6 py-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                <Target className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">{quiz.title}</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                {quiz.description}
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <HelpCircle className="h-3 w-3" />
                  {quiz.questions.length} questions
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {quiz.passThreshold}% to pass
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-400" />
                  {QUIZ_XP_REWARD} XP on pass
                </span>
              </div>
            </div>

            {quiz.bestScore !== null && (
              <div className="px-6 py-3 bg-muted/20 border-b border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Your best score</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      quiz.bestScore >= quiz.passThreshold
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    )}
                  >
                    {quiz.bestScore}%
                  </Badge>
                </div>
              </div>
            )}

            {history.length > 0 && (
              <div className="px-6 py-3 border-b border-border">
                <p className="text-xs text-muted-foreground mb-2">Previous attempts</p>
                <div className="flex gap-2 flex-wrap">
                  {history.slice(0, 5).map((h) => (
                    <Badge
                      key={h.id}
                      variant="outline"
                      className={cn(
                        'text-[10px]',
                        h.passed
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      )}
                    >
                      Attempt {h.attemptNumber}: {h.score}%
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="px-6 py-4 flex justify-center">
              <Button size="lg" className="gap-2 px-8" onClick={startQuiz}>
                {quiz.bestScore !== null ? 'Retake Quiz' : 'Start Quiz'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ========================================================================
  // RENDER: Answering (active quiz)
  // ========================================================================
  if (phase === 'answering' && currentQuestion) {
    const progressPercent = Math.round(((currentQ + 1) / totalQuestions) * 100);

    return (
      <div className="space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Exit Quiz
          </Button>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Clock className="h-3 w-3" />
              {formatTime(elapsedSeconds)}
            </Badge>
            <Badge variant="outline" className="gap-1 text-[10px]">
              {answeredCount}/{totalQuestions} answered
            </Badge>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Question {currentQ + 1} of {totalQuestions}</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Question text */}
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    Question {currentQuestion.order}
                  </span>
                  <h3 className="text-base font-semibold mt-1 leading-relaxed">
                    {currentQuestion.question}
                  </h3>
                </div>

                {/* Options */}
                <div className="space-y-2.5">
                  {(['A', 'B', 'C', 'D'] as const).map((option) => {
                    const optionText = currentQuestion[`option${option}` as keyof QuizQuestionView] as string;
                    if (!optionText) return null; // Skip empty option D

                    const isSelected = currentAnswer === option;

                    return (
                      <button
                        key={option}
                        onClick={() => selectAnswer(option)}
                        className={cn(
                          'w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all',
                          isSelected
                            ? 'border-primary/40 bg-primary/8 ring-1 ring-primary/20'
                            : 'border-border bg-card hover:bg-muted/30 hover:border-muted-foreground/20'
                        )}
                      >
                        <span
                          className={cn(
                            'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors',
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted/50 text-muted-foreground border-border'
                          )}
                        >
                          {option}
                        </span>
                        <span className="text-sm pt-0.5 leading-relaxed">{optionText}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={prevQuestion}
            disabled={currentQ === 0}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {/* Question dots */}
            <div className="flex gap-1">
              {quiz.questions.map((q, i) => {
                const isAnswered = answers[q.order] !== undefined;
                const isCurrent = i === currentQ;
                return (
                  <button
                    key={q.order}
                    onClick={() => setCurrentQ(i)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      isCurrent
                        ? 'bg-primary'
                        : isAnswered
                        ? 'bg-emerald-400'
                        : 'bg-muted-foreground/30'
                    )}
                  />
                );
              })}
            </div>
          </div>

          {currentQ < totalQuestions - 1 ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={nextQuestion}
              disabled={currentQ === totalQuestions - 1}
            >
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              className="gap-2"
              onClick={handleSubmit}
              disabled={!allAnswered || saving}
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {saving ? 'Grading...' : 'Submit Quiz'}
            </Button>
          )}
        </div>

        {/* Submit button (always visible when all answered, not on last Q) */}
        {allAnswered && currentQ < totalQuestions - 1 && (
          <div className="flex justify-center pt-2">
            <Button size="sm" className="gap-2" onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {saving ? 'Grading...' : 'Submit Quiz Early'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ========================================================================
  // RENDER: Submitted (results)
  // ========================================================================
  if (phase === 'submitted' && submitData && result) {
    const scoreColor = submitData.passed ? 'text-emerald-400' : 'text-amber-400';
    const scoreBg = submitData.passed ? 'bg-emerald-500/10' : 'bg-amber-500/10';
    const scoreBorder = submitData.passed ? 'border-emerald-500/20' : 'border-amber-500/20';

    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back to Modules
        </Button>

        {/* Score hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], type: 'spring' }}
        >
          <Card className={cn('overflow-hidden', scoreBorder)}>
            <div className={cn('px-6 py-8 text-center', scoreBg)}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border mb-4"
                style={{ borderColor: submitData.passed ? 'rgb(52 211 153 / 0.3)' : 'rgb(251 191 36 / 0.3)' }}
              >
                {submitData.passed ? (
                  <Trophy className="h-8 w-8 text-emerald-400" />
                ) : (
                  <Target className="h-8 w-8 text-amber-400" />
                )}
              </div>

              <div className={cn('text-4xl font-bold mb-1', scoreColor)}>
                {submitData.score}%
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {submitData.correctCount} of {submitData.totalQuestions} correct
                {submitData.passed ? ' — You passed!' : ` — Need ${quiz.passThreshold}% to pass`}
              </p>

              {submitData.xpEarned > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Badge className="gap-1 bg-amber-500/15 text-amber-400 border-amber-500/20 text-sm px-3 py-1">
                    <Zap className="h-4 w-4" />
                    +{submitData.xpEarned} XP Earned!
                  </Badge>
                </motion.div>
              )}

              <p className="text-[10px] text-muted-foreground/60 mt-3">
                Attempt #{submitData.attemptNumber} • {formatTime(elapsedSeconds)}
              </p>
            </div>

            {/* Action buttons */}
            <div className="px-6 py-4 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleRetry}>
                <RotateCcw className="h-3.5 w-3.5" />
                {submitData.passed ? 'Retake Quiz' : 'Try Again'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => handleReviewMistakes(submitData.attemptId)}
                disabled={loadingMistakeAnalysis}
              >
                {loadingMistakeAnalysis ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <HelpCircle className="h-3.5 w-3.5" />
                )}
                Review Answers
              </Button>
              {!submitData.passed && (
                <Button size="sm" className="gap-2" onClick={onBack}>
                  Review Lessons
                </Button>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Per-question breakdown */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Question Breakdown</h3>
          {result.map((gq, i) => (
            <motion.div
              key={gq.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={cn(
                'overflow-hidden',
                gq.isCorrect ? 'border-emerald-500/20' : 'border-red-500/20'
              )}>
                <CardContent className="p-4 space-y-3">
                  {/* Question header */}
                  <div className="flex items-start gap-2">
                    {gq.isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-relaxed">{gq.question}</p>
                    </div>
                  </div>

                  {/* Your answer vs correct answer */}
                  <div className="ml-6 space-y-1.5 text-xs">
                    {!gq.isCorrect && (
                      <div className="flex items-center gap-2 text-red-400">
                        <span className="font-mono bg-red-500/10 px-1.5 py-0.5 rounded">
                          {gq.selectedAnswer}
                        </span>
                        <span>
                          {gq[`option${gq.selectedAnswer}` as keyof GradedQuestion] as string}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-emerald-400">
                      <span className="font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {gq.correctAnswer}
                      </span>
                      <span>
                        {gq[`option${gq.correctAnswer}` as keyof GradedQuestion] as string}
                      </span>
                    </div>
                  </div>

                  {/* Explanation */}
                  {gq.explanation && (
                    <div className="ml-6 p-2.5 rounded-lg bg-muted/30 text-xs text-muted-foreground leading-relaxed">
                      {gq.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showMistakeReview && mistakeAnalysis && (
          <MistakeReplay
            analysis={mistakeAnalysis}
            onClose={() => setShowMistakeReview(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// Constants exposed for UI
// ============================================================================

const QUIZ_XP_REWARD = 100;
