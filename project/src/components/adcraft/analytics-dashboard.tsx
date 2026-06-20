'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Clock,
  BookOpen,
  Brain,
  MessageSquare,
  Target,
  Loader2,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getAnalytics, type AnalyticsData } from '@/app/actions/analytics';

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then((res) => {
      if (res.success) setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const eventLabels: Record<string, string> = {
    lesson_started: 'Lesson Started',
    lesson_completed: 'Lesson Completed',
    quiz_started: 'Quiz Started',
    quiz_completed: 'Quiz Completed',
    simulation_started: 'Sim Started',
    simulation_graded: 'Sim Graded',
    mentor_chat: 'Mentor Chat',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <BarChart3 className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Your Analytics</h2>
          <p className="text-sm text-muted-foreground">Learning stats and activity</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !data ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No data yet. Start learning!</CardContent></Card>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Sessions', value: data.totalSessions, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Time (min)', value: data.totalTimeMinutes, icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Lessons Done', value: data.lessonsCompleted, icon: BookOpen, color: 'text-violet-400', bg: 'bg-violet-500/10' },
              { label: 'Avg Sim Score', value: `${data.avgSimScore}%`, icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', stat.bg)}>
                        <Icon className={cn('h-4 w-4', stat.color)} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="text-lg font-bold font-mono">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Progress stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4 text-violet-400" /> Quizzes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {data.quizzesPassed}<span className="text-sm font-normal text-muted-foreground">/{data.quizzesAttempted}</span>
                </p>
                <p className="text-xs text-muted-foreground">passed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-cyan-400" /> Mentor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.mentorChats}</p>
                <p className="text-xs text-muted-foreground">chats</p>
              </CardContent>
            </Card>
          </div>

          {/* Event breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Activity Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.eventsByType.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No events recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.eventsByType.map((e) => (
                    <div key={e.eventType} className="flex items-center justify-between">
                      <span className="text-sm">{eventLabels[e.eventType] || e.eventType}</span>
                      <Badge variant="secondary">{e.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No recent activity.</p>
              ) : (
                <div className="space-y-1.5">
                  {data.recentActivity.map((e, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>{eventLabels[e.eventType] || e.eventType}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(e.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </motion.div>
  );
}
