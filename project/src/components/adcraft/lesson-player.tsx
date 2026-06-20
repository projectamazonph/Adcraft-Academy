'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Zap,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { getLessonContent, listModuleLessons } from '@/app/actions/lesson';
import { markLessonComplete, getLessonProgress } from '@/app/actions/progress';
import type { LessonMeta, LessonProgressItem } from '@/app/actions/types';

interface LessonPlayerProps {
  moduleNumber: number;
  lessonOrder: number;
  onBack: () => void;
  onComplete: (moduleNumber: number, lessonOrder: number, xpEarned: number) => void;
}

export function LessonPlayer({ moduleNumber, lessonOrder, onBack, onComplete }: LessonPlayerProps) {
  const [lessons, setLessons] = useState<LessonMeta[]>([]);
  const [body, setBody] = useState<string>('');
  const [meta, setMeta] = useState<LessonMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(lessonOrder);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());

  // Load lesson list on mount
  useEffect(() => {
    listModuleLessons(moduleNumber).then((res) => {
      if (res.success) setLessons(res.data);
    });
  }, [moduleNumber]);

  // Load persisted progress on mount
  useEffect(() => {
    getLessonProgress(moduleNumber).then((res) => {
      if (res.success) {
        const completed = new Set(
          res.data
            .filter((lp: LessonProgressItem) => lp.status === 'COMPLETED')
            .map((lp: LessonProgressItem) => lp.lessonNumber)
        );
        setCompletedLessons(completed);
      }
    });
  }, [moduleNumber]);

  // Load lesson content when currentOrder changes
  useEffect(() => {
    setLoading(true);
    getLessonContent(moduleNumber, currentOrder).then((res) => {
      if (res.success) {
        setMeta(res.data.meta);
        setBody(res.data.body);
      }
      setLoading(false);
    });
  }, [moduleNumber, currentOrder]);

  const handleComplete = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const result = await markLessonComplete(moduleNumber, currentOrder);
      if (result.success) {
        setCompletedLessons((prev) => {
          const next = new Set(prev);
          next.add(currentOrder);
          return next;
        });
        onComplete(moduleNumber, currentOrder, result.data.xpEarned);
      }
    } finally {
      setSaving(false);
    }
  }, [currentOrder, moduleNumber, onComplete, saving]);

  const goToLesson = useCallback((order: number) => {
    setCurrentOrder(order);
  }, []);

  const currentIndex = lessons.findIndex((l) => l.lessonNumber === currentOrder);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  const progressPercent = lessons.length > 0
    ? Math.round((completedLessons.size / lessons.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading lesson...</span>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Lesson not found</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onBack}>
          Back to Modules
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back to Modules
        </Button>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1 text-[10px]">
            <Clock className="h-3 w-3" />
            {meta.estimatedMinutes} min
          </Badge>
          <Badge variant="outline" className="gap-1 text-[10px] bg-primary/10 text-primary border-primary/20">
            <Zap className="h-3 w-3" />
            {meta.xpReward} XP
          </Badge>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Module {moduleNumber} Progress</span>
          <span>{completedLessons.size}/{lessons.length} lessons</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      {/* Lesson sidebar nav (horizontal) */}
      {lessons.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {lessons.map((lesson) => {
            const isActive = lesson.lessonNumber === currentOrder;
            const isDone = completedLessons.has(lesson.lessonNumber);
            return (
              <button
                key={lesson.lessonNumber}
                onClick={() => goToLesson(lesson.lessonNumber)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                  isActive
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : isDone
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
                )}
              >
                <span className="flex items-center gap-1.5">
                  {isDone && <CheckCircle2 className="h-3 w-3" />}
                  {lesson.lessonNumber}. {lesson.title.replace(/^.+:\s*/, '')}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Lesson content */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Lesson header */}
          <div className="bg-muted/30 px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">
                LESSON {meta.lessonNumber}
              </span>
              <Badge variant="outline" className="text-[10px] ml-2">
                {meta.type === 'simulation-prep' ? 'Simulation Prep' : 'Reading'}
              </Badge>
            </div>
            <h1 className="text-xl font-bold">{meta.title}</h1>
          </div>

          {/* Markdown body */}
          <div className="prose prose-sm prose-invert max-w-none px-6 py-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          </div>

          {/* Lesson footer with nav + complete */}
          <Separator />
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              {prevLesson ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={() => goToLesson(prevLesson.lessonNumber)}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
              ) : (
                <div />
              )}
            </div>
            <div className="flex items-center gap-2">
              {completedLessons.has(currentOrder) ? (
                <Badge className="gap-1 bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed
                </Badge>
              ) : (
                <Button size="sm" className="gap-2" onClick={handleComplete} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {saving ? 'Saving...' : 'Mark Complete'}
                </Button>
              )}
              {nextLesson ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => goToLesson(nextLesson.lessonNumber)}
                >
                  Next
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button size="sm" className="gap-2" onClick={onBack}>
                  Finish Module
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
