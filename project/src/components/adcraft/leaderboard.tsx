'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getLeaderboard, type LeaderboardEntry } from '@/app/actions/leaderboard';

const rankColors = ['text-yellow-400', 'text-gray-400', 'text-amber-600'];
const rankBg = ['bg-yellow-400/10', 'bg-gray-400/10', 'bg-amber-600/10'];

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard().then((res) => {
      if (res.success) setEntries(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Trophy className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Leaderboard</h2>
          <p className="text-sm text-muted-foreground">Top learners by XP</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No learners yet.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {entries.map((entry, i) => (
              <div key={i} className={cn(
                'flex items-center gap-4 px-5 py-3.5',
                i !== entries.length - 1 && 'border-b border-border'
              )}>
                <div className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold shrink-0',
                  i < 3 ? `${rankBg[i]} ${rankColors[i]}` : 'text-muted-foreground bg-muted'
                )}>
                  {i < 3 ? <Medal className="h-4 w-4" /> : entry.rank}
                </div>
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {entry.avatarLetter}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{entry.name}</p>
                  <p className="text-xs text-muted-foreground">{entry.modulesCompleted} modules · Level {entry.level}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold font-mono">{entry.xp.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">XP</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
