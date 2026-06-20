'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  Target,
  Calculator,
  Clock,
  AlertTriangle,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBidElevatorStore } from '@/stores/bid-elevator-store';
import { useSession } from 'next-auth/react';

const bidStrategies = [
  {
    key: 'raise',
    label: 'Raise Bid',
    icon: ArrowUpRight,
    color: 'emerald',
    desc: 'Bid above current when ACoS is below target and you want more volume. Only raise when you have profit margin headroom.',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20',
    textClass: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15 border-emerald-500/25',
  },
  {
    key: 'maintain',
    label: 'Maintain Bid',
    icon: Minus,
    color: 'sky',
    desc: 'Keep current bid when performance is at or near target. Monitor for changes in competition or conversion rate.',
    bgClass: 'bg-sky-500/10 border-sky-500/20',
    textClass: 'text-sky-400',
    iconBg: 'bg-sky-500/15 border-sky-500/25',
  },
  {
    key: 'lower',
    label: 'Lower Bid',
    icon: ArrowDownRight,
    color: 'amber',
    desc: 'Reduce bid when ACoS exceeds target. Lower bids decrease impression share but improve profitability per click.',
    bgClass: 'bg-amber-500/10 border-amber-500/20',
    textClass: 'text-amber-400',
    iconBg: 'bg-amber-500/15 border-amber-500/25',
  },
];

export function BidBriefing() {
  const { productContext, thresholds, scenarios, startSimulation } =
    useBidElevatorStore();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  // Calculate max profitable CPC for reference
  const avgCvr = 0.10; // ~10% average
  const maxCpc = productContext.price * avgCvr * thresholds.acosTarget;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Mission header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.5 }}
      >
        <Card className="relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/8 via-card to-card">
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <CardContent className="relative py-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/25">
                <TrendingUp className="h-5 w-5 text-amber-400" />
              </div>
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/20 text-[10px]">
                BID ELEVATOR
              </Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              Mission Briefing
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are the PPC manager for a kitchen gadget product. You have 10
              bidding scenarios — each shows a keyword&apos;s current performance
              and market context. Your job: set the optimal bid for each keyword
              to maximize profitability while maintaining volume.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Product context */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
      >
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-400" />
              Product Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-lg font-bold">{productContext.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                ASIN: {productContext.asin} · Price: ${productContext.price.toFixed(2)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-emerald-500/8 border border-emerald-500/15 text-center">
                <p className="text-xs text-muted-foreground mb-1">Margin</p>
                <p className="text-lg font-bold font-mono text-emerald-400">
                  {(productContext.margin * 100).toFixed(0)}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-rose-500/8 border border-rose-500/15 text-center">
                <p className="text-xs text-muted-foreground mb-1">ACoS Target</p>
                <p className="text-lg font-bold font-mono text-rose-400">
                  {(thresholds.acosTarget * 100).toFixed(0)}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/8 border border-amber-500/15 text-center">
                <p className="text-xs text-muted-foreground mb-1">Max CPC</p>
                <p className="text-lg font-bold font-mono text-amber-400">
                  ${maxCpc.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Your max profitable CPC = AOV × CVR × Target ACoS = ${productContext.price.toFixed(2)} × {avgCvr.toFixed(2)} × {(thresholds.acosTarget * 100).toFixed(0)}% = ${maxCpc.toFixed(2)}.
                Never bid above this unless the keyword&apos;s CVR justifies it.
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Key formula */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.15 }}
      >
        <Card className="border-amber-500/15">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-amber-400" />
              The Bidding Formula
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/15 text-center">
              <p className="text-lg font-bold font-mono text-amber-400">
                Max CPC = AOV × CVR × Target ACoS
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                This tells you the most you can pay per click and still hit your ACoS target.
                AOV = Average Order Value, CVR = Conversion Rate.
              </p>
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-1">
              <p>
                <span className="text-emerald-400 font-medium">If ACoS &lt; Target:</span> You have room to bid higher for more volume.
              </p>
              <p>
                <span className="text-amber-400 font-medium">If ACoS ≈ Target:</span> Maintain current bid — you&apos;re in the sweet spot.
              </p>
              <p>
                <span className="text-rose-400 font-medium">If ACoS &gt; Target:</span> Lower your bid to improve profitability.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bid strategies */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
      >
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-sky-400" />
              Your Arsenal — 3 Bid Strategies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bidStrategies.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.key}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${s.bgClass}`}
                >
                  <div className={`p-1.5 rounded-md border shrink-0 ${s.iconBg}`}>
                    <Icon className={`h-4 w-4 ${s.textClass}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${s.textClass}`}>
                      {s.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Mission parameters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.3 }}
      >
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              Mission Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Bidding Scenarios</span>
                <span className="font-mono font-semibold">{scenarios.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Format</span>
                <span className="font-mono font-semibold text-amber-400">One at a time</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Time Limit</span>
                <span className="font-mono font-semibold text-emerald-400">None — take your time</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Scoring</span>
                <span className="font-mono font-semibold">0–100 points</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">XP Reward</span>
                <span className="font-mono font-semibold text-amber-400">Score × 2 XP</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.4 }}
        className="pb-8"
      >
        <Button
          size="lg"
          className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white h-12 text-base font-semibold"
          onClick={() => startSimulation(userId)}
        >
          Begin Simulation
          <ChevronRight className="h-5 w-5" />
        </Button>
      </motion.div>
    </div>
  );
}
