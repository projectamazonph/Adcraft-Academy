'use client';

import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface XpProgressProps {
  current: number;
  max: number;
  level: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function XpProgress({
  current,
  max,
  level,
  showLabel = true,
  size = 'md',
  className,
}: XpProgressProps) {
  const percentage = Math.min(Math.round((current / max) * 100), 100);

  const sizeConfig = {
    sm: { bar: 'h-1.5', text: 'text-xs', badge: 'text-[10px] px-1.5 py-0.5' },
    md: { bar: 'h-2.5', text: 'text-sm', badge: 'text-xs px-2 py-0.5' },
    lg: { bar: 'h-4', text: 'text-base', badge: 'text-sm px-2.5 py-1' },
  };

  const config = sizeConfig[size];

  return (
    <div className={cn('space-y-1.5', className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'font-semibold rounded-full bg-primary/15 text-primary border border-primary/20',
                config.badge
              )}
            >
              LVL {level}
            </span>
            <span className={cn('text-muted-foreground', config.text)}>
              {current.toLocaleString()} / {max.toLocaleString()} XP
            </span>
          </div>
          <span className={cn('text-muted-foreground font-mono', config.text)}>
            {percentage}%
          </span>
        </div>
      )}
      <div className={cn('relative w-full overflow-hidden rounded-full bg-primary/10', config.bar)}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-emerald-400 to-primary"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], ease: 'easeOut' }}
        />
        {size === 'lg' && percentage > 10 && (
          <div className="absolute inset-0 shimmer rounded-full" />
        )}
      </div>
    </div>
  );
}
