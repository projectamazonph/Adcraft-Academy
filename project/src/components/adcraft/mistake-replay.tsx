'use client';

/**
 * AdCraft: "Explain My Mistake" Replay Panel (Phase 3)
 *
 * Slide-over review panel showing detailed mistake analysis
 * for a completed quiz attempt. Integrates with quiz results screen.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  Lightbulb,
  TrendingUp,
  ArrowRight,
  BarChart3,
  Brain,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import type { MistakeAnalysisResult } from '@/app/actions/mistake-analysis';

const mistakeIcons: Record<string, typeof Lightbulb> = {
  'formula-error': TrendingUp,
  'logic-error': Brain,
  'knowledge-gap': BookOpen,
  'misread-data': BarChart3,
  'careless-error': AlertTriangle,
  'confused-terms': Brain,
  'threshold-error': BarChart3,
};

const mistakeColors: Record<string, string> = {
  'formula-error': 'text-orange-400',
  'logic-error': 'text-violet-400',
  'knowledge-gap': 'text-blue-400',
  'misread-data': 'text-yellow-400',
  'careless-error': 'text-rose-400',
  'confused-terms': 'text-purple-400',
  'threshold-error': 'text-amber-400',
};

const mistakeBgColors: Record<string, string> = {
  'formula-error': 'bg-orange-500/10 border-orange-500/20',
  'logic-error': 'bg-violet-500/10 border-violet-500/20',
  'knowledge-gap': 'bg-blue-500/10 border-blue-500/20',
  'misread-data': 'bg-yellow-500/10 border-yellow-500/20',
  'careless-error': 'bg-rose-500/10 border-rose-500/20',
  'confused-terms': 'bg-purple-500/10 border-purple-500/20',
  'threshold-error': 'bg-amber-500/10 border-amber-500/20',
};

interface MistakeReplayProps {
  analysis: MistakeAnalysisResult;
  onClose: () => void;
}

export function MistakeReplay({ analysis, onClose }: MistakeReplayProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);

  const correctCount = analysis.mistakeAnalyses.filter((m) => m.isCorrect).length;
  const mistakeCount = analysis.mistakeAnalyses.filter((m) => !m.isCorrect).length;
  const scorePercent = analysis.score;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="fixed inset-y-0 right-0 w-full max-w-xl z-50 bg-card border-l border-border shadow-2xl"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Review Answers</h2>
            <p className="text-sm text-muted-foreground">{analysis.title}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Score Summary */}
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{scorePercent}%</div>
                    <div className="text-xs text-muted-foreground mt-1">Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">{correctCount}</div>
                    <div className="text-xs text-muted-foreground mt-1">Correct</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-rose-400">{mistakeCount}</div>
                    <div className="text-xs text-muted-foreground mt-1">Incorrect</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-400">{analysis.weakAreas.length}</div>
                    <div className="text-xs text-muted-foreground mt-1">Weak Areas</div>
                  </div>
                </div>
                <Progress value={scorePercent} className="h-2" />
              </CardContent>
            </Card>

            {/* Weak Areas */}
            {analysis.weakAreas.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Areas to Improve
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.weakAreas.map((area) => (
                    <Badge key={area.concept} variant="secondary" className="text-xs capitalize">
                      {area.concept} ({area.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Modules */}
            {analysis.recommendedModules.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-400" />
                  Recommended Review
                </h3>
                <div className="space-y-2">
                  {analysis.recommendedModules.map((mod) => (
                    <div
                      key={mod.moduleNumber}
                      className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10"
                    >
                      <BookOpen className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Module {mod.moduleNumber}</p>
                        <p className="text-xs text-muted-foreground">{mod.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Question-by-Question Review */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Question Details
              </h3>
              <div className="space-y-3">
                {analysis.mistakeAnalyses.map((qa, index) => (
                  <div key={index}>
                    <button
                      onClick={() =>
                        setSelectedQuestion(selectedQuestion === index ? null : index)
                      }
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        qa.isCorrect
                          ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
                          : qa.mistakeType
                            ? `${mistakeBgColors[qa.mistakeType]} hover:opacity-80`
                            : 'bg-card/50 border-border/50 hover:bg-card/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {qa.isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{qa.questionText}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                Your answer: <span className={qa.isCorrect ? 'text-emerald-400' : 'text-rose-400'}>{qa.selectedLabel}</span>
                              </span>
                              {!qa.isCorrect && (
                                <>
                                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-emerald-400">
                                    Correct: {qa.correctLabel}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {!qa.isCorrect && qa.mistakeType && (
                          <Badge
                            variant="outline"
                            className={`shrink-0 text-xs capitalize ${
                              mistakeColors[qa.mistakeType]
                            }`}
                          >
                            {qa.mistakeLabel}
                          </Badge>
                        )}
                      </div>
                    </button>

                    {/* Expanded explanation */}
                    <AnimatePresence>
                      {selectedQuestion === index && !qa.isCorrect && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 ml-4 border-l-2 border-border bg-card/30 rounded-r-lg">
                            {/* Mistake type explanation */}
                            {qa.mistakeType && (
                              <div className="flex items-start gap-2 mb-3">
                                {(() => {
                                  const Icon =
                                    mistakeIcons[qa.mistakeType] || Lightbulb;
                                  return (
                                    <Icon
                                      className={`h-4 w-4 mt-0.5 shrink-0 ${
                                        mistakeColors[qa.mistakeType] || 'text-blue-400'
                                      }`}
                                    />
                                  );
                                })()}
                                <div>
                                  <p className="text-sm font-medium capitalize">
                                    {qa.mistakeLabel}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {qa.suggestion}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Concept tags */}
                            {qa.conceptTags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {qa.conceptTags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-[10px] capitalize"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  );
}
