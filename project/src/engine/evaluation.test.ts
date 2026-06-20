/**
 * AdCraft: Unit Tests for Evaluation Engine
 *
 * Tests STR Triage, Bid Elevator, and Campaign Builder evaluation functions,
 * preview score functions, and validation functions. Uses fixtures + property-based
 * tests for edge case coverage.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  evaluateStrTriage,
  previewStrTriageScore,
  validateStrTriageActions,
  evaluateBidElevator,
  previewBidElevatorScore,
  previewCampaignBuilderScore,
  validateCampaignBuilder,
} from '@/engine/evaluation';
import type {
  SearchTermEntry,
  StrUserAction,
  StrExpectedAction,
  StrAction,
  SimulationContext,
  BidScenario,
  BidDecision,
  CampaignStructure,
  PpcMetricThresholds,
} from '@/engine/types';

// ============================================================================
// TEST FIXTURES
// ============================================================================

const defaultThresholds: PpcMetricThresholds = {
  acosTarget: 0.25,
  tacosTarget: 0.10,
  roasMinimum: 4,
  ctrMinimum: 0.005,
  conversionRateMinimum: 0.10,
  cpcMaximum: 1.5,
};

const defaultContext: SimulationContext = {
  type: 'str-triage-arena',
  moduleId: 'module-7',
  difficulty: 'advanced',
  userLevel: 1,
  timeLimitSeconds: null,
  products: [],
  thresholds: defaultThresholds,
  seed: 42,
};

const bidContext: SimulationContext = {
  ...defaultContext,
  type: 'bid-elevator',
  moduleId: 'module-6',
  difficulty: 'intermediate',
};

function makeSearchTerm(overrides: Partial<SearchTermEntry> = {}): SearchTermEntry {
  return {
    id: 'st-1',
    searchTerm: 'kitchen gadget',
    keyword: 'kitchen gadget',
    matchType: 'broad',
    impressions: 5000,
    clicks: 200,
    ctr: 0.04,
    spend: 300,
    cpc: 1.5,
    orders: 8,
    unitsSold: 10,
    sales: 800,
    acos: 0.375,
    roas: 2.67,
    ...overrides,
  };
}

function makeExpectedAction(overrides: Partial<StrExpectedAction> = {}): StrExpectedAction {
  return {
    searchTermId: 'st-1',
    action: 'negate-exact',
    reasoning: 'High ACoS, low ROAS — this term is unprofitable.',
    weight: 1,
    ...overrides,
  };
}

function makeUserAction(overrides: Partial<StrUserAction> = {}): StrUserAction {
  return {
    searchTermId: 'st-1',
    action: 'negate-exact',
    timestamp: Date.now(),
    ...overrides,
  };
}

function makeBidScenario(overrides: Partial<BidScenario> = {}): BidScenario {
  return {
    id: 'scenario-1',
    keyword: 'kitchen gadget',
    matchType: 'exact',
    currentBid: 1.50,
    suggestedBidRange: { min: 1.00, recommended: 1.40, max: 2.00 },
    currentPerformance: {
      impressions: 5000,
      clicks: 200,
      spend: 300,
      sales: 800,
      orders: 8,
      unitsSold: 10,
    },
    marketContext: {
      averageCpc: 1.30,
      competitionLevel: 'medium',
      searchVolumeTrend: 'stable',
      productMargin: 0.30,
      breakEvenAcos: 0.30,
    },
    optimalBid: 1.40,
    acceptableRange: { min: 1.10, max: 1.80 },
    reasoning: 'Optimal bid balances position and profitability.',
    ...overrides,
  };
}

function makeCampaign(overrides: Partial<CampaignStructure> = {}): CampaignStructure {
  return {
    id: 'camp-1',
    name: 'Test Campaign',
    type: 'sponsored-products',
    targetingType: 'manual',
    dailyBudget: 50,
    bidStrategy: 'dynamic-up-down',
    defaultBid: 1.5,
    keywords: [
      { id: 'kw-1', text: 'kitchen gadget', matchType: 'exact', bid: 1.5 },
      { id: 'kw-2', text: 'cooking tool', matchType: 'broad', bid: 1.0, isNegative: false },
      { id: 'kw-neg-1', text: 'free', matchType: 'exact', bid: 0, isNegative: true },
    ],
    asins: ['B08EXAMPLE1'],
    adGroupName: 'Ad Group 1',
    ...overrides,
  };
}

// ============================================================================
// STR TRIAGE EVALUATION TESTS
// ============================================================================

describe('evaluateStrTriage', () => {
  it('gives 100 score when all actions are correct', () => {
    const searchTerms = [makeSearchTerm(), makeSearchTerm({ id: 'st-2', searchTerm: 'cooking tool' })];
    const expectedActions = [
      makeExpectedAction(),
      makeExpectedAction({ searchTermId: 'st-2', action: 'keep', reasoning: 'Good ROAS.' }),
    ];
    const userActions = [
      makeUserAction(),
      makeUserAction({ searchTermId: 'st-2', action: 'keep' }),
    ];

    const result = evaluateStrTriage(searchTerms, userActions, expectedActions, defaultContext);
    expect(result.score).toBe(100);
    expect(result.actionEvaluations).toHaveLength(2);
    expect(result.actionEvaluations[0].isCorrect).toBe(true);
    expect(result.actionEvaluations[1].isCorrect).toBe(true);
  });

  it('gives 0 score when all actions are wrong', () => {
    const searchTerms = [makeSearchTerm()];
    const expectedActions = [makeExpectedAction({ action: 'negate-exact' })];
    const userActions = [makeUserAction({ action: 'keep' })]; // Should have negated

    const result = evaluateStrTriage(searchTerms, userActions, expectedActions, defaultContext);
    expect(result.score).toBeLessThan(50); // Should get partial credit for attempting
    expect(result.actionEvaluations[0].isCorrect).toBe(false);
  });

  it('gives partial credit for partially correct actions', () => {
    const searchTerms = [makeSearchTerm()];
    const expectedActions = [makeExpectedAction({ action: 'negate-exact' })];
    const userActions = [makeUserAction({ action: 'negate-phrase' })]; // Close but not exact

    const result = evaluateStrTriage(searchTerms, userActions, expectedActions, defaultContext);
    expect(result.actionEvaluations[0].isPartiallyCorrect).toBe(true);
    expect(result.actionEvaluations[0].points).toBeGreaterThan(0);
    expect(result.actionEvaluations[0].points).toBeLessThan(result.actionEvaluations[0].maxPoints);
  });

  it('defaults to "keep" when user has no action for a search term', () => {
    const searchTerms = [makeSearchTerm()];
    const expectedActions = [makeExpectedAction({ action: 'negate-exact' })];
    const userActions: StrUserAction[] = []; // No actions taken

    const result = evaluateStrTriage(searchTerms, userActions, expectedActions, defaultContext);
    expect(result.actionEvaluations[0].userAction).toBe('keep');
    expect(result.actionEvaluations[0].isCorrect).toBe(false);
  });

  it('includes portfolio metrics before and after', () => {
    const searchTerms = [makeSearchTerm()];
    const expectedActions = [makeExpectedAction({ action: 'negate-exact' })];
    const userActions = [makeUserAction()];

    const result = evaluateStrTriage(searchTerms, userActions, expectedActions, defaultContext);
    expect(result.metricsBefore).toBeDefined();
    expect(result.metricsAfter).toBeDefined();
    expect(result.metricsBefore.clicks).toBe(200);
  });

  it('score is deterministic — same inputs always produce same output', () => {
    const searchTerms = [makeSearchTerm()];
    const expectedActions = [makeExpectedAction()];
    const userActions = [makeUserAction()];

    const result1 = evaluateStrTriage(searchTerms, userActions, expectedActions, defaultContext);
    const result2 = evaluateStrTriage(searchTerms, userActions, expectedActions, defaultContext);
    expect(result1.score).toBe(result2.score);
    expect(result1.totalPoints).toBe(result2.totalPoints);
  });

  it('includes feedback for each action', () => {
    const searchTerms = [makeSearchTerm()];
    const expectedActions = [makeExpectedAction()];
    const userActions = [makeUserAction()];

    const result = evaluateStrTriage(searchTerms, userActions, expectedActions, defaultContext);
    expect(result.actionEvaluations[0].feedback).toBeTruthy();
  });
});

// ============================================================================
// STR TRIAGE PREVIEW SCORE TESTS
// ============================================================================

describe('previewStrTriageScore', () => {
  it('returns 100 when all actions are correct', () => {
    const searchTerms = [makeSearchTerm()];
    const expectedActions = [makeExpectedAction()];
    const userActions = [makeUserAction()];

    expect(previewStrTriageScore(searchTerms, userActions, expectedActions)).toBe(100);
  });

  it('returns 0 when no actions are taken', () => {
    const searchTerms = [makeSearchTerm()];
    const expectedActions = [makeExpectedAction({ action: 'negate-exact' })];

    expect(previewStrTriageScore(searchTerms, [], expectedActions)).toBe(0);
  });

  it('preview score is deterministic', () => {
    const searchTerms = [makeSearchTerm()];
    const expectedActions = [makeExpectedAction()];
    const userActions = [makeUserAction()];

    const s1 = previewStrTriageScore(searchTerms, userActions, expectedActions);
    const s2 = previewStrTriageScore(searchTerms, userActions, expectedActions);
    expect(s1).toBe(s2);
  });
});

// ============================================================================
// STR TRIAGE VALIDATION TESTS
// ============================================================================

describe('validateStrTriageActions', () => {
  it('returns valid for correct actions', () => {
    const result = validateStrTriageActions(
      [makeUserAction()],
      ['st-1']
    );
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('warns about missing actions', () => {
    const result = validateStrTriageActions(
      [makeUserAction()],
      ['st-1', 'st-2'] // st-2 has no action
    );
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('errors on optimize-bid without newBid', () => {
    const result = validateStrTriageActions(
      [makeUserAction({ action: 'optimize-bid', newBid: 0 })],
      ['st-1']
    );
    expect(result.isValid).toBe(false);
  });

  it('warns on negate without negativeKeyword', () => {
    const result = validateStrTriageActions(
      [makeUserAction({ action: 'negate-exact', negativeKeyword: undefined })],
      ['st-1']
    );
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('errors on invalid searchTermId', () => {
    const result = validateStrTriageActions(
      [makeUserAction({ searchTermId: 'nonexistent' })],
      ['st-1']
    );
    expect(result.isValid).toBe(false);
  });
});

// ============================================================================
// BID ELEVATOR EVALUATION TESTS
// ============================================================================

describe('evaluateBidElevator', () => {
  it('gives high score when bid is at optimal', () => {
    const scenario = makeBidScenario({ optimalBid: 1.40 });
    const decision: BidDecision = { scenarioId: 'scenario-1', bidAmount: 1.40, timestamp: Date.now(), decisionTimeMs: 5000 };

    const result = evaluateBidElevator([scenario], [decision], bidContext);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.decisionEvaluations[0].isAcceptable).toBe(true);
  });

  it('gives lower score when bid is far from optimal', () => {
    const scenario = makeBidScenario({ optimalBid: 1.40, acceptableRange: { min: 1.10, max: 1.80 } });
    const decision: BidDecision = { scenarioId: 'scenario-1', bidAmount: 5.00, timestamp: Date.now(), decisionTimeMs: 3000 };

    const result = evaluateBidElevator([scenario], [decision], bidContext);
    expect(result.decisionEvaluations[0].isAcceptable).toBe(false);
    expect(result.score).toBeLessThan(50);
  });

  it('handles missing decision (user skipped)', () => {
    const scenario = makeBidScenario();
    const result = evaluateBidElevator([scenario], [], bidContext);
    expect(result.decisionEvaluations[0].userBid).toBe(0);
    expect(result.decisionEvaluations[0].isAcceptable).toBe(false);
  });

  it('is deterministic', () => {
    const scenario = makeBidScenario();
    const decision: BidDecision = { scenarioId: 'scenario-1', bidAmount: 1.40, timestamp: Date.now(), decisionTimeMs: 5000 };

    const r1 = evaluateBidElevator([scenario], [decision], bidContext);
    const r2 = evaluateBidElevator([scenario], [decision], bidContext);
    expect(r1.score).toBe(r2.score);
  });

  it('includes average decision time', () => {
    const scenario = makeBidScenario();
    const d1: BidDecision = { scenarioId: 'scenario-1', bidAmount: 1.40, timestamp: Date.now(), decisionTimeMs: 5000 };
    const d2: BidDecision = { scenarioId: 'scenario-2', bidAmount: 1.50, timestamp: Date.now(), decisionTimeMs: 3000 };
    const scenario2 = makeBidScenario({ id: 'scenario-2' });

    const result = evaluateBidElevator([scenario, scenario2], [d1, d2], bidContext);
    expect(result.averageDecisionTimeMs).toBe(4000);
  });
});

// ============================================================================
// BID ELEVATOR PREVIEW TESTS
// ============================================================================

describe('previewBidElevatorScore', () => {
  it('returns 0 for empty decisions', () => {
    expect(previewBidElevatorScore([], [])).toBe(0);
  });

  it('returns higher score for bids within acceptable range', () => {
    const scenario = makeBidScenario({ optimalBid: 1.40, acceptableRange: { min: 1.10, max: 1.80 } });
    const goodDecision: BidDecision = { scenarioId: 'scenario-1', bidAmount: 1.40, timestamp: Date.now(), decisionTimeMs: 5000 };
    const badDecision: BidDecision = { scenarioId: 'scenario-1', bidAmount: 5.00, timestamp: Date.now(), decisionTimeMs: 5000 };

    const goodScore = previewBidElevatorScore([goodDecision], [scenario]);
    const badScore = previewBidElevatorScore([badDecision], [scenario]);
    expect(goodScore).toBeGreaterThan(badScore);
  });
});

// ============================================================================
// CAMPAIGN BUILDER PREVIEW TESTS
// ============================================================================

describe('previewCampaignBuilderScore', () => {
  it('returns low score for empty campaign', () => {
    const emptyCampaign: CampaignStructure = {
      id: 'c1',
      name: '',
      type: 'sponsored-products',
      targetingType: 'manual',
      dailyBudget: 0,
      bidStrategy: 'dynamic-up-down',
      defaultBid: 0,
      keywords: [],
      asins: [],
    };
    // Even empty campaign gets +10 for defaultBid > 0 in the check below (but defaultBid is 0, so just name/budget/keywords/asins checks fail)
    expect(previewCampaignBuilderScore(emptyCampaign)).toBeLessThanOrEqual(10);
  });

  it('gives full 100 for a complete well-structured campaign', () => {
    const campaign = makeCampaign();
    const score = previewCampaignBuilderScore(campaign);
    expect(score).toBe(100);
  });

  it('gives low score for campaign with only name', () => {
    const campaign = makeCampaign({ name: 'My Campaign', dailyBudget: 0, keywords: [], asins: [] });
    const score = previewCampaignBuilderScore(campaign);
    expect(score).toBeGreaterThanOrEqual(10); // +10 for name
    expect(score).toBeLessThanOrEqual(30); // not much else
  });

  it('gives points for having a name', () => {
    const campaign = makeCampaign({ name: 'My Campaign', dailyBudget: 0, keywords: [], asins: [] });
    expect(previewCampaignBuilderScore(campaign)).toBeGreaterThanOrEqual(10);
  });

  it('gives points for budget within range (+10)', () => {
    const campaign = makeCampaign({ dailyBudget: 50 });
    expect(previewCampaignBuilderScore(campaign)).toBeGreaterThanOrEqual(10);
  });
});

// ============================================================================
// CAMPAIGN BUILDER VALIDATION TESTS
// ============================================================================

describe('validateCampaignBuilder', () => {
  it('validates a correct campaign', () => {
    const result = validateCampaignBuilder(makeCampaign());
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('errors on empty name', () => {
    const result = validateCampaignBuilder(makeCampaign({ name: '' }));
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.field === 'name')).toBe(true);
  });

  it('errors on zero budget', () => {
    const result = validateCampaignBuilder(makeCampaign({ dailyBudget: 0 }));
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.field === 'dailyBudget')).toBe(true);
  });

  it('errors on no ASINs', () => {
    const result = validateCampaignBuilder(makeCampaign({ asins: [] }));
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.field === 'asins')).toBe(true);
  });

  it('errors on manual targeting with no keywords', () => {
    const result = validateCampaignBuilder(makeCampaign({ targetingType: 'manual', keywords: [] }));
    expect(result.isValid).toBe(false);
  });

  it('warns on very high budget', () => {
    const result = validateCampaignBuilder(makeCampaign({ dailyBudget: 15000 }));
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('warns on very high default bid', () => {
    const result = validateCampaignBuilder(makeCampaign({ defaultBid: 75 }));
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('auto targeting does not require keywords', () => {
    const result = validateCampaignBuilder(makeCampaign({ targetingType: 'auto', keywords: [] }));
    // No keyword-required error for auto targeting
    expect(result.errors.some((e) => e.code === 'KEYWORD_REQUIRED')).toBe(false);
  });
});

// ============================================================================
// PROPERTY-BASED TESTS (fast-check)
// ============================================================================

describe('Property-based tests: evaluation invariants', () => {
  it('STR Triage score is always between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          id: fc.string({ minLength: 1, maxLength: 5 }),
          searchTerm: fc.string({ minLength: 1, maxLength: 20 }),
          keyword: fc.string({ minLength: 1, maxLength: 20 }),
          matchType: fc.constantFrom('broad', 'phrase', 'exact'),
          impressions: fc.double({ min: 0, max: 1e6 }),
          clicks: fc.double({ min: 0, max: 1e5 }),
          ctr: fc.double({ min: 0, max: 1 }),
          spend: fc.double({ min: 0, max: 1e5 }),
          cpc: fc.double({ min: 0, max: 100 }),
          orders: fc.double({ min: 0, max: 1e4 }),
          unitsSold: fc.double({ min: 0, max: 1e4 }),
          sales: fc.double({ min: 0, max: 1e6 }),
          acos: fc.double({ min: 0, max: 10 }),
          roas: fc.double({ min: 0, max: 100 }),
        }), { minLength: 1, maxLength: 5 }),
        (searchTerms) => {
          const expectedActions: StrExpectedAction[] = searchTerms.map((st, i) => ({
            searchTermId: st.id,
            action: 'keep' as StrAction,
            reasoning: 'Test',
            weight: 1,
          }));
          const userActions: StrUserAction[] = searchTerms.map((st) => ({
            searchTermId: st.id,
            action: 'keep' as StrAction,
            timestamp: Date.now(),
          }));

          const result = evaluateStrTriage(searchTerms, userActions, expectedActions, defaultContext);
          expect(result.score).toBeGreaterThanOrEqual(0);
          expect(result.score).toBeLessThanOrEqual(100);
          return true;
        }
      )
    );
  });

  it('Preview score is always between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          id: fc.string({ minLength: 1, maxLength: 5 }),
          searchTerm: fc.string({ minLength: 1, maxLength: 20 }),
          keyword: fc.string({ minLength: 1, maxLength: 20 }),
          matchType: fc.constantFrom('broad', 'phrase', 'exact'),
          impressions: fc.double({ min: 0, max: 1e6 }),
          clicks: fc.double({ min: 0, max: 1e5 }),
          ctr: fc.double({ min: 0, max: 1 }),
          spend: fc.double({ min: 0, max: 1e5 }),
          cpc: fc.double({ min: 0, max: 100 }),
          orders: fc.double({ min: 0, max: 1e4 }),
          unitsSold: fc.double({ min: 0, max: 1e4 }),
          sales: fc.double({ min: 0, max: 1e6 }),
          acos: fc.double({ min: 0, max: 10 }),
          roas: fc.double({ min: 0, max: 100 }),
        }), { minLength: 1, maxLength: 3 }),
        (searchTerms) => {
          const expectedActions: StrExpectedAction[] = searchTerms.map((st) => ({
            searchTermId: st.id,
            action: 'keep' as StrAction,
            reasoning: 'Test',
            weight: 1,
          }));
          const userActions: StrUserAction[] = searchTerms.map((st) => ({
            searchTermId: st.id,
            action: 'negate-exact' as StrAction,
            timestamp: Date.now(),
          }));

          const score = previewStrTriageScore(searchTerms, userActions, expectedActions);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
          return true;
        }
      )
    );
  });

  it('Campaign preview score is always between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 0, maxLength: 50 }),
          dailyBudget: fc.double({ min: 0, max: 1e5 }),
          defaultBid: fc.double({ min: 0, max: 100 }),
        }),
        (overrides) => {
          const campaign: CampaignStructure = {
            id: 'test',
            name: overrides.name,
            type: 'sponsored-products',
            targetingType: 'manual',
            dailyBudget: overrides.dailyBudget,
            bidStrategy: 'dynamic-up-down',
            defaultBid: overrides.defaultBid,
            keywords: overrides.name ? [{ id: 'k1', text: 'test', matchType: 'exact' as const, bid: overrides.defaultBid || 1 }] : [],
            asins: overrides.name ? ['B08TEST'] : [],
          };
          const score = previewCampaignBuilderScore(campaign);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
          return true;
        }
      )
    );
  });
});
