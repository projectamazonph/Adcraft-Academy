'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, BarChart3, BookOpen, Brain, Trophy, Activity,
  MessageSquare, Target, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getAdminStats, type AdminStats } from '@/app/actions/admin';

export function AdminAnalytics() {
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats().then(r => { if (r.success) setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <BarChart3 className="h-5 w-5 text-rose-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Admin Analytics</h2>
          <p className="text-sm text-muted-foreground">Aggregate platform stats</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : !data ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No data yet.</CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Users', value: data.totalUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Lessons Done', value: data.lessonsCompletedTotal, icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Sims Graded', value: data.simsGradedTotal, icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Total XP', value: data.totalXpAwarded.toLocaleString(), icon: Trophy, color: 'text-violet-400', bg: 'bg-violet-500/10' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <Card key={s.label}><CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg', s.bg)}><Icon className={cn('h-4 w-4', s.color)} /></div>
                    <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-lg font-bold font-mono">{s.value}</p></div>
                  </div>
                </CardContent></Card>
              );
            })}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Active Today', value: data.activeToday, icon: Activity, color: 'text-cyan-400' },
              { label: 'Active This Week', value: data.activeThisWeek, icon: Activity, color: 'text-emerald-400' },
              { label: 'Modules Completed', value: data.modulesCompletedTotal, icon: Trophy, color: 'text-yellow-400' },
              { label: 'Quizzes Passed', value: data.quizzesPassedTotal, icon: Brain, color: 'text-purple-400' },
              { label: 'Mentor Chats', value: data.mentorChatsTotal, icon: MessageSquare, color: 'text-sky-400' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <Card key={s.label}><CardContent className="py-3 flex items-center gap-3">
                  <Icon className={cn('h-4 w-4 shrink-0', s.color)} />
                  <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-sm font-bold">{s.value}</p></div>
                </CardContent></Card>
              );
            })}
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Module Completion Rates</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.moduleCompletionRates.map(m => (
                <div key={m.moduleNumber}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Module {m.moduleNumber}: {m.title}</span>
                    <span className="text-muted-foreground">{m.completed}/{m.enrolled} ({m.rate}%)</span>
                  </div>
                  <Progress value={m.rate} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </motion.div>
  );
}
