'use client';

import { motion } from 'framer-motion';
import {
  Layout,
  Target,
  Calculator,
  Clock,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCampaignBuilderStore } from '@/stores/campaign-builder-store';
import { useSession } from 'next-auth/react';

export function CampaignBriefing() {
  const {
    productContext,
    thresholds,
    missionBrief,
    suggestedKeywords,
    startSimulation,
  } = useCampaignBuilderStore();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const breakEvenCpc = productContext.price * thresholds.conversionRateMinimum * thresholds.acosTarget;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Mission header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.5 }}
      >
        <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/8 via-card to-card">
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <CardContent className="relative py-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/25">
                <Layout className="h-5 w-5 text-emerald-400" />
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20 text-[10px]">
                CAMPAIGN BUILDER
              </Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              {missionBrief.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {missionBrief.scenario}
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
              <div className="p-3 rounded-lg bg-teal-500/8 border border-teal-500/15 text-center">
                <p className="text-xs text-muted-foreground mb-1">TACoS Target</p>
                <p className="text-lg font-bold font-mono text-teal-400">
                  {(thresholds.tacosTarget * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Your break-even ACoS equals your margin ({(productContext.margin * 100).toFixed(0)}%).
                Any campaign with ACoS above this is losing money.
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
        <Card className="border-emerald-500/15">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-emerald-400" />
              The Break-Even CPC Formula
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-center">
              <p className="text-lg font-bold font-mono text-emerald-400">
                Break-Even CPC = AOV × CVR × Target ACoS
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                This tells you the most you can pay per click and still hit your ACoS target.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
              <p className="text-sm font-mono">
                <span className="text-emerald-400">${productContext.price.toFixed(2)}</span>
                {' × '}
                <span className="text-teal-400">{(thresholds.conversionRateMinimum * 100).toFixed(0)}%</span>
                {' × '}
                <span className="text-rose-400">{(thresholds.acosTarget * 100).toFixed(0)}%</span>
                {' = '}
                <span className="text-foreground font-bold">${breakEvenCpc.toFixed(2)}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Objectives */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
      >
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-teal-400" />
              Mission Objectives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {missionBrief.objectives.map((objective, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{objective}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Tips callout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.25 }}
      >
        <Card className="border-amber-500/15 bg-amber-500/3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              Pro Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {missionBrief.tips.map((tip, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="text-amber-400 font-bold shrink-0">•</span>
                <span>{tip}</span>
              </div>
            ))}
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
                <span className="text-muted-foreground">Suggested Keywords</span>
                <span className="font-mono font-semibold">{suggestedKeywords.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Evaluation Criteria</span>
                <span className="font-mono font-semibold">5 criteria</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Time Limit</span>
                <span className="font-mono font-semibold text-emerald-400">None — take your time</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Scoring</span>
                <span className="font-mono font-semibold">0–100 weighted points</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">XP Reward</span>
                <span className="font-mono font-semibold text-emerald-400">Score × 5 XP</span>
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
          className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base font-semibold"
          onClick={() => startSimulation(userId)}
        >
          Begin Mission
          <ChevronRight className="h-5 w-5" />
        </Button>
      </motion.div>
    </div>
  );
}
