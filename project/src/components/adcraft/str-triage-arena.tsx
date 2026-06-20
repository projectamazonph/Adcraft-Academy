'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStrTriageStore } from '@/stores/str-triage-store';
import { StrBriefing } from './str-briefing';
import { StrDataGrid } from './str-data-grid';
import { StrScoring } from './str-scoring';
import { StrReview } from './str-review';

interface StrTriageArenaProps {
  onBack: () => void;
}

export function StrTriageArena({ onBack }: StrTriageArenaProps) {
  const { phase, resetSimulation } = useStrTriageStore();

  const handleBack = () => {
    resetSimulation();
    onBack();
  };

  return (
    <div className="space-y-4">
      {/* Arena header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleBack}
            aria-label="Back to Simulations"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/25">
              <Shield className="h-4 w-4 text-rose-400" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">STR Triage Arena</h2>
          </div>
        </div>
        <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/25 hover:bg-rose-500/20 text-[10px]">
          {phase === 'briefing' && 'BRIEFING'}
          {phase === 'triage' && 'TRIAGE'}
          {phase === 'scoring' && 'SCORING'}
          {phase === 'review' && 'REVIEW'}
        </Badge>
      </div>

      {/* Phase content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.3 }}
        >
          {phase === 'briefing' && <StrBriefing />}
          {phase === 'triage' && <StrDataGrid />}
          {phase === 'scoring' && <StrScoring />}
          {phase === 'review' && <StrReview onBack={handleBack} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
