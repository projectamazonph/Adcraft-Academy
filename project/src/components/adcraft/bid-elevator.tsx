'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBidElevatorStore } from '@/stores/bid-elevator-store';
import { BidBriefing } from './bid-briefing';
import { BidArena } from './bid-arena';
import { BidScoring } from './bid-scoring';
import { BidReview } from './bid-review';

interface BidElevatorProps {
  onBack: () => void;
}

export function BidElevator({ onBack }: BidElevatorProps) {
  const { phase, resetSimulation } = useBidElevatorStore();

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
            <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/25">
              <TrendingUp className="h-4 w-4 text-amber-400" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">Bid Elevator</h2>
          </div>
        </div>
        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/20 text-[10px]">
          {phase === 'briefing' && 'BRIEFING'}
          {phase === 'arena' && 'BIDDING'}
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
          {phase === 'briefing' && <BidBriefing />}
          {phase === 'arena' && <BidArena />}
          {phase === 'scoring' && <BidScoring />}
          {phase === 'review' && <BidReview onBack={handleBack} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
