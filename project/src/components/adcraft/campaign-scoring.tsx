'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Target,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCampaignBuilderStore } from '@/stores/campaign-builder-store';
import { cn } from '@/lib/utils';
import type { CriterionResult } from '@/engine';

// ---------------------------------------------------------------------------
// Animated score circle (emerald-themed)
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
// Criterion card
// ---------------------------------------------------------------------------

function CriterionCard({ result, index }: { result: CriterionResult; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const scoreColor =
    result.score >= 70
      ? 'text-emerald-400'
      : result.score >= 40
      ? 'text-amber-400'
      : 'text-rose-400';

  const scoreBg =
    result.score >= 70
      ? 'bg-emerald-500/5 border-emerald-500/15'
      : result.score >= 40
      ? 'bg-amber-500/5 border-amber-500/15'
      : 'bg-rose-500/5 border-rose-500/15';

  const scoreBarColor =
    result.score >= 70
      ? 'bg-emerald-400'
      : result.score >= 40
      ? 'bg-amber-400'
      : 'bg-rose-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
    >
      <div className={cn('rounded-lg border p-3', scoreBg)}>
        <div className="flex items-center gap-3">
          {result.passed ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{result.criterionId}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className={cn(
                'text-[10px]',
                result.passed
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              )}
            >
              {result.passed ? 'Passed' : 'Failed'}
            </Badge>
            <span className={cn('text-sm font-bold font-mono', scoreColor)}>
              {result.score}
            </span>
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

        {/* Score bar */}
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
          <motion.div
            className={cn('h-full rounded-full', scoreBarColor)}
            initial={{ width: 0 }}
            animate={{ width: `${result.score}%` }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.5 + index * 0.1 }}
          />
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
                  {result.feedback}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main scoring view
// ---------------------------------------------------------------------------

export function CampaignScoring() {
  const { evaluation, goToReview, evaluationCriteria } = useCampaignBuilderStore();

  if (!evaluation) return null;

  const { totalScore, criteriaResults, projectedMetrics, feedback } = evaluation;

  const passedCount = criteriaResults.filter((r) => r.passed).length;
  const totalCount = criteriaResults.length;

  // Map criterionId to readable name from evaluationCriteria
  const criterionNameMap: Record<string, string> = {};
  evaluationCriteria.forEach((c: { criterionId: string; name: string }) => {
    criterionNameMap[c.criterionId] = c.name;
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Score reveal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.5 }}
      >
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-card">
          <CardContent className="py-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-emerald-400" />
              <h2 className="text-xl font-bold">Campaign Results</h2>
            </div>
            <ScoreCircle score={totalScore} />
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {feedback}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                <span className="font-semibold text-emerald-400">{passedCount}</span> criteria passed
              </span>
              <span>·</span>
              <span>
                <span className="font-semibold text-rose-400">{totalCount - passedCount}</span> criteria failed
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Criteria breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-400" />
              Criteria Breakdown
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Click on each criterion to see detailed feedback
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {criteriaResults.map((result, i) => (
              <CriterionCard
                key={result.criterionId}
                result={{ ...result, criterionId: criterionNameMap[result.criterionId] || result.criterionId }}
                index={i}
              />
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Projected metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-400" />
              Projected Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                <p className="text-xs text-muted-foreground mb-1">Impressions</p>
                <p className="text-lg font-bold font-mono">{projectedMetrics.impressions.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                <p className="text-xs text-muted-foreground mb-1">Clicks</p>
                <p className="text-lg font-bold font-mono">{projectedMetrics.clicks.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                <p className="text-xs text-muted-foreground mb-1">CTR</p>
                <p className="text-lg font-bold font-mono">{(projectedMetrics.ctr * 100).toFixed(2)}%</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                <p className="text-xs text-muted-foreground mb-1">Avg CPC</p>
                <p className="text-lg font-bold font-mono">${projectedMetrics.cpc.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                <p className="text-xs text-muted-foreground mb-1">ACoS</p>
                <p className={cn(
                  'text-lg font-bold font-mono',
                  projectedMetrics.acos <= 0.25 ? 'text-emerald-400' : 'text-rose-400'
                )}>
                  {(projectedMetrics.acos * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                <p className="text-xs text-muted-foreground mb-1">RoAS</p>
                <p className={cn(
                  'text-lg font-bold font-mono',
                  projectedMetrics.roas >= 3 ? 'text-emerald-400' : 'text-amber-400'
                )}>
                  {projectedMetrics.roas.toFixed(2)}x
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Continue button */}
      <div className="flex justify-end pb-8">
        <Button
          size="lg"
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          onClick={goToReview}
        >
          View Summary
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
