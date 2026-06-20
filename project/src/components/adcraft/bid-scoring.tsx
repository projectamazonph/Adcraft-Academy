'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBidElevatorStore } from '@/stores/bid-elevator-store';
import { cn } from '@/lib/utils';
import type { BidDecisionEvaluation } from '@/engine';

// ---------------------------------------------------------------------------
// Animated score circle (same as STR but amber-themed)
// ---------------------------------------------------------------------------

function ScoreCircle({ score }: { score: number }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let frame: number;
    const duration = 1500;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayScore / 100) * circumference;

  const scoreColor =
    displayScore >= 80
      ? 'text-emerald-400'
      : displayScore >= 50
      ? 'text-amber-400'
      : 'text-rose-400';

  const strokeColor =
    displayScore >= 80
      ? '#34d399'
      : displayScore >= 50
      ? '#fbbf24'
      : '#fb7185';

  return (
    <div className="relative w-44 h-44 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/20"
        />
        <motion.circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], ease: [0.33, 1, 0.68, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-4xl font-bold font-mono', scoreColor)}>
          {displayScore}
        </span>
        <span className="text-xs text-muted-foreground">out of 100</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Decision evaluation row
// ---------------------------------------------------------------------------

function DecisionRow({
  evaluation,
  scenarioKeyword,
}: {
  evaluation: BidDecisionEvaluation;
  scenarioKeyword: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const StatusIcon = evaluation.isAcceptable ? CheckCircle2 : XCircle;
  const statusColor = evaluation.isAcceptable ? 'text-emerald-400' : 'text-rose-400';
  const rowBg = evaluation.isAcceptable
    ? 'bg-emerald-500/5 border-emerald-500/15'
    : evaluation.accuracy >= 40
    ? 'bg-amber-500/5 border-amber-500/15'
    : 'bg-rose-500/5 border-rose-500/15';

  return (
    <div className={cn('rounded-lg border p-3', rowBg)}>
      <div className="flex items-center gap-3">
        <StatusIcon className={cn('h-4 w-4 shrink-0', statusColor)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">&ldquo;{scenarioKeyword}&rdquo;</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              'text-[10px]',
              evaluation.isAcceptable
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : evaluation.accuracy >= 40
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            )}
          >
            {evaluation.points}/{evaluation.maxPoints} pts
          </Badge>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-muted/30 transition-colors"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Bid comparison */}
      <div className="flex items-center gap-3 mt-2 text-xs">
        <span className="text-muted-foreground">
          Your bid: <span className="font-mono font-medium text-foreground">${evaluation.userBid.toFixed(2)}</span>
        </span>
        <span className="text-muted-foreground">→</span>
        <span className="text-muted-foreground">
          Optimal: <span className="font-mono font-medium text-foreground">${evaluation.optimalBid.toFixed(2)}</span>
        </span>
        <span className="text-muted-foreground">·</span>
        <span className={cn('font-mono', statusColor)}>
          {evaluation.accuracy}% accuracy
        </span>
      </div>

      {/* Expandable feedback */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {evaluation.feedback}
              </p>
              {/* Projected metrics comparison */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-muted/30 text-center">
                  <p className="text-[10px] text-muted-foreground">Your Projected ACoS</p>
                  <p className={cn(
                    'text-sm font-mono font-semibold',
                    evaluation.projectedMetrics.acos <= 0.25 ? 'text-emerald-400' : 'text-rose-400'
                  )}>
                    {(evaluation.projectedMetrics.acos * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 rounded bg-muted/30 text-center">
                  <p className="text-[10px] text-muted-foreground">Optimal ACoS</p>
                  <p className={cn(
                    'text-sm font-mono font-semibold',
                    evaluation.optimalMetrics.acos <= 0.25 ? 'text-emerald-400' : 'text-amber-400'
                  )}>
                    {(evaluation.optimalMetrics.acos * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main scoring view
// ---------------------------------------------------------------------------

export function BidScoring() {
  const { evaluation, scenarios, goToReview } = useBidElevatorStore();

  if (!evaluation) return null;

  const acceptableCount = evaluation.decisionEvaluations.filter(
    (e) => e.isAcceptable
  ).length;
  const totalCount = evaluation.decisionEvaluations.length;
  const avgAccuracy = Math.round(
    evaluation.decisionEvaluations.reduce((sum, e) => sum + e.accuracy, 0) / totalCount
  );
  const avgDecisionTime = evaluation.averageDecisionTimeMs;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Score reveal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.5 }}
      >
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card to-card">
          <CardContent className="py-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <h2 className="text-xl font-bold">Bidding Results</h2>
            </div>
            <ScoreCircle score={evaluation.score} />
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {evaluation.feedback}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                <span className="font-semibold text-emerald-400">{acceptableCount}</span> acceptable
              </span>
              <span>·</span>
              <span>
                <span className="font-semibold text-amber-400">{avgAccuracy}%</span> avg accuracy
              </span>
              <span>·</span>
              <span>
                <span className="font-semibold text-sky-400">{(avgDecisionTime / 1000).toFixed(1)}s</span> avg decision time
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Per-scenario evaluations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-400" />
              Bid Breakdown
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Click on each scenario to see detailed feedback and projected metrics
            </p>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {evaluation.decisionEvaluations.map((ev) => {
              const scenario = scenarios.find((s) => s.id === ev.scenarioId);
              return (
                <DecisionRow
                  key={ev.scenarioId}
                  evaluation={ev}
                  scenarioKeyword={scenario?.keyword ?? ev.scenarioId}
                />
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Continue button */}
      <div className="flex justify-end pb-8">
        <Button
          size="lg"
          className="gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
          onClick={goToReview}
        >
          View Summary
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
