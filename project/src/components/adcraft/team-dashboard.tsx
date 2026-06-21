'use client';

/**
 * AdCraft: Team Dashboard (Phase 3)
 *
 * Card grid per learner with progress, streak, cert status, health.
 * Manager wizard for org setup and member invitations.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Mail,
  X,
  Award,
  TrendingUp,
  Flame,
  CheckCircle2,
  Loader2,
  BarChart3,
  BookOpen,
  UserPlus,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getTeamDashboard,
  getMyOrganization,
  createOrganization,
  inviteMember,
} from '@/app/actions/team';
import type { TeamDashboardData } from '@/app/actions/team';

function getHealthColor(member: { modulesCompleted: number; streakDays: number; lastActive: string; quizAvgScore: number }): 'green' | 'amber' | 'red' {
  const daysSinceActive = (Date.now() - new Date(member.lastActive).getTime()) / 86400000;
  if (member.modulesCompleted >= 4 && daysSinceActive < 7) return 'green';
  if (member.modulesCompleted >= 2 && daysSinceActive < 14) return 'amber';
  return 'red';
}

const healthConfig = {
  green: { label: 'On Track', color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
  amber: { label: 'At Risk', color: 'text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-400' },
  red: { label: 'Struggling', color: 'text-rose-400', bg: 'bg-rose-500/10', dot: 'bg-rose-400' },
};

export function TeamDashboard() {
  const [data, setData] = useState<TeamDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [hasOrg, setHasOrg] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [orgRes, teamRes] = await Promise.all([
      getMyOrganization(),
      getTeamDashboard().catch(() => null),
    ]);
    setHasOrg(!!orgRes.data?.org);
    if (teamRes?.success && teamRes.data) {
      setData(teamRes.data);
    }
    setLoading(false);
  }

  async function handleCreateOrg() {
    if (!orgName.trim()) return;
    setCreating(true);
    setError(null);
    const res = await createOrganization(orgName.trim());
    setCreating(false);
    if (res.success) {
      setShowWizard(false);
      loadData();
    } else {
      setError(res.error || 'Failed to create organization');
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setError(null);
    const res = await inviteMember(inviteEmail.trim());
    setInviting(false);
    if (res.success) {
      setInviteEmail('');
      loadData();
    } else {
      setError(res.error || 'Failed to invite member');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No org — show wizard prompt
  if (!hasOrg) {
    return (
      <div className="max-w-xl mx-auto py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        >
          <Card className="text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 inline-block">
                <Building2 className="h-12 w-12 text-violet-400" />
              </div>
              <CardTitle>Set Up Your Team</CardTitle>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Create an organization to track your team&apos;s progress, invite members, and monitor learning outcomes.
              </p>
              <Button onClick={() => setShowWizard(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Organization
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <AnimatePresence>
          {showWizard && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            >
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <CardTitle className="text-base">Create Organization</CardTitle>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Organization name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                    <Button onClick={handleCreateOrg} disabled={creating || !orgName.trim()}>
                      {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                    </Button>
                  </div>
                  {error && <p className="text-xs text-red-400">{error}</p>}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No team data available</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      className="space-y-6"
    >
      {/* Org header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-violet-400" />
            {data.orgName}
          </h2>
          <p className="text-sm text-muted-foreground">{data.memberCount} members</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowWizard(!showWizard)}>
          <UserPlus className="h-3.5 w-3.5" />
          Invite Member
        </Button>
      </div>

      <AnimatePresence>
        {showWizard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            <Card>
              <CardContent className="pt-4 space-y-3">
                <CardTitle className="text-sm">Invite by Email</CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="colleague@agency.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    type="email"
                  />
                  <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} size="sm">
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Invite'}
                  </Button>
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Org stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card/50">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{data.orgAvgXP.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Avg XP</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{data.orgAvgCompletion}%</div>
            <p className="text-xs text-muted-foreground">Avg Completion</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{data.members.filter((m) => m.certStatus === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Certified</p>
          </CardContent>
        </Card>
      </div>

      {/* Member grid */}
      <div className="grid gap-4">
        {data.members.map((member, i) => {
          const health = getHealthColor(member);
          const hc = healthConfig[health];
          return (
            <motion.div
              key={member.userId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              <Card className={`hover:border-${health === 'green' ? 'emerald' : health === 'amber' ? 'amber' : 'rose'}-500/20 transition-colors`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-xs">
                        {(member.name || member.email).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {member.name || member.email.split('@')[0]}
                        </p>
                        <span className={`h-2 w-2 rounded-full ${hc.dot}`} />
                        <span className={`text-[10px] ${hc.color}`}>{hc.label}</span>
                        {member.role !== 'MEMBER' && (
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {member.role.toLowerCase()}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {member.modulesCompleted}/{member.totalModules} modules
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {member.xp.toLocaleString()} XP
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          {member.streakDays}d
                        </span>
                        {member.certStatus === 'active' && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Award className="h-3 w-3" />
                            Certified
                          </span>
                        )}
                      </div>
                      <Progress
                        value={(member.modulesCompleted / member.totalModules) * 100}
                        className="h-1.5 mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
