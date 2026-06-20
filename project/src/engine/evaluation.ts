/**
 * AdCraft: Evaluation Engine
 *
 * The core evaluation and scoring engine for all simulations.
 * Pure functions only — no side effects, no I/O, no framework dependencies.
 *
 * Architecture: Hybrid Execution Model (ADR-001)
 * - These functions run on CLIENT for instant preview scoring
 * - The SAME functions run on SERVER for authoritative grading
 * - Server result wins on divergence (scoreDiscrepancy flag set)
 *
 * Deterministic Guarantee:
 * Same (input, context) → Same (output) — always.
 * The `seed` in SimulationContext ensures deterministic randomness if needed.
 */

import type {
  StrTriageEvaluation,
  StrActionEvaluation,
  StrUserAction,
  StrExpectedAction,
  StrAction,
  SearchTermEntry,
  PpcMetrics,
  PpcRawData,
  PpcMetricThresholds,
  SimulationContext,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  CampaignBuilderEvaluation,
  CampaignStructure,
  CriterionResult,
  BidElevatorEvaluation,
  BidDecisionEvaluation,
  BidScenario,
  BidDecision,
} from './types';
import { calculateMetrics, calculateMetricsWithTacos, assessMetricsHealth } from './formulas';

// ============================================================================
// STR TRIAGE ARENA EVALUATION
// ============================================================================

/**
 * Evaluate a user's STR triage decisions against expected actions.
 * This is the main scoring function for the STR Triage Arena simulation.
 */
export function evaluateStrTriage(
  searchTerms: SearchTermEntry[],
  userActions: StrUserAction[],
  expectedActions: StrExpectedAction[],
  context: SimulationContext
): StrTriageEvaluation {
  const actionEvaluations: StrActionEvaluation[] = [];
  let totalPoints = 0;
  let maxPoints = 0;

  // Calculate portfolio metrics before user actions
  const metricsBefore = calculateStrPortfolioMetrics(searchTerms);

  for (const expected of expectedActions) {
    const userAction = userActions.find((a) => a.searchTermId === expected.searchTermId);
    const evaluation = evaluateSingleStrAction(
      userAction ?? null,
      expected,
      searchTerms.find((st) => st.id === expected.searchTermId) ?? null
    );
    actionEvaluations.push(evaluation);
    totalPoints += evaluation.points;
    maxPoints += evaluation.maxPoints;
  }

  // Calculate projected metrics after user actions
  const metricsAfter = projectStrMetricsAfterActions(searchTerms, userActions, expectedActions);

  // Calculate improvement score
  const improvementScore = calculateImprovementScore(metricsBefore, metricsAfter, context.thresholds);

  // Calculate normalized score (0-100)
  const score = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

  return {
    simulationId: context.type,
    userId: '',
    totalPoints,
    maxPoints,
    score,
    actionEvaluations,
    metricsBefore,
    metricsAfter,
    improvementScore,
    feedback: generateStrFeedback(score, actionEvaluations),
  };
}

/**
 * Evaluate a single STR triage action.
 */
function evaluateSingleStrAction(
  userAction: StrUserAction | null,
  expected: StrExpectedAction,
  searchTerm: SearchTermEntry | null
): StrActionEvaluation {
  const userAct: StrAction = userAction?.action ?? 'keep';
  const isCorrect = userAct === expected.action;
  const isPartiallyCorrect = !isCorrect && isPartiallyCorrectAction(userAct, expected.action);

  // Points calculation
  const maxPoints = Math.round(expected.weight * 100);
  let points = 0;

  if (isCorrect) {
    points = maxPoints;
  } else if (isPartiallyCorrect) {
    points = Math.round(maxPoints * 0.5); // 50% credit for partially correct
  } else {
    points = Math.round(maxPoints * 0.1); // 10% for attempting
  }

  // Generate feedback
  const feedback = generateStrActionFeedback(
    userAct,
    expected.action,
    expected.reasoning,
    isCorrect,
    isPartiallyCorrect,
    searchTerm
  );

  return {
    searchTermId: expected.searchTermId,
    userAction: userAct,
    expectedAction: expected.action,
    isCorrect,
    isPartiallyCorrect,
    points,
    maxPoints,
    feedback,
  };
}

/**
 * Check if a user action is partially correct.
 * e.g., "negate-phrase" when "negate-exact" was expected is partially correct.
 */
function isPartiallyCorrectAction(userAction: StrAction, expectedAction: StrAction): boolean {
  const partialMatches: Record<string, StrAction[]> = {
    'negate-exact': ['negate-phrase'],
    'negate-phrase': ['negate-exact'],
    'pause': ['negate-exact', 'negate-phrase'],
    'optimize-bid': ['keep'],
    'keep': ['optimize-bid'],
  };
  return partialMatches[expectedAction]?.includes(userAction) ?? false;
}

/**
 * Calculate portfolio metrics from a set of search terms.
 */
function calculateStrPortfolioMetrics(searchTerms: SearchTermEntry[]): PpcMetrics {
  const totals: PpcRawData = {
    impressions: 0,
    clicks: 0,
    spend: 0,
    sales: 0,
    orders: 0,
    unitsSold: 0,
  };

  for (const st of searchTerms) {
    totals.impressions += st.impressions;
    totals.clicks += st.clicks;
    totals.spend += st.spend;
    totals.sales += st.sales;
    totals.orders += st.orders;
    totals.unitsSold += st.unitsSold;
  }

  return calculateMetrics(totals);
}

/**
 * Project portfolio metrics after applying user actions.
 * Terms that are negated or paused stop spending; optimized terms adjust.
 */
function projectStrMetricsAfterActions(
  searchTerms: SearchTermEntry[],
  userActions: StrUserAction[],
  expectedActions: StrExpectedAction[]
): PpcMetrics {
  // Apply expected actions to project the "correct" outcome
  const retainedTerms: SearchTermEntry[] = [];

  for (const st of searchTerms) {
    const expected = expectedActions.find((e) => e.searchTermId === st.id);
    if (!expected) {
      retainedTerms.push(st);
      continue;
    }

    switch (expected.action) {
      case 'keep':
      case 'optimize-bid':
        retainedTerms.push(st); // Keep in portfolio
        break;
      case 'pause':
      case 'negate-exact':
      case 'negate-phrase':
        // Remove from portfolio — no more spend/sales from this term
        break;
    }
  }

  return calculateStrPortfolioMetrics(retainedTerms);
}

/**
 * Calculate improvement score — how much the portfolio improved.
 */
function calculateImprovementScore(
  before: PpcMetrics,
  after: PpcMetrics,
  thresholds: PpcMetricThresholds
): number {
  const healthBefore = assessMetricsHealth(before, thresholds);
  const healthAfter = assessMetricsHealth(after, thresholds);
  return Math.max(0, healthAfter.score - healthBefore.score);
}

/**
 * Generate feedback for a single STR action.
 */
function generateStrActionFeedback(
  userAction: StrAction,
  expectedAction: StrAction,
  reasoning: string,
  isCorrect: boolean,
  isPartiallyCorrect: boolean,
  searchTerm: SearchTermEntry | null
): string {
  if (isCorrect) {
    return `Correct! ${reasoning}`;
  }

  if (isPartiallyCorrect) {
    return `Close! You chose "${userAction}" which is reasonable, but the optimal action is "${expectedAction}". ${reasoning}`;
  }

  const termInfo = searchTerm
    ? `For the search term "${searchTerm.searchTerm}" (ACoS: ${(searchTerm.acos * 100).toFixed(1)}%, ROAS: ${searchTerm.roas.toFixed(1)}x)`
    : '';

  return `Not quite. ${termInfo} The recommended action is "${expectedAction}" but you chose "${userAction}". ${reasoning}`;
}

/**
 * Generate overall feedback for the STR Triage evaluation.
 */
function generateStrFeedback(
  score: number,
  evaluations: StrActionEvaluation[]
): string {
  const correctCount = evaluations.filter((e) => e.isCorrect).length;
  const totalCount = evaluations.length;
  const partiallyCorrectCount = evaluations.filter((e) => e.isPartiallyCorrect).length;

  if (score >= 90) {
    return `Outstanding work! You correctly triaged ${correctCount}/${totalCount} search terms with an expert-level understanding of when to keep, negate, or optimize bids.`;
  }
  if (score >= 70) {
    return `Good job! You correctly handled ${correctCount}/${totalCount} search terms. ${partiallyCorrectCount} were close calls. Review the ones you missed to sharpen your decision-making.`;
  }
  if (score >= 50) {
    return `Decent start — ${correctCount}/${totalCount} correct decisions. STR triage takes practice. Focus on identifying high-ACoS terms that should be negated, and high-ROAS terms worth bidding more on.`;
  }
  return `Keep practicing! You got ${correctCount}/${totalCount} correct. Start by looking at ACoS and ROAS for each term: high ACoS + low sales = negate; high ROAS + good volume = increase bid.`;
}

// ============================================================================
// QUICK PREVIEW SCORE (CLIENT-SIDE)
// ============================================================================

/**
 * Calculate a quick preview score for STR Triage.
 * This runs on the client for instant feedback (<100ms).
 * The server will recalculate the authoritative score.
 */
export function previewStrTriageScore(
  searchTerms: SearchTermEntry[],
  userActions: StrUserAction[],
  expectedActions: StrExpectedAction[]
): number {
  let totalWeight = 0;
  let earnedWeight = 0;

  for (const expected of expectedActions) {
    totalWeight += expected.weight;
    const userAction = userActions.find((a) => a.searchTermId === expected.searchTermId);
    if (userAction?.action === expected.action) {
      earnedWeight += expected.weight;
    } else if (userAction && isPartiallyCorrectAction(userAction.action, expected.action)) {
      earnedWeight += expected.weight * 0.5;
    }
  }

  return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
}

/**
 * Quick preview for Campaign Builder.
 * Checks basic structure requirements for instant client-side feedback.
 */
export function previewCampaignBuilderScore(campaign: CampaignStructure): number {
  let score = 0;

  // Has a name (+10)
  if (campaign.name.length > 0) score += 10;

  // Has daily budget set (+10)
  if (campaign.dailyBudget > 0) score += 10;

  // Has keywords (+20)
  if (campaign.keywords.length > 0) score += 20;

  // Has ASINs (+20)
  if (campaign.asins.length > 0) score += 20;

  // Budget is reasonable (+10)
  if (campaign.dailyBudget >= 5 && campaign.dailyBudget <= 1000) score += 10;

  // Has non-negative keywords (+10)
  const positiveKeywords = campaign.keywords.filter((k) => !k.isNegative);
  if (positiveKeywords.length > 0) score += 10;

  // Bids are set (+10)
  if (positiveKeywords.every((k) => k.bid > 0)) score += 10;

  // Has negative keywords (+10)
  if (campaign.keywords.some((k) => k.isNegative)) score += 10;

  return score;
}

/**
 * Quick preview for Bid Elevator.
 * Calculates average accuracy of bid decisions.
 */
export function previewBidElevatorScore(
  decisions: BidDecision[],
  scenarios: BidScenario[]
): number {
  if (decisions.length === 0) return 0;

  let totalAccuracy = 0;
  for (const decision of decisions) {
    const scenario = scenarios.find((s) => s.id === decision.scenarioId);
    if (!scenario) continue;

    const { min, max } = scenario.acceptableRange;
    if (decision.bidAmount >= min && decision.bidAmount <= max) {
      // Within acceptable range
      const distanceFromOptimal = Math.abs(decision.bidAmount - scenario.optimalBid);
      const range = max - min;
      const accuracy = Math.max(0, 1 - (distanceFromOptimal / range) * 0.5);
      totalAccuracy += accuracy;
    } else {
      // Outside acceptable range — partial credit based on distance
      const distance = Math.abs(decision.bidAmount - scenario.optimalBid);
      const maxDistance = scenario.optimalBid * 2;
      const accuracy = Math.max(0, 0.3 * (1 - distance / maxDistance));
      totalAccuracy += accuracy;
    }
  }

  return Math.round((totalAccuracy / decisions.length) * 100);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate Campaign Builder input before evaluation.
 */
export function validateCampaignBuilder(campaign: CampaignStructure): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!campaign.name || campaign.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Campaign name is required', code: 'REQUIRED' });
  }

  if (campaign.dailyBudget <= 0) {
    errors.push({ field: 'dailyBudget', message: 'Daily budget must be greater than 0', code: 'MIN_VALUE' });
  }

  if (campaign.dailyBudget > 10000) {
    warnings.push({ field: 'dailyBudget', message: 'Daily budget exceeds $10,000 — verify this is intentional', code: 'HIGH_BUDGET' });
  }

  if (campaign.asins.length === 0) {
    errors.push({ field: 'asins', message: 'At least one product ASIN is required', code: 'REQUIRED' });
  }

  const positiveKeywords = campaign.keywords.filter((k) => !k.isNegative);
  if (campaign.targetingType === 'manual' && positiveKeywords.length === 0) {
    errors.push({ field: 'keywords', message: 'Manual targeting requires at least one keyword', code: 'KEYWORD_REQUIRED' });
  }

  if (campaign.defaultBid <= 0) {
    errors.push({ field: 'defaultBid', message: 'Default bid must be greater than $0', code: 'MIN_VALUE' });
  }

  if (campaign.defaultBid > 50) {
    warnings.push({ field: 'defaultBid', message: 'Default bid exceeds $50 — verify this is intentional', code: 'HIGH_BID' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate STR Triage user actions before evaluation.
 */
export function validateStrTriageActions(
  actions: StrUserAction[],
  searchTermIds: string[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const actionedIds = new Set(actions.map((a) => a.searchTermId));
  const missingIds = searchTermIds.filter((id) => !actionedIds.has(id));

  if (missingIds.length > 0) {
    warnings.push({
      field: 'actions',
      message: `${missingIds.length} search terms have no action — they will default to "keep"`,
      code: 'MISSING_ACTIONS',
    });
  }

  for (const action of actions) {
    if (!searchTermIds.includes(action.searchTermId)) {
      errors.push({
        field: `action.${action.searchTermId}`,
        message: `Search term ${action.searchTermId} not found in the dataset`,
        code: 'INVALID_ID',
      });
    }

    if (action.action === 'optimize-bid' && (!action.newBid || action.newBid <= 0)) {
      errors.push({
        field: `action.${action.searchTermId}.newBid`,
        message: 'Bid optimization requires a new bid amount greater than $0',
        code: 'BID_REQUIRED',
      });
    }

    if ((action.action === 'negate-exact' || action.action === 'negate-phrase') && !action.negativeKeyword) {
      warnings.push({
        field: `action.${action.searchTermId}.negativeKeyword`,
        message: 'Negation action without a specified negative keyword — the search term itself will be used',
        code: 'MISSING_NEGATIVE_KEYWORD',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// BID ELEVATOR EVALUATION
// ============================================================================

/**
 * Evaluate all bid decisions in the Bid Elevator simulation.
 */
export function evaluateBidElevator(
  scenarios: BidScenario[],
  decisions: BidDecision[],
  context: SimulationContext
): BidElevatorEvaluation {
  const decisionEvaluations: BidDecisionEvaluation[] = [];
  let totalPoints = 0;
  let maxPoints = 0;
  let totalDecisionTimeMs = 0;

  for (const scenario of scenarios) {
    const decision = decisions.find((d) => d.scenarioId === scenario.id);
    const evaluation = evaluateSingleBidDecision(scenario, decision ?? null);
    decisionEvaluations.push(evaluation);
    totalPoints += evaluation.points;
    maxPoints += evaluation.maxPoints;
    totalDecisionTimeMs += decision?.decisionTimeMs ?? 0;
  }

  const score = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
  const averageDecisionTimeMs = decisions.length > 0 ? Math.round(totalDecisionTimeMs / decisions.length) : 0;

  return {
    simulationId: context.type,
    userId: '',
    totalPoints,
    maxPoints,
    score,
    decisionEvaluations,
    averageDecisionTimeMs,
    feedback: generateBidFeedback(score, decisionEvaluations),
  };
}

/**
 * Evaluate a single bid decision.
 */
function evaluateSingleBidDecision(
  scenario: BidScenario,
  decision: BidDecision | null
): BidDecisionEvaluation {
  const userBid = decision?.bidAmount ?? 0;
  const { min, max } = scenario.acceptableRange;
  const isAcceptable = userBid >= min && userBid <= max;

  // Calculate accuracy (how close to optimal)
  const distanceFromOptimal = Math.abs(userBid - scenario.optimalBid);
  const maxDistance = Math.max(
    Math.abs(scenario.optimalBid - (scenario.suggestedBidRange.min * 0.5)),
    Math.abs((scenario.suggestedBidRange.max * 1.5) - scenario.optimalBid)
  );
  const accuracy = Math.max(0, Math.round((1 - distanceFromOptimal / maxDistance) * 100));

  // Project performance at user bid vs optimal bid
  const projectedMetrics = projectBidPerformance(scenario, userBid);
  const optimalMetrics = projectBidPerformance(scenario, scenario.optimalBid);

  // Points calculation
  const maxPoints = 100;
  let points = 0;

  if (isAcceptable) {
    points = Math.max(50, maxPoints - Math.round(distanceFromOptimal * 5));
  } else {
    points = Math.max(10, Math.round(accuracy * 0.4));
  }

  const feedback = generateBidDecisionFeedback(
    userBid,
    scenario.optimalBid,
    isAcceptable,
    scenario.reasoning
  );

  return {
    scenarioId: scenario.id,
    userBid,
    optimalBid: scenario.optimalBid,
    accuracy,
    isAcceptable,
    projectedMetrics,
    optimalMetrics,
    points,
    maxPoints,
    feedback,
  };
}

/**
 * Project performance at a given bid.
 * Simplified model: higher bid → more impressions/clicks, same CVR.
 */
function projectBidPerformance(scenario: BidScenario, bid: number): PpcMetrics {
  const current = scenario.currentPerformance;
  if (current.clicks === 0) {
    // No historical data — estimate based on bid
    const estimatedClicks = Math.round(bid * 50); // Rough estimate
    const estimatedSpend = bid * estimatedClicks;
    return calculateMetrics({
      impressions: estimatedClicks * 100,
      clicks: estimatedClicks,
      spend: estimatedSpend,
      sales: estimatedSpend * 4, // Assume 4x ROAS
      orders: Math.round(estimatedClicks * 0.1),
      unitsSold: Math.round(estimatedClicks * 0.1),
    });
  }

  // Scale based on bid ratio
  const bidRatio = bid / scenario.currentBid;
  const estimatedClicks = Math.round(current.clicks * Math.sqrt(bidRatio));
  const estimatedSpend = bid * estimatedClicks;
  const estimatedCvr = current.orders / current.clicks;
  const estimatedOrders = Math.round(estimatedClicks * estimatedCvr);
  const aov = current.orders > 0 ? current.sales / current.orders : 25;
  const estimatedSales = estimatedOrders * aov;

  return calculateMetrics({
    impressions: Math.round(current.impressions * Math.sqrt(bidRatio)),
    clicks: estimatedClicks,
    spend: estimatedSpend,
    sales: estimatedSales,
    orders: estimatedOrders,
    unitsSold: estimatedOrders,
  });
}

/**
 * Generate feedback for a bid decision.
 */
function generateBidDecisionFeedback(
  userBid: number,
  optimalBid: number,
  isAcceptable: boolean,
  reasoning: string
): string {
  if (Math.abs(userBid - optimalBid) < 0.01) {
    return `Perfect bid! ${reasoning}`;
  }
  if (isAcceptable) {
    const direction = userBid > optimalBid ? 'high' : 'low';
    return `Good bid — within the acceptable range but slightly ${direction}. The optimal bid is $${optimalBid.toFixed(2)}. ${reasoning}`;
  }
  const direction = userBid > optimalBid ? 'aggressive' : 'conservative';
  return `Your bid of $${userBid.toFixed(2)} is too ${direction}. The optimal bid is $${optimalBid.toFixed(2)}. ${reasoning}`;
}

/**
 * Generate overall feedback for Bid Elevator.
 */
function generateBidFeedback(
  score: number,
  evaluations: BidDecisionEvaluation[]
): string {
  const correctCount = evaluations.filter((e) => e.isAcceptable).length;
  const totalCount = evaluations.length;

  if (score >= 90) {
    return `Exceptional bidding! You made ${correctCount}/${totalCount} bids within the optimal range. You have a strong grasp of bid strategy and position economics.`;
  }
  if (score >= 70) {
    return `Solid bidding skills — ${correctCount}/${totalCount} bids in the acceptable range. Review the scenarios where you overbid or underbid to refine your approach.`;
  }
  if (score >= 50) {
    return `Getting there — ${correctCount}/${totalCount} acceptable bids. Focus on calculating your break-even ACoS and max profitable bid before deciding. The formula: Max CPC = AOV x CVR x Target ACoS.`;
  }
  return `Keep practicing — ${correctCount}/${totalCount} acceptable bids. Start with the basics: calculate your break-even ACoS first, then derive your maximum profitable bid. Never bid above your max CPC.`;
}
