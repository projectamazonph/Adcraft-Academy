'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Clock,
  Trophy,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useBidElevatorStore } from '@/stores/bid-elevator-store';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Metric display helpers
// ---------------------------------------------------------------------------

function formatAcos(v: number): string {
  if (!isFinite(v)) return '∞';
  return `${(v * 100).toFixed(1)}%`;
}

function formatCurrency(v: number): string {
  return `$${v.toFixed(2)}`;
}

function formatNumber(v: number): string {
  return v.toLocaleString();
}

function formatCvr(orders: number, clicks: number): string {
  if (clicks === 0) return '0.0%';
  return `${((orders / clicks) * 100).toFixed(1)}%`;
}

function acosColor(acos: number, target: number): string {
  if (!isFinite(acos)) return 'text-rose-400';
  if (acos <= target) return 'text-emerald-400';
  if (acos <= target * 2) return 'text-amber-400';
  return 'text-rose-400';
}

// ---------------------------------------------------------------------------
// Competition badge
// ---------------------------------------------------------------------------

function CompetitionBadge({ level }: { level: string }) {
  const config: Record<string, { class: string; label: string }> = {
    low: { class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Low' },
    medium: { class: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Medium' },
    high: { class: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'High' },
  };
  const c = config[level] ?? config.medium;
  return (
    <Badge variant="outline" className={cn('text-[10px]', c.class)}>
      {c.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Trend badge
// ---------------------------------------------------------------------------

function TrendBadge({ trend }: { trend: string }) {
  const config: Record<string, { icon: typeof TrendingUp; class: string; label: string }> = {
    rising: { icon: ArrowUpRight, class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Rising' },
    stable: { icon: Minus, class: 'bg-sky-500/10 text-sky-400 border-sky-500/20', label: 'Stable' },
    declining: { icon: ArrowDownRight, class: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'Declining' },
  };
  const c = config[trend] ?? config.stable;
  const Icon = c.icon;
  return (
    <Badge variant="outline" className={cn('text-[10px] gap-1', c.class)}>
      <Icon className="h-2.5 w-2.5" />
      {c.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Scenario card — the main interactive bidding component
// ---------------------------------------------------------------------------

function ScenarioCard() {
  const { scenarios, currentScenarioIndex, submitBid, thresholds } = useBidElevatorStore();
  const scenario = scenarios[currentScenarioIndex];
  const [bidInput, setBidInput] = useState<string>(scenario.currentBid.toFixed(2));
  const [submitted, setSubmitted] = useState(false);

  // Reset when scenario changes
  useEffect(() => {
    setBidInput(scenario.currentBid.toFixed(2));
    setSubmitted(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [currentScenarioIndex, scenario.currentBid]);

  if (!scenario) return null;

  const perf = scenario.currentPerformance;
  const currentAcos = perf.sales > 0 ? perf.spend / perf.sales : 999;
  const cvr = perf.clicks > 0 ? perf.orders / perf.clicks : 0;
  const ctr = perf.impressions > 0 ? perf.clicks / perf.impressions : 0;
  const maxProfitableCpc = 24.99 * cvr * thresholds.acosTarget;

  const bidAmount = parseFloat(bidInput);
  const isValidBid = !isNaN(bidAmount) && bidAmount > 0 && bidAmount <= 50;

  const handleQuickBid = (value: number) => {
    setBidInput(value.toFixed(2));
  };

  const handleSubmit = () => {
    if (!isValidBid || submitted) return;
    setSubmitted(true);
    submitBid(bidAmount);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  // Quick bid suggestions
  const suggestedBids = [
    { label: 'Min', value: scenario.suggestedBidRange.min },
    { label: 'Rec', value: scenario.suggestedBidRange.recommended },
    { label: 'Max', value: scenario.suggestedBidRange.max },
  ];

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={scenario.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.3 }}
          className="space-y-4"
        >
          {/* Scenario header */}
          <Card className="border-amber-500/15 bg-gradient-to-br from-amber-500/5 via-card to-card">
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px]',
                        scenario.matchType === 'exact'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : scenario.matchType === 'phrase'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          : 'bg-muted text-muted-foreground border-border'
                      )}
                    >
                      {scenario.matchType}
                    </Badge>
                    <CompetitionBadge level={scenario.marketContext.competitionLevel} />
                    <TrendBadge trend={scenario.marketContext.searchVolumeTrend} />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">
                    &ldquo;{scenario.keyword}&rdquo;
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Current bid: <span className="font-mono font-semibold text-foreground">{formatCurrency(scenario.currentBid)}</span>
                    {' · '}Suggested: <span className="font-mono font-semibold text-foreground">{formatCurrency(scenario.suggestedBidRange.recommended)}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Avg CPC</p>
                  <p className="text-lg font-bold font-mono text-amber-400">
                    {formatCurrency(scenario.marketContext.averageCpc)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="py-3 flex flex-col items-center">
                <p className="text-xs text-muted-foreground mb-1">Impressions</p>
                <p className="text-lg font-bold font-mono">{formatNumber(perf.impressions)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 flex flex-col items-center">
                <p className="text-xs text-muted-foreground mb-1">Clicks</p>
                <p className="text-lg font-bold font-mono">{formatNumber(perf.clicks)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 flex flex-col items-center">
                <p className="text-xs text-muted-foreground mb-1">CTR</p>
                <p className="text-lg font-bold font-mono">{(ctr * 100).toFixed(2)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 flex flex-col items-center">
                <p className="text-xs text-muted-foreground mb-1">CVR</p>
                <p className="text-lg font-bold font-mono">{(cvr * 100).toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 flex flex-col items-center">
                <p className="text-xs text-muted-foreground mb-1">Spend</p>
                <p className="text-lg font-bold font-mono">{formatCurrency(perf.spend)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 flex flex-col items-center">
                <p className="text-xs text-muted-foreground mb-1">Sales</p>
                <p className="text-lg font-bold font-mono">{formatCurrency(perf.sales)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 flex flex-col items-center">
                <p className="text-xs text-muted-foreground mb-1">Orders</p>
                <p className="text-lg font-bold font-mono">{perf.orders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 flex flex-col items-center">
                <p className="text-xs text-muted-foreground mb-1">ACoS</p>
                <p className={cn('text-lg font-bold font-mono', acosColor(currentAcos, thresholds.acosTarget))}>
                  {formatAcos(currentAcos)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Max profitable CPC hint */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-amber-500/5 p-3 rounded-lg border border-amber-500/15">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              At {((cvr * 100).toFixed(1))}% CVR, your max profitable CPC = ${maxProfitableCpc.toFixed(2)}.
              {currentAcos > thresholds.acosTarget
                ? ' Current ACoS exceeds target — consider lowering your bid.'
                : ' Current ACoS is below target — you may have room to bid higher.'}
            </span>
          </div>

          {/* Bidding interface */}
          <Card className="border-amber-500/15">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-amber-400" />
                Set Your Bid
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick bid suggestions */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Amazon Suggested Range</p>
                <div className="flex gap-2">
                  {suggestedBids.map((s) => (
                    <Button
                      key={s.label}
                      variant="outline"
                      size="sm"
                      className={cn(
                        'gap-1 text-xs flex-1',
                        Math.abs(parseFloat(bidInput) - s.value) < 0.01
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : 'hover:bg-amber-500/10 hover:border-amber-500/20'
                      )}
                      onClick={() => handleQuickBid(s.value)}
                    >
                      {s.label}: ${s.value.toFixed(2)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Bid input */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.05"
                    min="0.01"
                    max="50"
                    value={bidInput}
                    onChange={(e) => setBidInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-12 text-lg font-mono pl-7 pr-3"
                    disabled={submitted}
                  />
                </div>
                <Button
                  size="lg"
                  className={cn(
                    'gap-2 font-semibold h-12 min-w-[140px]',
                    submitted
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  )}
                  disabled={!isValidBid || submitted}
                  onClick={handleSubmit}
                >
                  {submitted ? (
                    <>
                      <Zap className="h-4 w-4" />
                      Submitted
                    </>
                  ) : (
                    <>
                      Submit Bid
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* Bid comparison bar */}
              {isValidBid && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>$0</span>
                    <span>Amazon Min: ${scenario.suggestedBidRange.min.toFixed(2)}</span>
                    <span>Your Bid: ${bidAmount.toFixed(2)}</span>
                    <span>Amazon Max: ${scenario.suggestedBidRange.max.toFixed(2)}</span>
                    <span>${(scenario.suggestedBidRange.max * 1.5).toFixed(2)}</span>
                  </div>
                  <div className="relative h-3 rounded-full bg-muted/40 overflow-hidden">
                    {/* Suggested range band */}
                    <div
                      className="absolute top-0 h-full bg-amber-500/15 border-x border-amber-500/30"
                      style={{
                        left: `${(scenario.suggestedBidRange.min / (scenario.suggestedBidRange.max * 1.5)) * 100}%`,
                        right: `${100 - (scenario.suggestedBidRange.max / (scenario.suggestedBidRange.max * 1.5)) * 100}%`,
                      }}
                    />
                    {/* Current bid marker */}
                    <div
                      className="absolute top-0 h-full w-0.5 bg-sky-400"
                      style={{
                        left: `${(scenario.currentBid / (scenario.suggestedBidRange.max * 1.5)) * 100}%`,
                      }}
                    />
                    {/* User bid marker */}
                    <motion.div
                      className="absolute top-0 h-full w-1.5 bg-amber-400 rounded-full"
                      style={{
                        left: `${Math.min(100, (bidAmount / (scenario.suggestedBidRange.max * 1.5)) * 100)}%`,
                      }}
                      layout
                    />
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-sky-400" /> Current
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> Your Bid
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-amber-500/30" /> Suggested Range
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main arena view
// ---------------------------------------------------------------------------

export function BidArena() {
  const {
    scenarios,
    currentScenarioIndex,
    previewScore,
    elapsedTime,
    decisions,
    tick,
  } = useBidElevatorStore();

  // Timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tick]);

  const completedCount = decisions.length;
  const totalScenarios = scenarios.length;
  const allDone = completedCount >= totalScenarios;

  // Format elapsed time
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="space-y-4">
      {/* Top bar: progress + timer + score */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              <span className="font-mono">
                {currentScenarioIndex + 1}/{totalScenarios}
              </span>
              <span className="text-muted-foreground text-xs">scenario</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="font-mono">{timeStr}</span>
            </div>
          </div>
          <Progress
            value={(completedCount / totalScenarios) * 100}
            className="h-1.5 mt-2 max-w-xs"
          />
        </div>

        {/* Preview score */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Trophy className="h-4 w-4 text-amber-400" />
          <span className="text-xs text-muted-foreground">Preview</span>
          <span className="text-lg font-bold font-mono text-amber-400">
            {previewScore}
          </span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>

      {/* Scenario card */}
      <ScenarioCard />
    </div>
  );
}
