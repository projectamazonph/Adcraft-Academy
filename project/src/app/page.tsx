'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  MousePointerClick,
  ArrowUpRight,
  Zap,
  Calculator,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import dynamic from 'next/dynamic';
import { Sidebar, type NavTab } from '@/components/adcraft/sidebar';
import { Dashboard } from '@/components/adcraft/dashboard';

// Dynamic imports for heavy components — loaded only when needed
const MentorChat = dynamic(() => import('@/components/adcraft/mentor-chat').then((m) => ({ default: m.MentorChat })), {
  loading: () => <div className="flex items-center justify-center h-96 text-sm text-muted-foreground">Loading AI Mentor...</div>,
});
const StrTriageArena = dynamic(() => import('@/components/adcraft/str-triage-arena').then((m) => ({ default: m.StrTriageArena })), {
  loading: () => <div className="flex items-center justify-center h-96 text-sm text-muted-foreground">Loading STR Triage Arena...</div>,
});
const BidElevator = dynamic(() => import('@/components/adcraft/bid-elevator').then((m) => ({ default: m.BidElevator })), {
  loading: () => <div className="flex items-center justify-center h-96 text-sm text-muted-foreground">Loading Bid Elevator...</div>,
});
const CampaignBuilder = dynamic(() => import('@/components/adcraft/campaign-builder').then((m) => ({ default: m.CampaignBuilder })), {
  loading: () => <div className="flex items-center justify-center h-96 text-sm text-muted-foreground">Loading Campaign Builder...</div>,
});
const FormulaCalculator = dynamic(() => import('@/components/adcraft/formula-calculator').then((m) => ({ default: m.FormulaCalculator })), {
  loading: () => <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">Loading Calculator...</div>,
});
const LessonPlayer = dynamic(() => import('@/components/adcraft/lesson-player').then((m) => ({ default: m.LessonPlayer })), {
  loading: () => <div className="flex items-center justify-center h-96 text-sm text-muted-foreground">Loading Lesson...</div>,
});
import { Leaderboard } from '@/components/adcraft/leaderboard';
import { getCheatSheet } from '@/app/actions/cheatsheet';
import { AnalyticsDashboard } from '@/components/adcraft/analytics-dashboard';
import { AdminAnalytics } from '@/components/adcraft/admin-analytics';
import { CertificateManager } from '@/components/adcraft/certificate-manager';
import { getUserStats } from '@/app/actions/simulation';
import { TeamDashboard } from '@/components/adcraft/team-dashboard';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

// --- Module data for the Modules view ---
interface ModuleDetail {
  number: number;
  title: string;
  slug: string;
  icon: LucideIcon;
  color: string;
  description: string;
  lessons: { title: string; duration: string; status: 'locked' | 'available' | 'complete' }[];
  status: 'locked' | 'available' | 'in-progress' | 'complete';
}

const moduleDetails: ModuleDetail[] = [
  {
    number: 0,
    title: 'Onboarding',
    slug: 'onboarding',
    icon: Rocket,
    color: 'emerald',
    description: 'Welcome, platform tour, first simulation intro',
    status: 'available',
    lessons: [
      { title: 'Welcome to AdCraft', duration: '5 min', status: 'available' },
      { title: 'Platform Tour & Navigation', duration: '8 min', status: 'available' },
      { title: 'Your First PPC Simulation', duration: '10 min', status: 'available' },
    ],
  },
  {
    number: 1,
    title: 'Foundations',
    slug: 'foundations',
    icon: BookOpen,
    color: 'sky',
    description: 'PPC basics, key metrics (CPC, ACoS, TACoS, RoAS)',
    status: 'available',
    lessons: [
      { title: 'Understanding PPC Metrics: The Big Six', duration: '10 min', status: 'available' },
      { title: 'CPC & CTR Deep Dive', duration: '12 min', status: 'available' },
      { title: 'ACoS, TACoS & Profitability', duration: '15 min', status: 'available' },
      { title: 'ROAS: Measuring Return', duration: '10 min', status: 'available' },
      { title: 'Metrics in Practice', duration: '12 min', status: 'available' },
    ],
  },
  {
    number: 4,
    title: 'Campaign Architecture',
    slug: 'campaign-architecture',
    icon: Layout,
    color: 'amber',
    description: 'Sponsored Products, Brands, Display',
    status: 'available',
    lessons: [
      { title: 'Sponsored Products: The Workhorse', duration: '12 min', status: 'available' },
      { title: 'Sponsored Brands & Display', duration: '12 min', status: 'available' },
      { title: 'Campaign Structure: Control & Scale', duration: '14 min', status: 'available' },
      { title: 'Campaign Architecture in Practice', duration: '10 min', status: 'available' },
    ],
  },
  {
    number: 6,
    title: 'Bidding Lab',
    slug: 'bidding-lab',
    icon: TrendingUp,
    color: 'rose',
    description: 'Bid strategies, position economics, budget pacing',
    status: 'available',
    lessons: [
      { title: 'Bid Strategies: Fixed, Dynamic Up & Down', duration: '12 min', status: 'available' },
      { title: 'Placement Adjustments & Bid Multipliers', duration: '12 min', status: 'available' },
      { title: 'Bid Elevator Prep: Ready to Bid', duration: '8 min', status: 'available' },
    ],
  },
  {
    number: 7,
    title: 'Search Term Triage',
    slug: 'search-term-triage',
    icon: Filter,
    color: 'violet',
    description: 'Negative keywords, STR analysis, optimization',
    status: 'available',
    lessons: [
      { title: 'Search Term Analysis: Reading the Data', duration: '14 min', status: 'available' },
      { title: 'Negative Keywords: The Most Underused Profit Lever', duration: '12 min', status: 'available' },
      { title: 'STR Triage Prep: Ready to Triage', duration: '8 min', status: 'available' },
    ],
  },
];

const moduleColorConfig: Record<string, {
  bg: string;
  border: string;
  text: string;
  accent: string;
  progressFill: string;
}> = {
  emerald: {
    bg: 'bg-emerald-500/8',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    accent: 'bg-emerald-500/15',
    progressFill: 'bg-emerald-400',
  },
  sky: {
    bg: 'bg-sky-500/8',
    border: 'border-sky-500/20',
    text: 'text-sky-400',
    accent: 'bg-sky-500/15',
    progressFill: 'bg-sky-400',
  },
  amber: {
    bg: 'bg-amber-500/8',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    accent: 'bg-amber-500/15',
    progressFill: 'bg-amber-400',
  },
  rose: {
    bg: 'bg-rose-500/8',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    accent: 'bg-rose-500/15',
    progressFill: 'bg-rose-400',
  },
  violet: {
    bg: 'bg-violet-500/8',
    border: 'border-violet-500/20',
    text: 'text-violet-400',
    accent: 'bg-violet-500/15',
    progressFill: 'bg-violet-400',
  },
};

const lessonStatusIcon: Record<string, LucideIcon> = {
  locked: Lock,
  available: PlayCircle,
  complete: CheckCircle2,
};

// --- Simulation data for the Simulations view ---
interface SimDetail {
  type: string;
  title: string;
  description: string;
  icon: LucideIcon;
  difficulty: string;
  moduleRef: number;
  features: string[];
  estimatedTime: string;
}

const simulationDetails: SimDetail[] = [
  {
    type: 'campaign-builder',
    title: 'Campaign Builder',
    description:
      'Build complete campaign structures with keywords, bids, and budgets. Choose ad types, set targeting, and optimize for performance in this hands-on simulation.',
    icon: MousePointerClick,
    difficulty: 'Intermediate',
    moduleRef: 4,
    features: [
      'Create SP, SB, and SD campaigns',
      'Keyword research & selection',
      'Budget allocation strategies',
      'Bid configuration & placement adjustments',
    ],
    estimatedTime: '25-35 min',
  },
  {
    type: 'bid-elevator',
    title: 'Bid Elevator',
    description:
      'Practice bidding decisions across real-world scenarios with instant feedback. Learn when to raise, lower, or maintain bids based on performance data.',
    icon: ArrowUpRight,
    difficulty: 'Intermediate',
    moduleRef: 6,
    features: [
      'Dynamic bid adjustment practice',
      'Position vs. profitability trade-offs',
      'Budget pacing scenarios',
      'Performance-based bid optimization',
    ],
    estimatedTime: '15-20 min',
  },
  {
    type: 'str-triage-arena',
    title: 'STR Triage Arena',
    description:
      'Analyze search terms and make keep/pause/negate decisions under time pressure. Build speed and accuracy in search term optimization.',
    icon: Filter,
    difficulty: 'Advanced',
    moduleRef: 7,
    features: [
      'Timed search term analysis',
      'Keep / Pause / Negate decisions',
      'Pattern recognition training',
      'Score-based progression',
    ],
    estimatedTime: '10-15 min',
  },
];

const simColorMap: Record<string, {
  gradient: string;
  border: string;
  accent: string;
  text: string;
}> = {
  'campaign-builder': {
    gradient: 'from-emerald-500/10 to-teal-400/5',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    accent: 'bg-emerald-500/12 border-emerald-500/20',
    text: 'text-emerald-400',
  },
  'bid-elevator': {
    gradient: 'from-amber-500/10 to-orange-400/5',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    accent: 'bg-amber-500/12 border-amber-500/20',
    text: 'text-amber-400',
  },
  'str-triage-arena': {
    gradient: 'from-rose-500/10 to-pink-400/5',
    border: 'border-rose-500/20 hover:border-rose-500/40',
    accent: 'bg-rose-500/12 border-rose-500/20',
    text: 'text-rose-400',
  },
};

// --- Page Component ---
export default function Home() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [activeSimulation, setActiveSimulation] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<{ moduleNumber: number; lessonOrder: number } | null>(null);
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load initial user stats from DB
  useEffect(() => {
    getUserStats()
      .then((res) => {
        if (res.success) {
          setUserXP(res.data.xp);
          setUserLevel(res.data.level);
        }
      })
      .catch((err) => {
        console.warn('[Home] getUserStats failed, using defaults:', err);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userName={session?.user?.name || session?.user?.email?.split('@')[0]}
        userLevel={userLevel}
        userXP={userXP}
      />

      {/* Main content */}
      <main className="flex-1 lg:pl-[240px] transition-all duration-300">
        {/* Top nav bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-2xl border-b border-white/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center justify-between px-4 lg:px-6 h-14">
            <div className="flex items-center gap-3 pl-12 lg:pl-0">
              <Zap className="h-4 w-4 text-primary lg:hidden" />
              <h1 className="text-sm font-semibold lg:hidden">AdCraft</h1>
              <span className="hidden lg:inline text-sm text-muted-foreground">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'modules' && 'Learning Modules'}
                {activeTab === 'simulations' && (activeSimulation === 'str-triage-arena' ? 'STR Triage Arena' : activeSimulation === 'bid-elevator' ? 'Bid Elevator' : activeSimulation === 'campaign-builder' ? 'Campaign Builder' : 'Simulations')}
                {activeTab === 'leaderboard' && 'Leaderboard'}
                {activeTab === 'admin' && 'Admin'}
                {activeTab === 'certificate' && 'Certificate'}
                {activeTab === 'analytics' && 'Analytics'}
                {activeTab === 'mentor' && 'AI Mentor'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/20">
                <Zap className="h-3 w-3" />
                {userXP} XP
              </Badge>
              <div className="h-2 w-2 rounded-full bg-emerald-400" title="Online" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === 'dashboard' && (
                <Dashboard key={refreshKey} onNavigate={setActiveTab} />
              )}

              {activeTab === 'modules' && (
                activeLesson ? (
                  <LessonPlayer
                    moduleNumber={activeLesson.moduleNumber}
                    lessonOrder={activeLesson.lessonOrder}
                    onBack={() => setActiveLesson(null)}
                    onComplete={(_mod, _lesson, xpEarned) => {
                      // Update XP and level in real-time
                      if (xpEarned > 0) {
                        setUserXP((prev) => {
                          const newXP = prev + xpEarned;
                          setUserLevel(Math.max(1, Math.floor(newXP / 500) + 1));
                          return newXP;
                        });
                        setRefreshKey((prev) => prev + 1);
                      }
                    }}
                  />
                ) : (
                  <ModulesView onOpenLesson={setActiveLesson} />
                )
              )}

              {activeTab === 'simulations' && (
                activeSimulation === 'str-triage-arena' ? (
                  <StrTriageArena onBack={() => setActiveSimulation(null)} />
                ) : activeSimulation === 'bid-elevator' ? (
                  <BidElevator onBack={() => setActiveSimulation(null)} />
                ) : activeSimulation === 'campaign-builder' ? (
                  <CampaignBuilder onBack={() => setActiveSimulation(null)} />
                ) : (
                  <SimulationsView onLaunchSim={setActiveSimulation} />
                )
              )}

              {activeTab === 'mentor' && (
                <MentorChat
                  moduleNumber={activeLesson?.moduleNumber}
                  lessonSlug={activeLesson ? `${activeLesson.moduleNumber}.${activeLesson.lessonOrder}` : undefined}
                />
              )}

              {activeTab === 'leaderboard' && <Leaderboard />}
              {activeTab === 'analytics' && <AnalyticsDashboard />}
              {activeTab === 'admin' && <AdminAnalytics />}
              {activeTab === 'certificate' && <CertificateManager />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="lg:pl-[240px] border-t border-border mt-auto">
        <div className="px-4 lg:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">
              AdCraft — Amazon PPC Command Center
            </span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground/60">
            <span className="font-mono">v0.1.0</span>
            <span>·</span>
            <span>5 Modules · 3 Simulations</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Modules View ---
function ModulesView({ onOpenLesson }: { onOpenLesson: (lesson: { moduleNumber: number; lessonOrder: number } | null) => void }) {
  const [expandedModule, setExpandedModule] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Learning Modules</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Complete modules in order to unlock simulations and advance your PPC expertise
        </p>
      </div>

      <div className="space-y-4">
        {moduleDetails.map((module, index) => {
          const colors = moduleColorConfig[module.color];
          const Icon = module.icon;
          const isLocked = module.status === 'locked';
          const progressValue = module.status === 'complete' ? 100 : module.status === 'in-progress' ? 35 : 0;
          const isExpanded = expandedModule === module.number;
          const hasCalculator = module.number === 1;

          return (
            <div key={module.number}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <Card
                  className={cn(
                    'overflow-hidden transition-colors',
                    colors.border,
                    isLocked && 'opacity-60'
                  )}
                >
                  <CardContent className="p-0">
                    {/* Module header */}
                    <div className="flex items-start gap-4 p-5 pb-3">
                      <div className={cn('p-2.5 rounded-xl border', colors.accent, colors.border)}>
                        <Icon className={cn('h-5 w-5', colors.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">
                            MODULE {module.number}
                          </span>
                          {isLocked ? (
                            <Badge variant="outline" className="text-[10px] gap-1 bg-muted/50 text-muted-foreground border-border">
                              <Lock className="h-3 w-3" />
                              Locked
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
                              <PlayCircle className="h-3 w-3" />
                              Available
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold">{module.title}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {module.description}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={cn('text-lg font-bold font-mono', colors.text)}>
                          {progressValue}%
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          {module.lessons.length} lessons
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="px-5 pb-3">
                      <div className={cn('h-1.5 w-full overflow-hidden rounded-full', colors.bg)}>
                        <motion.div
                          className={cn('h-full rounded-full', colors.progressFill)}
                          initial={{ width: 0 }}
                          animate={{ width: `${progressValue}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + index * 0.08 }}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Lesson breakdown */}
                    <div className="divide-y divide-border">
                      {module.lessons.map((lesson, lessonIdx) => {
                        const LessonIcon = lessonStatusIcon[lesson.status];
                        const lessonOrder = lessonIdx + 1;
                        const isClickable = !isLocked && lesson.status !== 'locked';
                        return (
                          <div
                            key={lessonIdx}
                            className={cn(
                              'flex items-center gap-3 px-5 py-3 transition-colors',
                              isClickable ? 'hover:bg-muted/30 cursor-pointer' : 'cursor-default'
                            )}
                            onClick={() => {
                              if (isClickable) onOpenLesson({ moduleNumber: module.number, lessonOrder });
                            }}
                          >
                            <LessonIcon
                              className={cn(
                                'h-4 w-4 shrink-0',
                                lesson.status === 'complete'
                                  ? 'text-emerald-400'
                                  : lesson.status === 'available'
                                  ? 'text-primary'
                                  : 'text-muted-foreground/50'
                              )}
                            />
                            <span
                              className={cn(
                                'flex-1 text-sm',
                                lesson.status === 'locked' && 'text-muted-foreground/60'
                              )}
                            >
                              {lesson.title}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono shrink-0">
                              {lesson.duration}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Module action area */}
                    {!isLocked && (
                      <div className="px-5 py-3 bg-muted/20 flex items-center gap-3">
                        <Button size="sm" className="gap-2" onClick={() => onOpenLesson({ moduleNumber: module.number, lessonOrder: 1 })}>
                          <PlayCircle className="h-3.5 w-3.5" />
                          Start Module {module.number}
                        </Button>
                        {hasCalculator && (
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              'gap-2 border-sky-500/25 text-sky-400 hover:bg-sky-500/10 hover:text-sky-300',
                              isExpanded && 'bg-sky-500/10'
                            )}
                            onClick={() => setExpandedModule(isExpanded ? null : module.number)}
                          >
                            <Calculator className="h-3.5 w-3.5" />
                            {isExpanded ? 'Hide Calculator' : 'Formula Calculator'}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Expandable Formula Calculator for Module 1 */}
              <AnimatePresence>
                {isExpanded && hasCalculator && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4">
                      <FormulaCalculator moduleRef={module.number} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Simulations View ---
function SimulationsView({ onLaunchSim }: { onLaunchSim: (sim: string | null) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Simulations</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Hands-on PPC practice scenarios — complete modules to unlock each simulation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {simulationDetails.map((sim, index) => {
          const colors = simColorMap[sim.type];
          const Icon = sim.icon;
          const isUnlocked = sim.type === 'str-triage-arena' || sim.type === 'bid-elevator' || sim.type === 'campaign-builder';

          return (
            <motion.div
              key={sim.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={isUnlocked ? { y: -3 } : {}}
            >
              <Card
                glass
                className={cn(
                  'relative overflow-hidden transition-all h-full flex flex-col',
                  colors.border,
                  !isUnlocked && 'opacity-70'
                )}
              >
                {/* Gradient background */}
                <div
                  className={cn(
                    'absolute inset-0 bg-gradient-to-br opacity-20',
                    colors.gradient
                  )}
                />

                <CardHeader className="relative pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-3 rounded-xl border', colors.accent)}>
                        <Icon className={cn('h-6 w-6', colors.text)} />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">
                          {sim.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px]',
                              sim.difficulty === 'Advanced'
                                ? 'bg-rose-500/15 text-rose-400 border-rose-500/20'
                                : 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                            )}
                          >
                            {sim.difficulty}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {sim.estimatedTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="relative flex-1 flex flex-col space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {sim.description}
                  </p>

                  {/* Features list */}
                  <div className="space-y-2 flex-1">
                    <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                      What you&apos;ll practice
                    </p>
                    <ul className="space-y-1.5">
                      {sim.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <Circle className="h-1.5 w-1.5 fill-current shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Launch button */}
                  <div className="pt-2">
                    {isUnlocked ? (
                      <Button
                        size="sm"
                        className={cn(
                          'w-full gap-2 text-white',
                          sim.type === 'bid-elevator'
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : sim.type === 'campaign-builder'
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-rose-600 hover:bg-rose-700'
                        )}
                        onClick={() => onLaunchSim(sim.type)}
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        Launch Simulation
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="w-full gap-2"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Complete Module {sim.moduleRef} to Unlock
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
