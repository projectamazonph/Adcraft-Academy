'use client';

import { motion } from 'framer-motion';
import {
  Trophy,
  Target,
  Zap,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Layout,
  Lightbulb,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCampaignBuilderStore } from '@/stores/campaign-builder-store';
import { cn } from '@/lib/utils';
import type { CriterionResult } from '@/engine';

// ---------------------------------------------------------------------------
// Campaign structure summary
// ---------------------------------------------------------------------------

const campaignTypeLabels: Record<string, string> = {
  'sponsored-products': 'Sponsored Products',
  'sponsored-brands': 'Sponsored Brands',
  'sponsored-display': 'Sponsored Display',
};

const targetingTypeLabels: Record<string, string> = {
  manual: 'Manual',
  auto: 'Auto',
};

const bidStrategyLabels: Record<string, string> = {
  'dynamic-up-down': 'Dynamic Up & Down',
  'dynamic-up-only': 'Dynamic Up Only',
  legacy: 'Legacy (Fixed)',
};

const matchTypeLabels: Record<string, string> = {
  broad: 'Broad',
  phrase: 'Phrase',
  exact: 'Exact',
};

// ---------------------------------------------------------------------------
// Grade helper
// ---------------------------------------------------------------------------

function getGrade(score: number) {
  if (score >= 90)
    return { label: 'A', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
  if (score >= 80)
    return { label: 'B', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' };
  if (score >= 70)
    return { label: 'C', color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' };
  if (score >= 50)
    return { label: 'D', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
  return { label: 'F', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' };
}

// ---------------------------------------------------------------------------
// Review component
// ---------------------------------------------------------------------------

export function CampaignReview({ onBack }: { onBack: () => void }) {
  const { evaluation, campaign, referenceCampaigns, evaluationCriteria, resetSimulation } =
    useCampaignBuilderStore();

  if (!evaluation) return null;

  const { totalScore, criteriaResults } = evaluation;
  const grade = getGrade(totalScore);
  const xpEarned = totalScore * 5;

  const positiveKeywords = campaign.keywords.filter((k) => !k.isNegative);
  const negativeKeywords = campaign.keywords.filter((k) => k.isNegative);

  // Map criterionId to name
  const criterionNameMap: Record<string, string> = {};
  evaluationCriteria.forEach((c: { criterionId: string; name: string }) => {
    criterionNameMap[c.criterionId] = c.name;
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Main summary card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.5 }}
      >
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-card overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />

          <CardContent className="relative py-8 flex flex-col items-center gap-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-emerald-400" />
              <h2 className="text-2xl font-bold">Simulation Complete</h2>
            </div>

            {/* Grade + Score */}
            <div className="flex items-center gap-6">
              <div className={cn('px-5 py-3 rounded-xl border text-center', grade.bg)}>
                <p className={cn('text-4xl font-bold font-mono', grade.color)}>
                  {grade.label}
                </p>
                <p className={cn('text-xs font-medium mt-0.5', grade.color)}>Grade</p>
              </div>
              <div className="px-5 py-3 rounded-xl border bg-muted/20 border-border text-center">
                <p className="text-4xl font-bold font-mono">{totalScore}</p>
                <p className="text-xs font-medium mt-0.5 text-muted-foreground">Score</p>
              </div>
            </div>

            {/* XP badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span className="text-lg font-bold font-mono text-emerald-400">
                +{xpEarned}
              </span>
              <span className="text-xs text-emerald-400/80">XP Earned</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Criteria summary table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-400" />
              Criteria Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {criteriaResults.map((result) => {
                const name = criterionNameMap[result.criterionId] || result.criterionId;
                const scoreColor =
                  result.score >= 70
                    ? 'text-emerald-400'
                    : result.score >= 40
                    ? 'text-amber-400'
                    : 'text-rose-400';

                return (
                  <div
                    key={result.criterionId}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-2">
                      {result.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400" />
                      )}
                      <span className="text-sm font-medium">{name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px]',
                          result.passed
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        )}
                      >
                        {result.passed ? 'Pass' : 'Fail'}
                      </Badge>
                      <span className={cn('text-sm font-bold font-mono', scoreColor)}>
                        {result.score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Campaign structure summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Layout className="h-4 w-4 text-teal-400" />
              Your Campaign Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <p className="text-xs text-muted-foreground mb-0.5">Campaign Name</p>
                <p className="text-sm font-semibold truncate">{campaign.name || '(unnamed)'}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <p className="text-xs text-muted-foreground mb-0.5">Campaign Type</p>
                <p className="text-sm font-semibold">{campaignTypeLabels[campaign.type]}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <p className="text-xs text-muted-foreground mb-0.5">Targeting</p>
                <p className="text-sm font-semibold">{targetingTypeLabels[campaign.targetingType]}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <p className="text-xs text-muted-foreground mb-0.5">Bid Strategy</p>
                <p className="text-sm font-semibold">{bidStrategyLabels[campaign.bidStrategy]}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <p className="text-xs text-muted-foreground mb-0.5">Daily Budget</p>
                <p className="text-sm font-bold font-mono">${campaign.dailyBudget.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <p className="text-xs text-muted-foreground mb-0.5">Default Bid</p>
                <p className="text-sm font-bold font-mono">${campaign.defaultBid.toFixed(2)}</p>
              </div>
            </div>

            <Separator />

            {/* Keywords summary */}
            <div>
              <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-2">
                Keywords ({positiveKeywords.length} positive, {negativeKeywords.length} negative)
              </p>
              {positiveKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {positiveKeywords.map((kw) => (
                    <Badge
                      key={kw.id}
                      variant="outline"
                      className="text-[10px] bg-emerald-500/5 text-emerald-400 border-emerald-500/20"
                    >
                      {kw.text} · {matchTypeLabels[kw.matchType]} · ${kw.bid.toFixed(2)}
                    </Badge>
                  ))}
                </div>
              )}
              {negativeKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {negativeKeywords.map((kw) => (
                    <Badge
                      key={kw.id}
                      variant="outline"
                      className="text-[10px] bg-rose-500/5 text-rose-400 border-rose-500/20"
                    >
                      -{kw.text} · {matchTypeLabels[kw.matchType]}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reference comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-amber-500/15">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              Reference Campaigns
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Compare your campaign to these expert-built structures
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {referenceCampaigns.map((ref) => (
              <div
                key={ref.id}
                className="p-4 rounded-lg bg-amber-500/3 border border-amber-500/10"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold">{ref.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[9px] bg-emerald-500/5 text-emerald-400 border-emerald-500/15">
                        {campaignTypeLabels[ref.type] || ref.type}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] bg-muted/30 text-muted-foreground border-border">
                        {targetingTypeLabels[ref.targetingType] || ref.targetingType}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        ${ref.dailyBudget.toFixed(2)}/day
                      </span>
                    </div>
                  </div>
                </div>

                {/* Keywords */}
                <div className="flex flex-wrap gap-1 mt-2 mb-2">
                  {ref.keywords.filter((k) => !k.isNegative).map((kw) => (
                    <Badge
                      key={kw.id}
                      variant="outline"
                      className="text-[9px] bg-emerald-500/5 text-emerald-400 border-emerald-500/15"
                    >
                      {kw.text} · {matchTypeLabels[kw.matchType] || kw.matchType} · ${kw.bid.toFixed(2)}
                    </Badge>
                  ))}
                  {ref.keywords.filter((k) => k.isNegative).map((kw) => (
                    <Badge
                      key={kw.id}
                      variant="outline"
                      className="text-[9px] bg-rose-500/5 text-rose-400 border-rose-500/15"
                    >
                      -{kw.text}
                    </Badge>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground leading-snug">
                  {ref.reasoning}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <Card>
          <CardContent className="py-4 flex flex-col items-center gap-1">
            <Target className="h-4 w-4 text-emerald-400 mb-1" />
            <p className="text-2xl font-bold font-mono">{totalScore}</p>
            <p className="text-xs text-muted-foreground">Total Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex flex-col items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 mb-1" />
            <p className="text-2xl font-bold font-mono">
              {criteriaResults.filter((r) => r.passed).length}/{criteriaResults.length}
            </p>
            <p className="text-xs text-muted-foreground">Passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex flex-col items-center gap-1">
            <Layout className="h-4 w-4 text-teal-400 mb-1" />
            <p className="text-2xl font-bold font-mono text-teal-400">{positiveKeywords.length}</p>
            <p className="text-xs text-muted-foreground">Keywords</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex flex-col items-center gap-1">
            <Zap className="h-4 w-4 text-emerald-400 mb-1" />
            <p className="text-2xl font-bold font-mono text-emerald-400">{xpEarned}</p>
            <p className="text-xs text-muted-foreground">Total XP</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
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
          className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
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
