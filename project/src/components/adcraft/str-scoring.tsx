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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useStrTriageStore, EXPECTED_ACTIONS } from '@/stores/str-triage-store';
import { cn } from '@/lib/utils';
import type { StrActionEvaluation } from '@/engine';

// ---------------------------------------------------------------------------
// Animated score circle
// ---------------------------------------------------------------------------

function ScoreCircle({ score }: { score: number }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let frame: number;
    const duration = 1500; // ms
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
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

  // Color gradient based on score
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
        {/* Background circle */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/20"
        />
        {/* Progress circle */}
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
// Metric delta
// ---------------------------------------------------------------------------

function MetricDelta({
  label,
  before,
  after,
  format,
  lowerIsBetter = true,
}: {
  label: string;
  before: number;
  after: number;
  format: (v: number) => string;
  lowerIsBetter?: boolean;
}) {
  const improved = lowerIsBetter ? after < before : after > before;
  const delta = after - before;
  const Icon = improved ? TrendingDown : TrendingUp;

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground">
          {format(before)}
        </span>
        <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
        <span
          className={cn(
            'text-xs font-mono font-semibold',
            improved ? 'text-emerald-400' : 'text-rose-400'
          )}
        >
          {format(after)}
        </span>
        <Icon
          className={cn(
            'h-3 w-3',
            improved ? 'text-emerald-400' : 'text-rose-400'
          )}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action evaluation row
// ---------------------------------------------------------------------------

function EvalRow({ evaluation, searchTerms }: { evaluation: StrActionEvaluation; searchTerms: { id: string; searchTerm: string; acos: number; roas: number }[] }) {
  const [expanded, setExpanded] = useState(false);
  const term = searchTerms.find((s) => s.id === evaluation.searchTermId);

  const statusIcon = evaluation.isCorrect
    ? CheckCircle2
    : evaluation.isPartiallyCorrect
    ? AlertCircle
    : XCircle;

  const statusColor = evaluation.isCorrect
    ? 'text-emerald-400'
    : evaluation.isPartiallyCorrect
    ? 'text-amber-400'
    : 'text-rose-400';

  const rowBg = evaluation.isCorrect
    ? 'bg-emerald-500/5 border-emerald-500/15'
    : evaluation.isPartiallyCorrect
    ? 'bg-amber-500/5 border-amber-500/15'
    : 'bg-rose-500/5 border-rose-500/15';

  const StatusIcon = statusIcon;

  const actionLabels: Record<string, string> = {
    keep: 'Keep',
    pause: 'Pause',
    'negate-exact': 'Negate Exact',
    'negate-phrase': 'Negate Phrase',
    'optimize-bid': 'Optimize Bid',
  };

  return (
    <div className={cn('rounded-lg border p-3', rowBg)}>
      <div className="flex items-center gap-3">
        <StatusIcon className={cn('h-4 w-4 shrink-0', statusColor)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">
            {term?.searchTerm ?? evaluation.searchTermId}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              'text-[10px]',
              evaluation.isCorrect
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : evaluation.isPartiallyCorrect
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

      {/* Actions summary */}
      <div className="flex items-center gap-3 mt-2 text-xs">
        <span className="text-muted-foreground">
          Your action:{' '}
          <span className="font-medium text-foreground">
            {actionLabels[evaluation.userAction] ?? evaluation.userAction}
          </span>
        </span>
        <span className="text-muted-foreground">→</span>
        <span className="text-muted-foreground">
          Recommended:{' '}
          <span className="font-medium text-foreground">
            {actionLabels[evaluation.expectedAction] ?? evaluation.expectedAction}
          </span>
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

export function StrScoring() {
  const { evaluation, searchTerms, goToReview } = useStrTriageStore();

  const formatAcos = useCallback((v: number) => {
    if (!isFinite(v)) return '∞';
    return `${(v * 100).toFixed(1)}%`;
  }, []);

  const formatRoas = useCallback((v: number) => {
    if (!isFinite(v)) return '∞';
    return `${v.toFixed(2)}x`;
  }, []);

  const formatCurrency = useCallback((v: number) => `$${v.toFixed(2)}`, []);

  if (!evaluation) return null;

  const searchTermSummaries = searchTerms.map((st) => ({
    id: st.id,
    searchTerm: st.searchTerm,
    acos: st.acos,
    roas: st.roas,
  }));

  const correctCount = evaluation.actionEvaluations.filter(
    (e) => e.isCorrect
  ).length;
  const partialCount = evaluation.actionEvaluations.filter(
    (e) => e.isPartiallyCorrect
  ).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Score reveal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.5 }}
      >
        <Card className="border-rose-500/20 bg-gradient-to-br from-rose-500/5 via-card to-card">
          <CardContent className="py-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-rose-400" />
              <h2 className="text-xl font-bold">Simulation Results</h2>
            </div>
            <ScoreCircle score={evaluation.score} />
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {evaluation.feedback}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                <span className="font-semibold text-emerald-400">{correctCount}</span> correct
              </span>
              <span>·</span>
              <span>
                <span className="font-semibold text-amber-400">{partialCount}</span> partial
              </span>
              <span>·</span>
              <span>
                <span className="font-semibold text-rose-400">
                  {evaluation.actionEvaluations.length - correctCount - partialCount}
                </span>{' '}
                incorrect
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Before / After metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Portfolio Metrics — Before vs. After
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MetricDelta
              label="ACoS"
              before={evaluation.metricsBefore.acos}
              after={evaluation.metricsAfter.acos}
              format={formatAcos}
              lowerIsBetter
            />
            <MetricDelta
              label="ROAS"
              before={evaluation.metricsBefore.roas}
              after={evaluation.metricsAfter.roas}
              format={formatRoas}
              lowerIsBetter={false}
            />
            <MetricDelta
              label="Spend"
              before={evaluation.metricsBefore.spend}
              after={evaluation.metricsAfter.spend}
              format={formatCurrency}
              lowerIsBetter
            />
            <MetricDelta
              label="Sales"
              before={evaluation.metricsBefore.sales}
              after={evaluation.metricsAfter.sales}
              format={formatCurrency}
              lowerIsBetter={false}
            />
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-muted-foreground">
                Improvement Score
              </span>
              <span className="text-sm font-semibold font-mono text-emerald-400">
                +{evaluation.improvementScore}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Per-term evaluations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Search Term Breakdown
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Click on each term to see detailed feedback
            </p>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {evaluation.actionEvaluations.map((ev) => (
              <EvalRow
                key={ev.searchTermId}
                evaluation={ev}
                searchTerms={searchTermSummaries}
              />
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Continue button */}
      <div className="flex justify-end pb-8">
        <Button
          size="lg"
          className="gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
          onClick={goToReview}
        >
          View Summary
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
