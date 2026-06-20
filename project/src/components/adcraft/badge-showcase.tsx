'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Target,
  Award,
  GraduationCap,
  Star,
  FlaskConical,
  Crown,
  Trophy,
  Zap,
  Flame,
  Bot,
  CheckCircle2,
  Lock,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getBadges, checkAndAwardBadges } from '@/app/actions/badge';
import type { BadgeView } from '@/app/actions/types';

// Icon mapping — maps badge fixture icon strings to Lucide components
const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  Target,
  Award,
  GraduationCap,
  Star,
  FlaskConical,
  Crown,
  Trophy,
  Zap,
  Flame,
  Bot,
  CheckCircle2,
};

// Tier color configuration
const tierConfig: Record<string, {
  bg: string;
  border: string;
  text: string;
  glow: string;
  iconBg: string;
  progressColor: string;
  label: string;
}> = {
  BRONZE: {
    bg: 'bg-orange-500/8',
    border: 'border-orange-500/20',
    text: 'text-orange-400',
    glow: 'shadow-orange-500/20',
    iconBg: 'bg-orange-500/15',
    progressColor: 'bg-orange-400',
    label: 'Bronze',
  },
  SILVER: {
    bg: 'bg-slate-400/8',
    border: 'border-slate-400/20',
    text: 'text-slate-300',
    glow: 'shadow-slate-300/20',
    iconBg: 'bg-slate-400/15',
    progressColor: 'bg-slate-300',
    label: 'Silver',
  },
  GOLD: {
    bg: 'bg-yellow-500/8',
    border: 'border-yellow-500/20',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-500/20',
    iconBg: 'bg-yellow-500/15',
    progressColor: 'bg-yellow-400',
    label: 'Gold',
  },
  PLATINUM: {
    bg: 'bg-violet-500/8',
    border: 'border-violet-500/20',
    text: 'text-violet-400',
    glow: 'shadow-violet-500/20',
    iconBg: 'bg-violet-500/15',
    progressColor: 'bg-violet-400',
    label: 'Platinum',
  },
};

// Category labels
const categoryLabels: Record<string, { label: string; icon: LucideIcon }> = {
  ENGAGEMENT: { label: 'Engagement', icon: BookOpen },
  MASTERY: { label: 'Mastery', icon: Trophy },
  XP_MILESTONE: { label: 'XP Milestones', icon: Zap },
  STREAK: { label: 'Streak', icon: Flame },
  SOCIAL: { label: 'Social', icon: Bot },
};

export function BadgeShowcase() {
  const [badges, setBadges] = useState<BadgeView[]>([]);
  const [loading, setLoading] = useState(true);
  const [newlyEarned, setNewlyEarned] = useState<BadgeView[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeView | null>(null);

  const loadBadges = useCallback(async () => {
    // First check if any new badges were earned
    const awardResult = await checkAndAwardBadges();
    if (awardResult.success && awardResult.data.newlyAwarded.length > 0) {
      setNewlyEarned(awardResult.data.newlyAwarded);
      setShowNotification(true);
    }

    // Then fetch all badges with earned status
    const res = await getBadges();
    if (res.success) {
      setBadges(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const earnedCount = badges.filter((b) => b.isEarned).length;
  const totalCount = badges.length;
  const progressPercent = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  // Group badges by category
  const grouped = badges.reduce<Record<string, BadgeView[]>>((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {});

  const categoryOrder = ['ENGAGEMENT', 'MASTERY', 'XP_MILESTONE', 'STREAK', 'SOCIAL'];

  if (loading) {
    return (
      <Card className="border-primary/15">
        <CardContent className="py-8 text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted/30 rounded w-1/3 mx-auto" />
            <div className="h-2 bg-muted/20 rounded w-1/2 mx-auto" />
            <div className="grid grid-cols-4 gap-3 mt-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-20 bg-muted/20 rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Badge Notification Toast */}
      <AnimatePresence>
        {showNotification && newlyEarned.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 max-w-sm"
          >
            <Card className="border-yellow-500/30 bg-card/95 backdrop-blur-xl shadow-lg shadow-yellow-500/10">
              <CardContent className="py-4 px-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/15 border border-yellow-500/20">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {newlyEarned.length === 1
                        ? 'New Badge Earned!'
                        : `${newlyEarned.length} New Badges Earned!`}
                    </p>
                    <div className="mt-1 space-y-1">
                      {newlyEarned.map((badge) => {
                        const tier = tierConfig[badge.tier] || tierConfig.BRONZE;
                        const Icon = iconMap[badge.icon] || Award;
                        return (
                          <div key={badge.id} className="flex items-center gap-2">
                            <Icon className={cn('h-3.5 w-3.5', tier.text)} />
                            <span className="text-xs text-muted-foreground">{badge.title}</span>
                            {badge.xpReward > 0 && (
                              <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 gap-0.5 bg-primary/5 text-primary/70 border-primary/10">
                                +{badge.xpReward} XP
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => setShowNotification(false)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge Showcase Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.4 }}
      >
        <Card className="border-primary/15">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                </div>
                <CardTitle className="text-lg font-semibold">Achievement Badges</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] gap-1 bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                  {earnedCount}/{totalCount}
                </Badge>
              </div>
            </div>
            {/* Progress bar */}
            <div className="space-y-1 mt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-yellow-500/10">
                <motion.div
                  className="h-full rounded-full bg-yellow-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.5, ease: 'easeOut' }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {earnedCount === 0
                  ? 'Complete lessons and quizzes to earn your first badge!'
                  : `${progressPercent}% complete — ${totalCount - earnedCount} more to unlock`}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {categoryOrder.map((category) => {
              const categoryBadges = grouped[category];
              if (!categoryBadges || categoryBadges.length === 0) return null;

              const catInfo = categoryLabels[category] || { label: category, icon: Award };
              const CatIcon = catInfo.icon;
              const earnedInCategory = categoryBadges.filter((b) => b.isEarned).length;

              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <CatIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {catInfo.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 ml-auto">
                      {earnedInCategory}/{categoryBadges.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                    {categoryBadges.map((badge, index) => {
                      const tier = tierConfig[badge.tier] || tierConfig.BRONZE;
                      const Icon = iconMap[badge.icon] || Award;
                      const isEarned = badge.isEarned;

                      return (
                        <motion.div
                          key={badge.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.05 * index }}
                          whileHover={{ scale: 1.03 }}
                          className="cursor-pointer"
                          onClick={() => setSelectedBadge(badge)}
                        >
                          <div
                            className={cn(
                              'relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all',
                              isEarned
                                ? cn(tier.bg, tier.border, `shadow-sm ${tier.glow}`)
                                : 'bg-muted/20 border-border/50 opacity-50',
                            )}
                          >
                            {/* Badge icon */}
                            <div
                              className={cn(
                                'p-2 rounded-xl border',
                                isEarned
                                  ? cn(tier.iconBg, tier.border)
                                  : 'bg-muted/30 border-border/30',
                              )}
                            >
                              {isEarned ? (
                                <Icon className={cn('h-5 w-5', tier.text)} />
                              ) : (
                                <Lock className="h-5 w-5 text-muted-foreground/40" />
                              )}
                            </div>

                            {/* Badge info */}
                            <div className="text-center">
                              <p
                                className={cn(
                                  'text-[10px] font-semibold leading-tight',
                                  isEarned ? 'text-foreground' : 'text-muted-foreground/50',
                                )}
                              >
                                {badge.title}
                              </p>
                              {isEarned && badge.xpReward > 0 && (
                                <p className="text-[8px] text-primary/60 mt-0.5">
                                  +{badge.xpReward} XP
                                </p>
                              )}
                            </div>

                            {/* Tier indicator */}
                            {isEarned && (
                              <div
                                className={cn(
                                  'absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card',
                                  badge.tier === 'BRONZE' && 'bg-orange-400',
                                  badge.tier === 'SILVER' && 'bg-slate-300',
                                  badge.tier === 'GOLD' && 'bg-yellow-400',
                                  badge.tier === 'PLATINUM' && 'bg-violet-400',
                                )}
                              />
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="border-primary/20">
                <CardContent className="py-8 px-6 text-center space-y-4">
                  {/* Badge icon */}
                  <div className="flex justify-center">
                    <div
                      className={cn(
                        'p-4 rounded-2xl border',
                        selectedBadge.isEarned
                          ? cn(tierConfig[selectedBadge.tier]?.iconBg, tierConfig[selectedBadge.tier]?.border)
                          : 'bg-muted/30 border-border/30',
                      )}
                    >
                      {selectedBadge.isEarned ? (
                        (() => {
                          const Icon = iconMap[selectedBadge.icon] || Award;
                          return <Icon className={cn('h-10 w-10', tierConfig[selectedBadge.tier]?.text)} />;
                        })()
                      ) : (
                        <Lock className="h-10 w-10 text-muted-foreground/40" />
                      )}
                    </div>
                  </div>

                  {/* Badge details */}
                  <div>
                    <h3 className="text-lg font-bold">{selectedBadge.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{selectedBadge.description}</p>
                  </div>

                  {/* Tier + Category */}
                  <div className="flex items-center justify-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] gap-1',
                        tierConfig[selectedBadge.tier]?.bg,
                        tierConfig[selectedBadge.tier]?.border,
                        tierConfig[selectedBadge.tier]?.text,
                      )}
                    >
                      {tierConfig[selectedBadge.tier]?.label}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] gap-1 bg-muted/30 text-muted-foreground border-border/30">
                      {categoryLabels[selectedBadge.category]?.label || selectedBadge.category}
                    </Badge>
                  </div>

                  {/* XP reward */}
                  {selectedBadge.xpReward > 0 && (
                    <Badge variant="outline" className="text-xs gap-1 bg-primary/10 text-primary border-primary/20">
                      <Zap className="h-3 w-3" />
                      +{selectedBadge.xpReward} XP
                    </Badge>
                  )}

                  {/* Earned date */}
                  {selectedBadge.isEarned && selectedBadge.earnedAt && (
                    <p className="text-[10px] text-muted-foreground/60">
                      Earned {new Date(selectedBadge.earnedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  )}

                  {/* Close button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setSelectedBadge(null)}
                  >
                    Close
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
