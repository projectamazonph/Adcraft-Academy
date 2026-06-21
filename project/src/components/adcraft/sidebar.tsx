'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  FlaskConical,
  Bot,
  Menu,
  X,
  ChevronLeft,
  Zap,
  Trophy,
  Users,
  BarChart3,
  Award,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';

export type NavTab = 'dashboard' | 'modules' | 'simulations' | 'mentor' | 'leaderboard' | 'analytics' | 'admin' | 'certificate' | 'team';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userName?: string;
  userLevel?: number;
  userXP?: number;
}

const navItems: { id: NavTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'modules', label: 'Modules', icon: BookOpen },
  { id: 'simulations', label: 'Simulations', icon: FlaskConical },
  { id: 'mentor', label: 'AI Mentor', icon: Bot },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'certificate', label: 'Certificate', icon: Award },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'admin', label: 'Admin', icon: BarChart3 },
];

export function Sidebar({
  activeTab,
  onTabChange,
  userName: userNameProp,
  userLevel = 1,
  userXP = 0,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();

  // Use session name if available, fallback to prop, then to email prefix
  const userName = session?.user?.name || userNameProp || session?.user?.email?.split('@')[0] || 'User';

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — use explicit display classes to avoid tailwind-merge conflicts */}
      <motion.aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full border-r border-border bg-card/80 backdrop-blur-xl transition-all duration-300',
          // Desktop: always flex; Mobile: only flex when open
          'hidden lg:flex',
          mobileOpen && '!flex',
          collapsed ? 'w-[68px]' : 'w-[240px]',
        )}
        animate={
          typeof window !== 'undefined' && window.innerWidth >= 1024
            ? { width: collapsed ? 68 : 240 }
            : {}
        }
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
        style={{
          width: collapsed ? 68 : 240,
          flexDirection: 'column',
        }}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 p-4 pb-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-hidden"
            >
              <h1 className="text-base font-bold tracking-tight">
                AdCraft
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
                PPC Command Center
              </p>
            </motion.div>
          )}
        </div>

        <Separator className="mx-3" />

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 h-10 transition-all',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileOpen(false);
                }}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />
                {!collapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                  />
                )}
              </Button>
            );
          })}
        </nav>

        <Separator className="mx-3" />

        {/* Collapse toggle (desktop) */}
        <div className="p-2 hidden lg:block">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              className={cn(
                'h-4 w-4 transition-transform',
                collapsed && 'rotate-180'
              )}
            />
          </Button>
        </div>

        {/* User section */}
        <div
          className={cn(
            'p-3 border-t border-border',
            collapsed ? 'flex justify-center' : ''
          )}
        >
          <div
            className={cn(
              'flex items-center gap-3',
              collapsed && 'flex-col gap-1'
            )}
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold border border-primary/20">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-[10px] text-muted-foreground">
                  Level {userLevel} · {userXP.toLocaleString()} XP
                </p>
              </div>
            )}
            {!collapsed && session && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
