'use client';

import { motion } from 'framer-motion';
import {
  BookOpen,
  FlaskConical,
  Flame,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
} from 'recharts';

interface StatsRowProps {
  modulesCompleted: number;
  totalModules: number;
  simsPassed: number;
  totalSims: number;
  streakDays: number;
  totalXP: number;
}

const colorMap: Record<string, { bg: string; border: string; text: string; fill: string; stroke: string }> = {
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    fill: '#34d399',
    stroke: '#34d399',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    fill: '#fbbf24',
    stroke: '#fbbf24',
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    fill: '#fb7185',
    stroke: '#fb7185',
  },
  violet: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    text: 'text-violet-400',
    fill: '#a78bfa',
    stroke: '#a78bfa',
  },
};

export function StatsRow({
  modulesCompleted,
  totalModules,
  simsPassed,
  totalSims,
  streakDays,
  totalXP,
}: StatsRowProps) {
  const stats = [
    {
      label: 'Modules Completed',
      value: `${modulesCompleted} / ${totalModules}`,
      icon: BookOpen,
      trend: modulesCompleted > 0 ? `+${modulesCompleted} this week` : 'Start your first module!',
      color: 'emerald',
      hasProgress: modulesCompleted > 0,
    },
    {
      label: 'Simulations Passed',
      value: `${simsPassed} / ${totalSims}`,
      icon: FlaskConical,
      trend: simsPassed > 0 ? `${simsPassed} passed so far` : 'Complete modules to unlock',
      color: 'amber',
      hasProgress: simsPassed > 0,
    },
    {
      label: 'Current Streak',
      value: `${streakDays} day${streakDays !== 1 ? 's' : ''}`,
      icon: Flame,
      trend: streakDays > 0 ? 'Keep it going!' : 'Start your streak!',
      color: 'rose',
      hasProgress: streakDays > 0,
    },
    {
      label: 'Total XP',
      value: totalXP.toLocaleString(),
      icon: Zap,
      trend: totalXP > 0 ? 'Earn XP by completing lessons' : 'Earn XP by completing lessons',
      color: 'violet',
      hasProgress: totalXP > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const colors = colorMap[stat.color];
        const Icon = stat.icon;

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1],  0.4, delay: index * 0.1 }}
            className={`relative overflow-hidden rounded-xl border ${colors.border} ${colors.bg} backdrop-blur-sm p-4`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${colors.bg} border ${colors.border}`}>
                    <Icon className={`h-4 w-4 ${colors.text}`} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.trend}</p>
              </div>
              <div className="w-20 h-10 opacity-50">
                {stat.hasProgress ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[{ v: 0 }, { v: stat.value === '0' ? 0 : 30 }, { v: 50 }, { v: 40 }, { v: 60 }, { v: 55 }, { v: 70 }]}>
                      <defs>
                        <linearGradient id={`gradient-${stat.color}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={colors.fill} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={colors.fill} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke={colors.stroke}
                        strokeWidth={1.5}
                        fill={`url(#gradient-${stat.color})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-end gap-[3px]">
                    {[25, 40, 30, 45, 28, 35, 20].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-current opacity-10"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
