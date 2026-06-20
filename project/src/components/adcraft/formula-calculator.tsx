'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  DollarSign,
  Percent,
  BarChart3,
  TrendingUp,
  Target,
  Info,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CircleDot,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  PPC_FORMULAS,
  computeFormula,
  formatFormulaOutput,
  assessMetricHealth,
  getFormulasForModule,
} from '@/engine/formulas';
import type { PpcFormula, FormulaResult, FormulaUnit, FormulaCategory } from '@/engine/types';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Module 1 formulas only */
const MODULE_1_FORMULAS = getFormulasForModule(1);

/** Category color config */
const categoryConfig: Record<FormulaCategory, { bg: string; border: string; text: string; icon: typeof DollarSign }> = {
  cost: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', icon: DollarSign },
  efficiency: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: Target },
  performance: { bg: 'bg-sky-500/10', border: 'border-sky-500/20', text: 'text-sky-400', icon: TrendingUp },
  profitability: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: BarChart3 },
  reach: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', icon: BarChart3 },
};

/** Unit display config */
const unitConfig: Record<FormulaUnit, { prefix: string; suffix: string; color: string }> = {
  percentage: { prefix: '', suffix: '%', color: 'text-amber-400' },
  currency: { prefix: '$', suffix: '', color: 'text-emerald-400' },
  ratio: { prefix: '', suffix: 'x', color: 'text-sky-400' },
  rate: { prefix: '', suffix: '%', color: 'text-violet-400' },
  count: { prefix: '', suffix: '', color: 'text-rose-400' },
};

/** Health threshold context for each formula slug */
interface HealthContext {
  target: number;
  direction: 'lower_is_better' | 'higher_is_better';
  label: string;
  ranges: { excellent: string; good: string; warning: string; critical: string };
}

const healthContexts: Record<string, HealthContext> = {
  cpc: {
    target: 1.50,
    direction: 'lower_is_better',
    label: 'Industry avg ~$1.50',
    ranges: { excellent: '< $1.50', good: '$1.50 – $1.88', warning: '$1.88 – $2.25', critical: '> $2.25' },
  },
  acos: {
    target: 0.25,
    direction: 'lower_is_better',
    label: 'Target: 25%',
    ranges: { excellent: '< 25%', good: '25% – 31%', warning: '31% – 38%', critical: '> 38%' },
  },
  tacos: {
    target: 0.10,
    direction: 'lower_is_better',
    label: 'Healthy: < 10%',
    ranges: { excellent: '< 10%', good: '10% – 13%', warning: '13% – 15%', critical: '> 15%' },
  },
  roas: {
    target: 4.0,
    direction: 'higher_is_better',
    label: 'Target: 4x+',
    ranges: { excellent: '> 4.0x', good: '3.0x – 4.0x', warning: '2.0x – 3.0x', critical: '< 2.0x' },
  },
  ctr: {
    target: 0.02,
    direction: 'higher_is_better',
    label: 'Good: > 2%',
    ranges: { excellent: '> 2.0%', good: '1.5% – 2.0%', warning: '1.0% – 1.5%', critical: '< 1.0%' },
  },
  cvr: {
    target: 0.10,
    direction: 'higher_is_better',
    label: 'Target: 10%+',
    ranges: { excellent: '> 10%', good: '7.5% – 10%', warning: '5% – 7.5%', critical: '< 5%' },
  },
  aov: {
    target: 25,
    direction: 'higher_is_better',
    label: 'Varies by category',
    ranges: { excellent: '> $25', good: '$18 – $25', warning: '$12 – $18', critical: '< $12' },
  },
};

/** Educational tips per formula */
const formulaTips: Record<string, { insight: string; example: string; pitfall: string }> = {
  cpc: {
    insight: 'CPC varies dramatically by category — pet supplies average $0.60 while electronics can exceed $2.50. Always benchmark against your category, not a universal number.',
    example: 'If you spend $150 on a keyword and get 120 clicks, CPC = $150 / 120 = $1.25 per click.',
    pitfall: 'A low CPC is not always good — if those clicks never convert, even $0.10 per click is wasted spend.',
  },
  acos: {
    insight: 'ACoS is the most critical efficiency metric. It tells you what percentage of your ad revenue goes back into advertising. Lower ACoS means more profit per sale.',
    example: 'Spend $100 to generate $400 in sales → ACoS = $100 / $400 = 25%. You keep 75 cents of every ad dollar.',
    pitfall: 'ACoS alone does not tell the whole story. A 15% ACoS on a 10% margin product means you are losing money after COGS.',
  },
  tacos: {
    insight: 'TACoS reveals whether ads are cannibalizing organic sales. If TACoS rises while total sales stay flat, your ads are just replacing organic purchases, not growing them.',
    example: 'Spend $100 on ads, total revenue (organic + ads) = $2,000 → TACoS = 5%. You are spending 5% of total revenue on advertising.',
    pitfall: 'A very low TACoS may indicate under-investment in ads. If competitors outspend you, you may lose market share over time.',
  },
  roas: {
    insight: 'ROAS is the inverse of ACoS. A 4x ROAS means you earn $4 for every $1 spent. Most Amazon sellers target 3x-5x ROAS for Sponsored Products.',
    example: 'Spend $100, generate $400 in attributed sales → ROAS = $400 / $100 = 4.0x. Every dollar returns four.',
    pitfall: 'ROAS does not account for product costs. A 4x ROAS on a product with 75% COGS leaves zero profit after ad spend.',
  },
  ctr: {
    insight: 'CTR measures ad relevance. Amazon rewards high-CTR ads with better placements and lower CPCs. Below 0.5% suggests poor keyword-to-listing match.',
    example: '2,500 impressions generate 75 clicks → CTR = 75 / 2,500 = 3.0%. Your ad appeals to 3% of shoppers who see it.',
    pitfall: 'High CTR with low conversion means your ad is attractive but your listing page fails to close. Fix the listing first.',
  },
  cvr: {
    insight: 'Conversion rate is the bridge between traffic and revenue. On Amazon, 10-15% is strong for most categories. Your listing quality, price, and reviews directly impact CVR.',
    example: '100 clicks produce 12 orders → CVR = 12 / 100 = 12%. One in eight clickers buys your product.',
    pitfall: 'CVR drops when you target broad keywords. "Water bottle" converts at 5% but "insulated water bottle 32oz" converts at 15%.',
  },
  aov: {
    insight: 'Higher AOV means each sale contributes more margin to cover ad costs. Products above $25 AOV have significantly more bidding flexibility on Amazon.',
    example: '$640 in sales from 16 orders → AOV = $640 / 16 = $40. Each order averages $40 in revenue.',
    pitfall: 'AOV alone does not guarantee profitability. A $100 AOV with 90% COGS leaves only $10 per order to cover ad spend.',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

interface FormulaCalculatorProps {
  /** Restrict to a specific module's formulas (default: 1) */
  moduleRef?: number;
  /** Optional CSS class for outer container */
  className?: string;
}

export function FormulaCalculator({ moduleRef = 1, className }: FormulaCalculatorProps) {
  const formulas = useMemo(() => getFormulasForModule(moduleRef), [moduleRef]);
  const [selectedSlug, setSelectedSlug] = useState<string>(formulas[0]?.slug ?? 'cpc');
  const selectedFormula = useMemo(
    () => formulas.find((f) => f.slug === selectedSlug) ?? formulas[0],
    [formulas, selectedSlug]
  );

  // Input state — keyed by formula slug + input slug
  const [inputValues, setInputValues] = useState<Record<string, Record<string, number>>>(() => {
    const initial: Record<string, Record<string, number>> = {};
    for (const f of formulas) {
      initial[f.slug] = {};
      for (const inp of f.inputs) {
        initial[f.slug][inp.slug] = inp.defaultValue ?? 0;
      }
    }
    return initial;
  });

  // Active tip tab
  const [tipTab, setTipTab] = useState<'insight' | 'example' | 'pitfall'>('insight');

  // Compute result for current formula
  const currentInputs = inputValues[selectedSlug] ?? {};
  const result = useMemo(() => computeFormula(selectedSlug, currentInputs), [selectedSlug, currentInputs]);

  // Health assessment
  const health = useMemo(() => {
    const ctx = healthContexts[selectedSlug];
    if (!ctx || !result || !isFinite(result.output)) return null;
    const status = assessMetricHealth(result.output, ctx.target, ctx.direction);
    return { status, context: ctx };
  }, [selectedSlug, result]);

  // Update an input
  const updateInput = useCallback((slug: string, inputSlug: string, value: number) => {
    setInputValues((prev) => ({
      ...prev,
      [slug]: { ...prev[slug], [inputSlug]: value },
    }));
  }, []);

  // Reset inputs to defaults
  const resetToDefaults = useCallback(() => {
    setInputValues((prev) => {
      const next = { ...prev };
      const f = formulas.find((f) => f.slug === selectedSlug);
      if (f) {
        next[f.slug] = {};
        for (const inp of f.inputs) {
          next[f.slug][inp.slug] = inp.defaultValue ?? 0;
        }
      }
      return next;
    });
  }, [formulas, selectedSlug]);

  // Health badge
  const healthBadge = useMemo(() => {
    if (!health) return null;
    const configs: Record<string, { bg: string; text: string; icon: typeof CheckCircle2; label: string }> = {
      excellent: { bg: 'bg-emerald-500/15 border-emerald-500/25', text: 'text-emerald-400', icon: CheckCircle2, label: 'Excellent' },
      good: { bg: 'bg-sky-500/15 border-sky-500/25', text: 'text-sky-400', icon: CircleDot, label: 'Good' },
      warning: { bg: 'bg-amber-500/15 border-amber-500/25', text: 'text-amber-400', icon: AlertTriangle, label: 'Warning' },
      critical: { bg: 'bg-rose-500/15 border-rose-500/25', text: 'text-rose-400', icon: XCircle, label: 'Critical' },
      insufficient_data: { bg: 'bg-muted/30 border-border', text: 'text-muted-foreground', icon: Info, label: 'N/A' },
    };
    return configs[health.status] ?? configs.insufficient_data;
  }, [health]);

  const catConfig = categoryConfig[selectedFormula.category] ?? categoryConfig.efficiency;
  const uConfig = unitConfig[selectedFormula.unit] ?? unitConfig.percentage;
  const tips = formulaTips[selectedSlug];
  const healthCtx = healthContexts[selectedSlug];

  return (
    <div className={cn('space-y-5', className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.4 }}
      >
        <Card className="relative overflow-hidden border-sky-500/20 bg-gradient-to-br from-sky-500/6 via-card to-card">
          <div className="absolute top-0 right-0 w-56 h-56 bg-sky-500/4 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <CardContent className="relative py-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-sky-500/15 border border-sky-500/25">
                <Calculator className="h-4 w-4 text-sky-400" />
              </div>
              <Badge className="bg-sky-500/15 text-sky-400 border-sky-500/25 hover:bg-sky-500/20 text-[10px]">
                MODULE {moduleRef} — FORMULA LAB
              </Badge>
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-1">
              PPC Formula Calculator
            </h2>
            <p className="text-sm text-muted-foreground">
              Explore, compute, and understand the key Amazon PPC metrics. Adjust inputs in real time
              to see how changes in spend, clicks, and sales affect your performance.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Formula Selector Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.05 }}
      >
        <Card className="border-border">
          <CardContent className="py-3 px-3">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {formulas.map((f) => {
                const cat = categoryConfig[f.category] ?? categoryConfig.efficiency;
                const isActive = f.slug === selectedSlug;
                return (
                  <button
                    key={f.slug}
                    onClick={() => {
                      setSelectedSlug(f.slug);
                      setTipTab('insight');
                    }}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all border',
                      isActive
                        ? cn(cat.bg, cat.border, cat.text, 'shadow-sm')
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    )}
                  >
                    <span className="font-mono text-[10px] opacity-60">{f.expression.split(' ')[0]}</span>
                    {f.name}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Calculator Area: 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Inputs (3 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
          className="lg:col-span-3 space-y-4"
        >
          {/* Formula Expression Card */}
          <Card className={cn('border-border', catConfig.bg)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('p-1.5 rounded-md border', catConfig.bg, catConfig.border)}>
                    <catConfig.icon className={cn('h-4 w-4', catConfig.text)} />
                  </div>
                  <CardTitle className="text-base font-semibold">{selectedFormula.name}</CardTitle>
                </div>
                <Badge variant="outline" className={cn('text-[10px] gap-1', catConfig.bg, catConfig.border, catConfig.text)}>
                  {selectedFormula.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Expression */}
              <div className="p-4 rounded-lg bg-background/60 border border-border text-center">
                <p className="text-sm text-muted-foreground mb-1">Formula</p>
                <p className={cn('text-xl font-bold font-mono', catConfig.text)}>
                  {selectedFormula.expression}
                </p>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedFormula.description}
              </p>

              {/* Inputs */}
              <div className="space-y-4 pt-1">
                {selectedFormula.inputs.map((inp) => {
                  const val = currentInputs[inp.slug] ?? inp.defaultValue ?? 0;
                  const maxSlider = Math.max((inp.defaultValue ?? 10) * 5, 100);
                  return (
                    <div key={inp.slug} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          {inp.name}
                          <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                            ({inp.description})
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            step={inp.defaultValue && inp.defaultValue < 10 ? 0.01 : 1}
                            value={val}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!isNaN(v) && v >= 0) updateInput(selectedSlug, inp.slug, v);
                            }}
                            className="w-24 h-8 text-right font-mono text-sm"
                          />
                        </div>
                      </div>
                      <Slider
                        value={[val]}
                        min={0}
                        max={maxSlider}
                        step={inp.defaultValue && inp.defaultValue < 10 ? 0.01 : 1}
                        onValueChange={([v]) => updateInput(selectedSlug, inp.slug, v)}
                        className="w-full"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Reset button */}
              <div className="flex justify-end pt-1">
                <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={resetToDefaults}>
                  <Sparkles className="h-3 w-3" />
                  Reset to defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Result + Health (2 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.15 }}
          className="lg:col-span-2 space-y-4"
        >
          {/* Computed Result */}
          <Card className="border-border relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent" />
            <CardHeader className="relative pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Computed Result
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4">
              {/* Big result display */}
              <div className="p-5 rounded-xl bg-background/50 border border-border text-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${selectedSlug}-${result?.formattedOutput}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
                  >
                    <p className="text-3xl font-bold font-mono">
                      <span className={uConfig.color}>
                        {result
                          ? result.formattedOutput
                          : '—'}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedFormula.name}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Input summary */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Your Inputs
                </p>
                {selectedFormula.inputs.map((inp) => {
                  const val = currentInputs[inp.slug] ?? inp.defaultValue ?? 0;
                  return (
                    <div key={inp.slug} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                      <span className="text-muted-foreground">{inp.name}</span>
                      <span className="font-mono font-medium">
                        {val >= 1000 ? `$${val.toLocaleString()}` : val < 1 ? val.toFixed(4) : val.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Calculation trace */}
              {result && isFinite(result.output) && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs">
                  <p className="text-muted-foreground font-medium mb-1">Calculation:</p>
                  <p className="font-mono">
                    {selectedFormula.expression} = {' '}
                    {selectedFormula.inputs.map((inp, i) => {
                      const val = currentInputs[inp.slug] ?? 0;
                      return (
                        <span key={inp.slug}>
                          {i > 0 && <span className="text-muted-foreground"> {selectedFormula.expression.includes('/') ? '/ ' : '× '} </span>}
                          <span className="text-foreground font-semibold">{val < 1 ? val.toFixed(4) : val.toFixed(2)}</span>
                        </span>
                      );
                    })}
                    <span className="text-muted-foreground"> = </span>
                    <span className={cn('font-bold', uConfig.color)}>{result.formattedOutput}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Health Assessment */}
          {health && healthBadge && (
            <Card className={cn('border-border')}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-400" />
                  Health Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Status badge */}
                <div className={cn('flex items-center gap-2 p-3 rounded-lg border', healthBadge.bg)}>
                  <healthBadge.icon className={cn('h-5 w-5', healthBadge.text)} />
                  <span className={cn('text-sm font-semibold', healthBadge.text)}>{healthBadge.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{health.context.label}</span>
                </div>

                {/* Range breakdown */}
                <div className="space-y-1.5">
                  {(['excellent', 'good', 'warning', 'critical'] as const).map((level) => {
                    const levelConfig: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
                      excellent: { color: 'text-emerald-400', icon: CheckCircle2 },
                      good: { color: 'text-sky-400', icon: CircleDot },
                      warning: { color: 'text-amber-400', icon: AlertTriangle },
                      critical: { color: 'text-rose-400', icon: XCircle },
                    };
                    const cfg = levelConfig[level];
                    const LevelIcon = cfg.icon;
                    const isActive = health.status === level;
                    return (
                      <div
                        key={level}
                        className={cn(
                          'flex items-center gap-2 text-xs py-1.5 px-2 rounded-md transition-colors',
                          isActive ? 'bg-muted/50 font-medium' : 'text-muted-foreground'
                        )}
                      >
                        <LevelIcon className={cn('h-3 w-3 shrink-0', cfg.color)} />
                        <span className={cn(isActive && cfg.color, 'capitalize')}>{level}</span>
                        <span className="ml-auto font-mono text-[11px]">
                          {health.context.ranges[level]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Educational Tips */}
      {tips && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
        >
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  Pro Tips — {selectedFormula.name}
                </CardTitle>
                <div className="flex gap-1">
                  {(['insight', 'example', 'pitfall'] as const).map((tab) => {
                    const tabConfig = {
                      insight: { label: 'Insight', icon: Sparkles, color: 'text-sky-400' },
                      example: { label: 'Example', icon: ArrowRight, color: 'text-emerald-400' },
                      pitfall: { label: 'Pitfall', icon: AlertTriangle, color: 'text-rose-400' },
                    };
                    const tc = tabConfig[tab];
                    const TabIcon = tc.icon;
                    return (
                      <Button
                        key={tab}
                        variant={tipTab === tab ? 'secondary' : 'ghost'}
                        size="sm"
                        className={cn('text-xs gap-1 h-7', tipTab === tab && tc.color)}
                        onClick={() => setTipTab(tab)}
                      >
                        <TabIcon className="h-3 w-3" />
                        {tc.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedSlug}-${tipTab}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
                  className={cn(
                    'p-4 rounded-lg border text-sm leading-relaxed',
                    tipTab === 'insight' && 'bg-sky-500/5 border-sky-500/15',
                    tipTab === 'example' && 'bg-emerald-500/5 border-emerald-500/15',
                    tipTab === 'pitfall' && 'bg-rose-500/5 border-rose-500/15',
                  )}
                >
                  <p className={cn(
                    'font-semibold text-xs mb-2 uppercase tracking-wider',
                    tipTab === 'insight' && 'text-sky-400',
                    tipTab === 'example' && 'text-emerald-400',
                    tipTab === 'pitfall' && 'text-rose-400',
                  )}>
                    {tipTab === 'insight' ? 'Key Insight' : tipTab === 'example' ? 'Worked Example' : 'Common Pitfall'}
                  </p>
                  <p className="text-foreground/90">
                    {tips[tipTab]}
                  </p>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Related Formulas */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.25 }}
      >
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              Related Formulas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {formulas
                .filter((f) => f.slug !== selectedSlug)
                .slice(0, 6)
                .map((f) => {
                  const cat = categoryConfig[f.category] ?? categoryConfig.efficiency;
                  return (
                    <button
                      key={f.slug}
                      onClick={() => {
                        setSelectedSlug(f.slug);
                        setTipTab('insight');
                      }}
                      className="flex items-center gap-2.5 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all text-left group"
                    >
                      <div className={cn('p-1.5 rounded-md border shrink-0', cat.bg, cat.border)}>
                        <cat.icon className={cn('h-3.5 w-3.5', cat.text)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{f.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{f.expression}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary shrink-0 transition-colors" />
                    </button>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
