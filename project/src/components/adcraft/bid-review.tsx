'use client';

import { motion } from 'framer-motion';
import {
  Trophy,
  Target,
  Zap,
  RotateCcw,
  ArrowLeft,
  TrendingUp,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBidElevatorStore } from '@/stores/bid-elevator-store';
import { cn } from '@/lib/utils';

export function BidReview({ onBack }: { onBack: () => void }) {
  const { evaluation, resetSimulation } = useBidElevatorStore();

  if (!evaluation) return null;

  const score = evaluation.score;
  const xpEarned = score * 2;
  const acceptableCount = evaluation.decisionEvaluations.filter(
    (e) => e.isAcceptable
  ).length;
  const totalScenarios = evaluation.decisionEvaluations.length;
  const accuracy = Math.round(
    evaluation.decisionEvaluations.reduce((sum, e) => sum + e.accuracy, 0) / totalScenarios
  );
  const avgDecisionTime = (evaluation.averageDecisionTimeMs / 1000).toFixed(1);

  const grade =
    score >= 90
      ? { label: 'Outstanding', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
      : score >= 70
      ? { label: 'Good', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' }
      : score >= 50
      ? { label: 'Decent', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' }
      : { label: 'Needs Work', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Main summary card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.5 }}
      >
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card to-card overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />

          <CardContent className="relative py-8 flex flex-col items-center gap-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-400" />
              <h2 className="text-2xl font-bold">Simulation Complete</h2>
            </div>

            {/* Big score */}
            <div className={cn('px-6 py-3 rounded-xl border', grade.bg)}>
              <p className={cn('text-5xl font-bold font-mono', grade.color)}>
                {score}
              </p>
              <p className={cn('text-sm font-medium mt-1', grade.color)}>
                {grade.label}
              </p>
            </div>

            {/* XP badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-lg font-bold font-mono text-amber-400">
                +{xpEarned}
              </span>
              <span className="text-xs text-amber-400/80">XP Earned</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3"
      >
        <Card>
          <CardContent className="py-4 flex flex-col items-center gap-1">
            <Target className="h-4 w-4 text-amber-400 mb-1" />
            <p className="text-2xl font-bold font-mono">{accuracy}%</p>
            <p className="text-xs text-muted-foreground">Avg Accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 flex flex-col items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 mb-1" />
            <p className="text-2xl font-bold font-mono">
              {acceptableCount}/{totalScenarios}
            </p>
            <p className="text-xs text-muted-foreground">Bids Acceptable</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 flex flex-col items-center gap-1">
            <Clock className="h-4 w-4 text-sky-400 mb-1" />
            <p className="text-2xl font-bold font-mono text-sky-400">
              {avgDecisionTime}s
            </p>
            <p className="text-xs text-muted-foreground">Avg Decision Time</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 flex flex-col items-center gap-1">
            <Zap className="h-4 w-4 text-amber-400 mb-1" />
            <p className="text-2xl font-bold font-mono text-amber-400">
              {xpEarned}
            </p>
            <p className="text-xs text-muted-foreground">Total XP</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-3 pb-8"
      >
        <Button
          variant="outline"
          size="lg"
          className="flex-1 gap-2"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Simulations
        </Button>
        <Button
          size="lg"
          className="flex-1 gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
          onClick={() => {
            resetSimulation();
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
      </motion.div>
    </div>
  );
}
