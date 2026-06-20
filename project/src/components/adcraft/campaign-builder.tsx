'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCampaignBuilderStore } from '@/stores/campaign-builder-store';
import { CampaignBriefing } from './campaign-briefing';
import { CampaignWorkshop } from './campaign-workshop';
import { CampaignScoring } from './campaign-scoring';
import { CampaignReview } from './campaign-review';

interface CampaignBuilderProps {
  onBack: () => void;
}

export function CampaignBuilder({ onBack }: CampaignBuilderProps) {
  const { phase, resetSimulation } = useCampaignBuilderStore();

  const handleBack = () => {
    resetSimulation();
    onBack();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
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
            <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25">
              <Layout className="h-4 w-4 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">Campaign Builder</h2>
          </div>
        </div>
        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20 text-[10px]">
          {phase === 'briefing' && 'BRIEFING'}
          {phase === 'workshop' && 'BUILDING'}
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
          {phase === 'briefing' && <CampaignBriefing />}
          {phase === 'workshop' && <CampaignWorkshop />}
          {phase === 'scoring' && <CampaignScoring />}
          {phase === 'review' && <CampaignReview onBack={handleBack} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
