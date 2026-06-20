'use client';

import { motion } from 'framer-motion';
import {
  Shield,
  Target,
  TrendingUp,
  Pause,
  XCircle,
  Ban,
  Sliders,
  Clock,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useStrTriageStore } from '@/stores/str-triage-store';
import { useSession } from 'next-auth/react';

const actions = [
  {
    key: 'keep',
    label: 'Keep',
    icon: TrendingUp,
    color: 'emerald',
    desc: 'Term is performing well — maintain current bid and monitor.',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20',
    textClass: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15 border-emerald-500/25',
  },
  {
    key: 'pause',
    label: 'Pause',
    icon: Pause,
    color: 'amber',
    desc: 'Poor performance but may revisit — temporarily stop running.',
    bgClass: 'bg-amber-500/10 border-amber-500/20',
    textClass: 'text-amber-400',
    iconBg: 'bg-amber-500/15 border-amber-500/25',
  },
  {
    key: 'negate-exact',
    label: 'Negate Exact',
    icon: XCircle,
    color: 'rose',
    desc: 'Irrelevant term — add as exact negative keyword to block it.',
    bgClass: 'bg-rose-500/10 border-rose-500/20',
    textClass: 'text-rose-400',
    iconBg: 'bg-rose-500/15 border-rose-500/25',
  },
  {
    key: 'negate-phrase',
    label: 'Negate Phrase',
    icon: Ban,
    color: 'rose',
    desc: 'Broadly irrelevant — add as phrase negative to block variations.',
    bgClass: 'bg-rose-500/10 border-rose-500/20',
    textClass: 'text-rose-400',
    iconBg: 'bg-rose-500/15 border-rose-500/25',
  },
  {
    key: 'optimize-bid',
    label: 'Optimize Bid',
    icon: Sliders,
    color: 'sky',
    desc: 'Has potential — adjust bid up or down to improve efficiency.',
    bgClass: 'bg-sky-500/10 border-sky-500/20',
    textClass: 'text-sky-400',
    iconBg: 'bg-sky-500/15 border-sky-500/25',
  },
] as const;

export function StrBriefing() {
  const { productContext, thresholds, searchTerms, startSimulation } =
    useStrTriageStore();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Mission header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.5 }}
      >
        <Card className="relative overflow-hidden border-rose-500/20 bg-gradient-to-br from-rose-500/8 via-card to-card">
          <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <CardContent className="relative py-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/25">
                <Shield className="h-5 w-5 text-rose-400" />
              </div>
              <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/25 hover:bg-rose-500/20 text-[10px]">
                STR TRIAGE ARENA
              </Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              Mission Briefing
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are the PPC manager for a kitchen gadget product. Your search
              term report has just arrived — 20 terms need immediate triage.
              Analyze each term&apos;s performance and decide the right action
              to optimize the campaign.
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
              <div className="p-3 rounded-lg bg-sky-500/8 border border-sky-500/15 text-center">
                <p className="text-xs text-muted-foreground mb-1">Min ROAS</p>
                <p className="text-lg font-bold font-mono text-sky-400">
                  {thresholds.roasMinimum.toFixed(1)}x
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Your break-even ACoS equals your margin ({(productContext.margin * 100).toFixed(0)}%).
                Any term with ACoS above this is losing money.
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Available actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
      >
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sliders className="h-4 w-4 text-sky-400" />
              Your Arsenal — 5 Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {actions.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.key}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${a.bgClass}`}
                >
                  <div className={`p-1.5 rounded-md border shrink-0 ${a.iconBg}`}>
                    <Icon className={`h-4 w-4 ${a.textClass}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${a.textClass}`}>
                      {a.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.desc}
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
                <span className="text-muted-foreground">Search Terms to Triage</span>
                <span className="font-mono font-semibold">{searchTerms.length}</span>
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
          className="w-full gap-2 bg-rose-600 hover:bg-rose-700 text-white h-12 text-base font-semibold"
          onClick={() => startSimulation(userId)}
        >
          Begin Simulation
          <ChevronRight className="h-5 w-5" />
        </Button>
      </motion.div>
    </div>
  );
}
