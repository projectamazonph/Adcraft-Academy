'use client';

import { motion } from 'framer-motion';
import {
  Rocket,
  BookOpen,
  Layout,
  TrendingUp,
  Filter,
  Lock,
  CheckCircle2,
  PlayCircle,
  Circle,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { ModuleProgressItem } from '@/app/actions/types';

interface Module {
  number: number;
  title: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  lessons: number;
}

interface ModuleCardsProps {
  moduleProgress?: ModuleProgressItem[];
}

const modules: Module[] = [
  {
    number: 0,
    title: 'Onboarding',
    slug: 'onboarding',
    icon: 'Rocket',
    color: 'emerald',
    description: 'Welcome, platform tour, first simulation intro',
    lessons: 3,
  },
  {
    number: 1,
    title: 'Foundations',
    slug: 'foundations',
    icon: 'BookOpen',
    color: 'sky',
    description: 'PPC basics, key metrics (CPC, ACoS, TACoS, RoAS)',
    lessons: 5,
  },
  {
    number: 4,
    title: 'Campaign Architecture',
    slug: 'campaign-architecture',
    icon: 'Layout',
    color: 'amber',
    description: 'Sponsored Products, Brands, Display',
    lessons: 4,
  },
  {
    number: 6,
    title: 'Bidding Lab',
    slug: 'bidding-lab',
    icon: 'TrendingUp',
    color: 'rose',
    description: 'Bid strategies, position economics, budget pacing',
    lessons: 3,
  },
  {
    number: 7,
    title: 'Search Term Triage',
    slug: 'search-term-triage',
    icon: 'Filter',
    color: 'violet',
    description: 'Negative keywords, STR analysis, optimization',
    lessons: 3,
  },
];

const iconMap: Record<string, LucideIcon> = {
  Rocket,
  BookOpen,
  Layout,
  TrendingUp,
  Filter,
};

const colorConfig: Record<string, {
  bg: string;
  border: string;
  text: string;
  accent: string;
  gradient: string;
  progressBg: string;
}> = {
  emerald: {
    bg: 'bg-emerald-500/8',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    accent: 'bg-emerald-500/15',
    gradient: 'from-emerald-500/20 via-emerald-400/10 to-transparent',
    progressBg: 'bg-emerald-500/15',
  },
  sky: {
    bg: 'bg-sky-500/8',
    border: 'border-sky-500/20',
    text: 'text-sky-400',
    accent: 'bg-sky-500/15',
    gradient: 'from-sky-500/20 via-sky-400/10 to-transparent',
    progressBg: 'bg-sky-500/15',
  },
  amber: {
    bg: 'bg-amber-500/8',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    accent: 'bg-amber-500/15',
    gradient: 'from-amber-500/20 via-amber-400/10 to-transparent',
    progressBg: 'bg-amber-500/15',
  },
  rose: {
    bg: 'bg-rose-500/8',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    accent: 'bg-rose-500/15',
    gradient: 'from-rose-500/20 via-rose-400/10 to-transparent',
    progressBg: 'bg-rose-500/15',
  },
  violet: {
    bg: 'bg-violet-500/8',
    border: 'border-violet-500/20',
    text: 'text-violet-400',
    accent: 'bg-violet-500/15',
    gradient: 'from-violet-500/20 via-violet-400/10 to-transparent',
    progressBg: 'bg-violet-500/15',
  },
};

function getModuleStatus(progress: ModuleProgressItem | undefined): 'locked' | 'available' | 'in-progress' | 'complete' {
  if (!progress) return 'available';
  if (progress.status === 'COMPLETED') return 'complete';
  if (progress.status === 'IN_PROGRESS') return 'in-progress';
  return 'available';
}

function getProgressPercent(status: string, lessonsCompleted: number, totalLessons: number): number {
  if (status === 'COMPLETED') return 100;
  if (lessonsCompleted > 0) return Math.round((lessonsCompleted / totalLessons) * 100);
  return 0;
}

const statusConfig: Record<string, { badge: string; icon: LucideIcon; label: string }> = {
  locked: {
    badge: 'bg-muted/50 text-muted-foreground border-border',
    icon: Lock,
    label: 'Locked',
  },
  available: {
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    icon: PlayCircle,
    label: 'Available',
  },
  'in-progress': {
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    icon: Circle,
    label: 'In Progress',
  },
  complete: {
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    icon: CheckCircle2,
    label: 'Complete',
  },
};

function ModuleCard({ module, index, progress }: { module: Module; index: number; progress?: ModuleProgressItem }) {
  const colors = colorConfig[module.color];
  const Icon = iconMap[module.icon] || BookOpen;
  const status = getModuleStatus(progress);
  const statusConf = statusConfig[status];
  const StatusIcon = statusConf.icon;
  const progressPercent = getProgressPercent(
    progress?.status || 'NOT_STARTED',
    progress?.lessonsCompleted || 0,
    module.lessons
  );
  const isLocked = status === 'locked';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: index * 0.08 }}
      whileHover={!isLocked ? { y: -2, transition: { duration: 0.2 } } : {}}
      className={cn(
        'group relative',
        isLocked && 'opacity-60'
      )}
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-colors cursor-pointer',
          colors.border,
          isLocked ? 'cursor-not-allowed' : 'hover:border-primary/40',
        )}
      >
        {/* Gradient overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
            colors.gradient
          )}
        />

        <CardHeader className="relative pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-xl border',
                  colors.accent,
                  colors.border
                )}
              >
                <Icon className={cn('h-5 w-5', colors.text)} />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Module {module.number}
                </CardTitle>
                <p className="text-sm font-medium text-foreground/90">
                  {module.title}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn('gap-1 text-[10px] shrink-0', statusConf.badge)}
            >
              <StatusIcon className="h-3 w-3" />
              {statusConf.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {module.description}
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {progress?.lessonsCompleted || 0}/{module.lessons} lessons
              </span>
              <span className={cn('font-mono', colors.text)}>
                {progressPercent}%
              </span>
            </div>
            <div className={cn('h-1.5 w-full overflow-hidden rounded-full', colors.progressBg)}>
              <motion.div
                className={cn('h-full rounded-full', colors.text === 'text-emerald-400' ? 'bg-emerald-400' : colors.text === 'text-sky-400' ? 'bg-sky-400' : colors.text === 'text-amber-400' ? 'bg-amber-400' : colors.text === 'text-rose-400' ? 'bg-rose-400' : 'bg-violet-400')}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.3 + index * 0.08, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Decorative PPC metric */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-mono text-muted-foreground/40 tracking-wider uppercase">
              {module.number === 0 && 'Welcome →'}
              {module.number === 1 && 'CPC · ACoS · TACoS'}
              {module.number === 4 && 'SP · SB · SD'}
              {module.number === 6 && 'CPC · Position · ACoS'}
              {module.number === 7 && 'STR · Neg · Optimize'}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ModuleCards({ moduleProgress }: ModuleCardsProps) {
  const completedCount = moduleProgress
    ? moduleProgress.filter((mp) => mp.status === 'COMPLETED').length
    : 0;
  const availableCount = modules.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Learning Modules</h2>
        <span className="text-xs text-muted-foreground">
          {completedCount > 0 ? `${completedCount} of ${availableCount} completed` : `${availableCount} available`}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {modules.map((module, index) => {
          const progress = moduleProgress?.find((mp) => mp.moduleNumber === module.number);
          return <ModuleCard key={module.number} module={module} index={index} progress={progress} />;
        })}
      </div>
    </div>
  );
}
