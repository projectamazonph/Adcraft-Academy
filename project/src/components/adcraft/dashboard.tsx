'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
  PlayCircle,
  FlaskConical,
  Bot,
  ArrowRight,
  DollarSign,
  Percent,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XpProgress } from './xp-progress';
import { StatsRow } from './stats-row';
import { ModuleCards } from './module-cards';
import { SimulationCards } from './simulation-cards';
import { getProgressOverview } from '@/app/actions/progress';
import { getActiveMultipliers } from '@/app/actions/events';
import type { NavTab } from './sidebar';
import type { ProgressOverview, ModuleProgressItem } from '@/app/actions/types';

interface DashboardProps {
  onNavigate: (tab: NavTab) => void;
  xpOverride?: number;
  levelOverride?: number;
}

const ppcMetrics = [
  { label: 'Avg. CPC', value: '$1.24', icon: DollarSign },
  { label: 'Target ACoS', value: '22%', icon: Percent },
  { label: 'Avg. RoAS', value: '4.5x', icon: BarChart3 },
];

export function Dashboard({ onNavigate, xpOverride, levelOverride }: DashboardProps) {
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [multiplier, setMultiplier] = useState<{ name: string; multiplier: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  // Use session name if available, fallback to email prefix
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'there';

  useEffect(() => {
    getProgressOverview()
      .then((res) => {
        if (res.success) {
          setOverview(res.data);
        } else {
          setError(res.error);
          console.warn('[Dashboard] getProgressOverview failed:', res.error);
        }
      })
      .catch((err) => {
        setError('Failed to load progress data');
        console.error('[Dashboard] getProgressOverview error:', err);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    getActiveMultipliers().then(setMultiplier).catch(() => {});
  }, []);
  }, []);

  const xp = xpOverride ?? overview?.xp ?? 0;
  const level = levelOverride ?? overview?.level ?? 1;
  const levelMax = level * 500;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-muted-foreground">Unable to load progress data</p>
        <p className="text-xs text-muted-foreground/60">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome hero card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/3 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

          <CardContent className="relative py-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                    PPC Command Center
                  </span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Welcome back, {userName} 👋
                </h2>
                <p className="text-muted-foreground text-sm max-w-lg">
                  Your Amazon PPC training journey starts here. Complete modules to
                  unlock simulations, earn XP, and master campaign management.
                </p>
                <div className="pt-2">
                  <XpProgress current={xp} max={levelMax} level={level} size="lg" />
                </div>
              </div>

              {/* PPC decorative metrics */}
              <div className="flex lg:flex-col gap-3">
                {ppcMetrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div
                      key={metric.label}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/80 border border-border backdrop-blur-sm"
                    >
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">
                          {metric.label}
                        </p>
                        <p className="text-sm font-semibold font-mono">
                          {metric.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Row */}
      <StatsRow
        modulesCompleted={overview?.modulesCompleted ?? 0}
        totalModules={overview?.totalModules ?? 5}
        simsPassed={overview?.simsPassed ?? 0}
        totalSims={overview?.totalSims ?? 3}
        streakDays={overview?.streakDays ?? 0}
        totalXP={xp}
      />

      {/* Module Cards */}
      <ModuleCards moduleProgress={overview?.moduleProgress} />

      {/* Simulation Cards */}
      <SimulationCards moduleProgress={overview?.moduleProgress} />

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="space-y-3"
      >
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 px-4 justify-start gap-3 border-primary/20 hover:bg-primary/5 hover:border-primary/30 transition-all group"
            onClick={() => onNavigate('modules')}
          >
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <PlayCircle className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">Continue Learning</p>
              <p className="text-[10px] text-muted-foreground">
                {(overview?.modulesCompleted ?? 0) > 0
                  ? `${overview?.modulesCompleted} modules done`
                  : 'Module 0: Onboarding'}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 px-4 justify-start gap-3 border-amber-500/20 hover:bg-amber-500/5 hover:border-amber-500/30 transition-all group"
            onClick={() => onNavigate('simulations')}
          >
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <FlaskConical className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">Start Simulation</p>
              <p className="text-[10px] text-muted-foreground">
                {(overview?.simsPassed ?? 0) > 0
                  ? `${overview?.simsPassed} simulations passed`
                  : 'Unlock by completing modules'}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 px-4 justify-start gap-3 border-violet-500/20 hover:bg-violet-500/5 hover:border-violet-500/30 transition-all group"
            onClick={() => onNavigate('mentor')}
          >
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Bot className="h-4 w-4 text-violet-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">Ask AI Mentor</p>
              <p className="text-[10px] text-muted-foreground">
                Get PPC coaching & tips
              </p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
