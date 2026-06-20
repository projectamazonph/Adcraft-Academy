'use client';

import { create } from 'zustand';
import type {
  BidScenario,
  BidDecision,
  BidElevatorEvaluation,
  SimulationContext,
  PpcRawData,
} from '@/engine';
import {
  evaluateBidElevator,
  previewBidElevatorScore,
} from '@/engine';
import {
  startAttempt,
  gradeBidElevatorAttempt,
} from '@/app/actions/simulation';
import fixtureData from '../../fixtures/bid-elevator-pack-1.json';

// ---------------------------------------------------------------------------
// Fixture → Engine type mapping
// ---------------------------------------------------------------------------

interface FixtureScenario {
  id: string;
  keyword: string;
  matchType: string;
  currentBid: number;
  suggestedBidRange: { min: number; recommended: number; max: number };
  currentPerformance: PpcRawData;
  marketContext: {
    averageCpc: number;
    competitionLevel: 'low' | 'medium' | 'high';
    searchVolumeTrend: 'rising' | 'stable' | 'declining';
    productMargin: number;
    breakEvenAcos: number;
  };
  optimalBid: number;
  acceptableRange: { min: number; max: number };
  reasoning: string;
}

function mapFixtureToScenarios(scenarios: FixtureScenario[]): BidScenario[] {
  return scenarios.map((s) => ({
    id: s.id,
    keyword: s.keyword,
    matchType: s.matchType as 'broad' | 'phrase' | 'exact',
    currentBid: s.currentBid,
    suggestedBidRange: s.suggestedBidRange,
    currentPerformance: s.currentPerformance,
    marketContext: s.marketContext,
    optimalBid: s.optimalBid,
    acceptableRange: s.acceptableRange,
    reasoning: s.reasoning,
  }));
}

// Build simulation context from fixture thresholds
function buildContext(): SimulationContext {
  return {
    type: 'bid-elevator',
    moduleId: 'bidding-lab',
    difficulty: 'intermediate',
    userLevel: 1,
    timeLimitSeconds: null,
    products: [
      {
        asin: fixtureData.productContext.asin,
        title: fixtureData.productContext.title,
        category: fixtureData.category,
        price: fixtureData.productContext.price,
        margin: fixtureData.productContext.margin,
        averageSpend: 0,
        averageSales: 0,
        averageOrders: 0,
      },
    ],
    thresholds: {
      acosTarget: fixtureData.thresholds.acosTarget,
      tacosTarget: fixtureData.thresholds.tacosTarget,
      ctrMinimum: fixtureData.thresholds.ctrMinimum,
      conversionRateMinimum: fixtureData.thresholds.conversionRateMinimum,
      cpcMaximum: fixtureData.thresholds.cpcMaximum,
      roasMinimum: fixtureData.thresholds.roasMinimum,
    },
    seed: 42,
  };
}

// Pre-compute static data once
const SCENARIOS = mapFixtureToScenarios(fixtureData.scenarios as FixtureScenario[]);
const SIM_CONTEXT = buildContext();

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

export type BidPhase = 'briefing' | 'arena' | 'scoring' | 'review';

export interface BidElevatorStore {
  phase: BidPhase;
  scenarios: BidScenario[];
  decisions: BidDecision[];
  currentScenarioIndex: number;
  startTime: number | null;
  scenarioStartTime: number | null;
  elapsedTime: number;
  evaluation: BidElevatorEvaluation | null;
  previewScore: number;
  officialScore: number | null;
  scoreDiscrepancy: boolean;
  xpEarned: number;
  attemptId: string | null;
  isGrading: boolean;
  productContext: typeof fixtureData.productContext;
  thresholds: typeof fixtureData.thresholds;

  // Actions
  startSimulation: (userId?: string) => void;
  submitBid: (bidAmount: number) => void;
  submitAllDecisions: () => void;
  goToReview: () => void;
  resetSimulation: () => void;
  tick: () => void;
}

export const useBidElevatorStore = create<BidElevatorStore>((set, get) => ({
  phase: 'briefing',
  scenarios: SCENARIOS,
  decisions: [],
  currentScenarioIndex: 0,
  startTime: null,
  scenarioStartTime: null,
  elapsedTime: 0,
  evaluation: null,
  previewScore: 0,
  officialScore: null,
  scoreDiscrepancy: false,
  xpEarned: 0,
  attemptId: null,
  isGrading: false,
  productContext: fixtureData.productContext,
  thresholds: fixtureData.thresholds,

  startSimulation: (userId?: string) => {
    set({
      phase: 'arena',
      startTime: Date.now(),
      scenarioStartTime: Date.now(),
      elapsedTime: 0,
      decisions: [],
      currentScenarioIndex: 0,
      evaluation: null,
      previewScore: 0,
      officialScore: null,
      scoreDiscrepancy: false,
      xpEarned: 0,
      attemptId: null,
      isGrading: false,
    });

    // Start server-side attempt record (non-blocking)
    startAttempt({
      userId: userId || undefined,
      simulationType: 'BID_ELEVATOR',
      simulationSlug: 'bid-elevator',
    }).then((result) => {
      if (result.success) {
        set({ attemptId: result.data.attemptId });
      }
    }).catch(() => {
      console.warn('[Bid Elevator] Failed to start server attempt');
    });
  },

  submitBid: (bidAmount: number) => {
    const { scenarios, decisions, scenarioStartTime, currentScenarioIndex, startTime, attemptId, previewScore } = get();
    const scenario = scenarios[currentScenarioIndex];
    if (!scenario) return;

    const decisionTimeMs = scenarioStartTime ? Date.now() - scenarioStartTime : 0;

    const decision: BidDecision = {
      scenarioId: scenario.id,
      bidAmount,
      timestamp: Date.now(),
      decisionTimeMs,
    };

    const newDecisions = [...decisions, decision];
    const nextIndex = currentScenarioIndex + 1;

    // Compute preview score
    const preview = previewBidElevatorScore(newDecisions, scenarios);

    set({
      decisions: newDecisions,
      currentScenarioIndex: nextIndex,
      scenarioStartTime: Date.now(),
      previewScore: preview,
    });

    // If all scenarios are done, auto-submit
    if (nextIndex >= scenarios.length) {
      const evaluation = evaluateBidElevator(scenarios, newDecisions, SIM_CONTEXT);
      const timeSpentSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

      set({
        phase: 'scoring',
        evaluation,
        xpEarned: Math.round(evaluation.score * 2),
      });

      // Server-side grading (authoritative) — non-blocking
      if (attemptId) {
        set({ isGrading: true });
        gradeBidElevatorAttempt({
          attemptId,
          previewScore,
          scenarios,
          decisions: newDecisions,
          context: SIM_CONTEXT,
          timeSpentSeconds,
        }).then((result) => {
          if (result.success) {
            set({
              officialScore: result.data.officialScore,
              scoreDiscrepancy: result.data.scoreDiscrepancy,
              xpEarned: result.data.xpEarned,
              isGrading: false,
            });
          } else {
            set({ isGrading: false });
          }
        }).catch(() => {
          set({ isGrading: false });
        });
      }
    }
  },

  submitAllDecisions: () => {
    const { scenarios, decisions, startTime, attemptId, previewScore } = get();
    const evaluation = evaluateBidElevator(scenarios, decisions, SIM_CONTEXT);
    const timeSpentSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

    set({
      phase: 'scoring',
      evaluation,
      xpEarned: Math.round(evaluation.score * 2),
    });

    if (attemptId) {
      set({ isGrading: true });
      gradeBidElevatorAttempt({
        attemptId,
        previewScore,
        scenarios,
        decisions,
        context: SIM_CONTEXT,
        timeSpentSeconds,
      }).then((result) => {
        if (result.success) {
          set({
            officialScore: result.data.officialScore,
            scoreDiscrepancy: result.data.scoreDiscrepancy,
            xpEarned: result.data.xpEarned,
            isGrading: false,
          });
        } else {
          set({ isGrading: false });
        }
      }).catch(() => {
        set({ isGrading: false });
      });
    }
  },

  goToReview: () => {
    set({ phase: 'review' });
  },

  resetSimulation: () => {
    set({
      phase: 'briefing',
      decisions: [],
      currentScenarioIndex: 0,
      startTime: null,
      scenarioStartTime: null,
      elapsedTime: 0,
      evaluation: null,
      previewScore: 0,
      officialScore: null,
      scoreDiscrepancy: false,
      xpEarned: 0,
      attemptId: null,
      isGrading: false,
    });
  },

  tick: () => {
    const { startTime } = get();
    if (!startTime) return;
    set({ elapsedTime: Math.round((Date.now() - startTime) / 1000) });
  },
}));

// Expose fixture-level constants for components
export { SCENARIOS, SIM_CONTEXT, fixtureData };
