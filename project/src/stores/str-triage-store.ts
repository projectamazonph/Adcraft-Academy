'use client';

import { create } from 'zustand';
import type {
  SearchTermEntry,
  StrUserAction,
  StrAction,
  StrExpectedAction,
  StrTriageEvaluation,
  SimulationContext,
} from '@/engine';
import {
  evaluateStrTriage,
  previewStrTriageScore,
} from '@/engine';
import {
  startAttempt,
  gradeStrTriageAttempt,
} from '@/app/actions/simulation';
import fixtureData from '../../fixtures/str-triage-pack-1.json';

// ---------------------------------------------------------------------------
// Fixture → Engine type mapping
// ---------------------------------------------------------------------------

interface FixtureSearchTerm {
  id: string;
  searchTerm: string;
  keyword: string;
  matchType: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  cpc: number;
  orders: number;
  unitsSold: number;
  sales: number;
  acos: number;
  roas: number;
  recommendedAction: string;
  reasoning: string;
  weight: number;
}

function mapFixtureToSearchTerms(terms: FixtureSearchTerm[]): SearchTermEntry[] {
  return terms.map((t) => ({
    id: t.id,
    searchTerm: t.searchTerm,
    keyword: t.keyword,
    matchType: t.matchType as 'broad' | 'phrase' | 'exact',
    impressions: t.impressions,
    clicks: t.clicks,
    ctr: t.ctr,
    spend: t.spend,
    cpc: t.cpc,
    orders: t.orders,
    unitsSold: t.unitsSold,
    sales: t.sales,
    acos: t.acos,
    roas: t.roas,
  }));
}

function mapFixtureToExpected(terms: FixtureSearchTerm[]): StrExpectedAction[] {
  return terms.map((t) => ({
    searchTermId: t.id,
    action: t.recommendedAction as StrAction,
    reasoning: t.reasoning,
    weight: t.weight,
  }));
}

// Build simulation context from fixture thresholds
function buildContext(): SimulationContext {
  return {
    type: 'str-triage-arena',
    moduleId: 'search-term-triage',
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
const SEARCH_TERMS = mapFixtureToSearchTerms(fixtureData.searchTerms as FixtureSearchTerm[]);
const EXPECTED_ACTIONS = mapFixtureToExpected(fixtureData.searchTerms as FixtureSearchTerm[]);
const SIM_CONTEXT = buildContext();

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

export type Phase = 'briefing' | 'triage' | 'scoring' | 'review';

export interface StrTriageStore {
  phase: Phase;
  searchTerms: SearchTermEntry[];
  userActions: Record<string, StrUserAction>;
  startTime: number | null;
  elapsedTime: number;
  evaluation: StrTriageEvaluation | null;
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
  setAction: (searchTermId: string, action: StrAction, newBid?: number, negativeKeyword?: string) => void;
  submitDecisions: () => void;
  goToReview: () => void;
  resetSimulation: () => void;
  tick: () => void;
}

export const useStrTriageStore = create<StrTriageStore>((set, get) => ({
  phase: 'briefing',
  searchTerms: SEARCH_TERMS,
  userActions: {},
  startTime: null,
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
      phase: 'triage',
      startTime: Date.now(),
      elapsedTime: 0,
      userActions: {},
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
      simulationType: 'STR_TRIAGE_ARENA',
      simulationSlug: 'str-triage-arena',
    }).then((result) => {
      if (result.success) {
        set({ attemptId: result.data.attemptId });
      }
    }).catch(() => {
      // Server action failed — simulation still works client-side
      console.warn('[STR Triage] Failed to start server attempt');
    });
  },

  setAction: (searchTermId, action, newBid, negativeKeyword) => {
    const userAction: StrUserAction = {
      searchTermId,
      action,
      newBid: action === 'optimize-bid' ? newBid : undefined,
      negativeKeyword:
        action === 'negate-exact' || action === 'negate-phrase'
          ? negativeKeyword
          : undefined,
      timestamp: Date.now(),
    };

    const newActions = { ...get().userActions, [searchTermId]: userAction };
    const actionsList = Object.values(newActions);

    // Compute preview score
    const preview = previewStrTriageScore(
      SEARCH_TERMS,
      actionsList,
      EXPECTED_ACTIONS
    );

    set({
      userActions: newActions,
      previewScore: preview,
    });
  },

  submitDecisions: () => {
    const { searchTerms, userActions, startTime, attemptId, previewScore } = get();
    const actionsList = Object.values(userActions);

    // Fill in missing actions as "keep" defaults
    const completeActions: StrUserAction[] = searchTerms.map((st) => {
      const existing = actionsList.find((a) => a.searchTermId === st.id);
      return (
        existing ?? {
          searchTermId: st.id,
          action: 'keep' as StrAction,
          timestamp: Date.now(),
        }
      );
    });

    // Client-side evaluation (instant)
    const evaluation = evaluateStrTriage(
      searchTerms,
      completeActions,
      EXPECTED_ACTIONS,
      SIM_CONTEXT
    );

    const timeSpentSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

    set({
      phase: 'scoring',
      evaluation,
      xpEarned: Math.round(evaluation.score * 2),
    });

    // Server-side grading (authoritative) — non-blocking
    if (attemptId) {
      set({ isGrading: true });
      gradeStrTriageAttempt({
        attemptId,
        previewScore,
        searchTerms,
        userActions: completeActions,
        expectedActions: EXPECTED_ACTIONS,
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
      userActions: {},
      startTime: null,
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
export { SEARCH_TERMS, EXPECTED_ACTIONS, SIM_CONTEXT, fixtureData };
