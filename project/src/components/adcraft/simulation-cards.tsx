'use client';

import { motion } from 'framer-motion';
import {
  MousePointerClick,
  ArrowUpRight,
  Filter,
  Lock,
  PlayCircle,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ModuleProgressItem } from '@/app/actions/types';

interface Simulation {
  type: string;
  title: string;
  description: string;
  icon: string;
  difficulty: string;
  moduleRef: number;
}

const simulations: Simulation[] = [
  {
    type: 'campaign-builder',
    title: 'Campaign Builder',
    description:
      'Build complete campaign structures with keywords, bids, and budgets',
    icon: 'MousePointerClick',
    difficulty: 'Intermediate',
    moduleRef: 4,
  },
  {
    type: 'bid-elevator',
    title: 'Bid Elevator',
    description:
      'Practice bidding decisions across real-world scenarios with instant feedback',
    icon: 'ArrowUpRight',
    difficulty: 'Intermediate',
    moduleRef: 6,
  },
  {
    type: 'str-triage-arena',
    title: 'STR Triage Arena',
    description:
      'Analyze search terms and make keep/pause/negate decisions under time pressure',
    icon: 'Filter',
    difficulty: 'Advanced',
    moduleRef: 7,
  },
];

const iconMap: Record<string, LucideIcon> = {
  MousePointerClick,
  ArrowUpRight,
  Filter,
};

const difficultyColors: Record<string, string> = {
  Intermediate: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  Advanced: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
};

const simGradients: Record<string, string> = {
  'campaign-builder':
    'from-emerald-500/10 via-teal-400/5 to-transparent',
  'bid-elevator': 'from-amber-500/10 via-orange-400/5 to-transparent',
  'str-triage-arena': 'from-rose-500/10 via-pink-400/5 to-transparent',
};

const simBorders: Record<string, string> = {
  'campaign-builder': 'border-emerald-500/15 hover:border-emerald-500/35',
  'bid-elevator': 'border-amber-500/15 hover:border-amber-500/35',
  'str-triage-arena': 'border-rose-500/15 hover:border-rose-500/35',
};

const simAccents: Record<string, { bg: string; text: string; border: string }> = {
  'campaign-builder': {
    bg: 'bg-emerald-500/12',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  'bid-elevator': {
    bg: 'bg-amber-500/12',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  'str-triage-arena': {
    bg: 'bg-rose-500/12',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
  },
};

function SimulationCard({
  simulation,
  index,
  moduleProgress,
}: {
  simulation: Simulation;
  index: number;
  moduleProgress?: ModuleProgressItem[];
}) {
  const Icon = iconMap[simulation.icon] || MousePointerClick;
  const gradient = simGradients[simulation.type];
  const border = simBorders[simulation.type];
  const accent = simAccents[simulation.type];

  // Derive lock status from module progress
  const prerequisiteProgress = moduleProgress?.find(
    (mp) => mp.moduleNumber === simulation.moduleRef
  );
  const isLocked = !prerequisiteProgress || prerequisiteProgress.status !== 'COMPLETED';
  const isComplete = prerequisiteProgress?.status === 'COMPLETED';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.3 + index * 0.1 }}
      whileHover={!isLocked ? { y: -3, transition: { duration: 0.2 } } : {}}
      className="group relative"
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-colors',
          border,
          isLocked && 'opacity-70'
        )}
      >
        {/* Gradient overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
            gradient
          )}
        />

        <CardHeader className="relative pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2.5 rounded-xl border',
                  accent.bg,
                  accent.border
                )}
              >
                <Icon className={cn('h-5 w-5', accent.text)} />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  {simulation.title}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Requires Module {simulation.moduleRef}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] shrink-0',
                isComplete
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                  : difficultyColors[simulation.difficulty]
              )}
            >
              {isComplete ? 'Unlocked' : simulation.difficulty}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {simulation.description}
          </p>

          <div className="flex items-center gap-3">
            {isLocked ? (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="gap-2 text-xs"
              >
                <Lock className="h-3 w-3" />
                Complete Module {simulation.moduleRef} First
              </Button>
            ) : isComplete ? (
              <Button size="sm" className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                <CheckCircle2 className="h-3 w-3" />
                Ready to Launch
              </Button>
            ) : (
              <Button size="sm" className="gap-2 text-xs">
                <PlayCircle className="h-3 w-3" />
                Launch Simulation
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function SimulationCards({ moduleProgress }: { moduleProgress?: ModuleProgressItem[] }) {
  const unlockedCount = simulations.filter((sim) => {
    const mp = moduleProgress?.find((p) => p.moduleNumber === sim.moduleRef);
    return mp?.status === 'COMPLETED';
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Simulations</h2>
        <span className="text-xs text-muted-foreground">{unlockedCount} of {simulations.length} unlocked</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {simulations.map((simulation, index) => (
          <SimulationCard
            key={simulation.type}
            simulation={simulation}
            index={index}
            moduleProgress={moduleProgress}
          />
        ))}
      </div>
    </div>
  );
}
