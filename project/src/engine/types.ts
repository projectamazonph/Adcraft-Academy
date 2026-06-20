/**
 * AdCraft: Amazon PPC Command Center — Evaluation Engine Types
 *
 * This is the TYPE FOUNDATION for the Pure TypeScript Deterministic Engine.
 * Every type here has ZERO framework dependencies — these are pure domain types
 * that can run on both client (preview) and server (authoritative grading).
 *
 * Architecture Decision: ADR-001 — Hybrid Execution Model
 * - Client uses these types for instant preview scoring (<100ms)
 * - Server uses the same types for authoritative grading
 * - If client preview diverges from server score, server wins (scoreDiscrepancy flag)
 *
 * Design Principles:
 * 1. Deterministic First — Same input always produces same output
 * 2. Zero Side Effects — No DB calls, no network, no I/O
 * 3. Composable — Types compose into evaluation pipelines
 * 4. Serializable — All types are JSON-serializable for state persistence
 */

// ============================================================================
// CORE PPC METRICS
// ============================================================================

/**
 * Core PPC metric values calculated from raw advertising data.
 * These are the fundamental building blocks of all evaluations.
 */
export interface PpcMetrics {
  /** Cost Per Click — how much you pay each time someone clicks your ad */
  cpc: number;
  /** Advertising Cost of Sales — ad spend / attributed sales (percentage as decimal) */
  acos: number;
  /** Total Advertising Cost of Sales — ad spend / total sales (percentage as decimal) */
  tacos: number;
  /** Return on Ad Spend — attributed sales / ad spend (inverse of ACoS) */
  roas: number;
  /** Click-Through Rate — clicks / impressions (percentage as decimal) */
  ctr: number;
  /** Conversion Rate — orders / clicks (percentage as decimal) */
  conversionRate: number;
  /** Total impressions the ad received */
  impressions: number;
  /** Total clicks the ad received */
  clicks: number;
  /** Total ad spend in USD */
  spend: number;
  /** Total attributed sales in USD */
  sales: number;
  /** Total orders attributed to ads */
  orders: number;
  /** Total units sold through ads */
  unitsSold: number;
}

/**
 * Raw data inputs needed to calculate PPC metrics.
 * This is what comes from search term reports and campaign data.
 */
export interface PpcRawData {
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
  orders: number;
  unitsSold: number;
}

/**
 * Target/threshold ranges for PPC metrics.
 * Used by the evaluation engine to determine if metrics are healthy.
 */
export interface PpcMetricThresholds {
  /** ACoS threshold — below this is "good" (decimal, e.g. 0.25 = 25%) */
  acosTarget: number;
  /** TACoS threshold — above this indicates overspending */
  tacosTarget: number;
  /** CTR minimum — below this suggests poor relevance */
  ctrMinimum: number;
  /** Conversion rate minimum — below this suggests poor listing */
  conversionRateMinimum: number;
  /** Maximum acceptable CPC */
  cpcMaximum: number;
  /** Minimum acceptable ROAS */
  roasMinimum: number;
}

/**
 * Health status for a single PPC metric.
 */
export type MetricHealthStatus = 'excellent' | 'good' | 'warning' | 'critical' | 'insufficient_data';

/**
 * Health assessment for all PPC metrics.
 */
export interface PpcMetricsHealth {
  overall: MetricHealthStatus;
  acos: MetricHealthStatus;
  tacos: MetricHealthStatus;
  roas: MetricHealthStatus;
  ctr: MetricHealthStatus;
  conversionRate: MetricHealthStatus;
  cpc: MetricHealthStatus;
  score: number; // 0-100
}

// ============================================================================
// FORMULA ENGINE TYPES
// ============================================================================

/**
 * A PPC formula definition — used for teaching and evaluation.
 * Each formula has a name, mathematical expression, and educational context.
 */
export interface PpcFormula {
  id: string;
  name: string;
  slug: string; // e.g., "acos", "roas", "cpc"
  expression: string; // e.g., "spend / sales"
  description: string;
  unit: FormulaUnit;
  inputs: FormulaInput[];
  category: FormulaCategory;
  moduleRef: number; // Which module teaches this formula (0,1,4,6,7)
}

export type FormulaUnit = 'percentage' | 'currency' | 'ratio' | 'count' | 'rate';

export type FormulaCategory =
  | 'efficiency' // ACoS, TACoS, ROAS
  | 'cost' // CPC, CPM
  | 'performance' // CTR, CVR
  | 'profitability' // Break-even ACoS, Margin
  | 'reach'; // Impressions, Share of Voice

/**
 * Result of computing a PPC formula.
 */
export interface FormulaResult {
  formulaId: string;
  inputs: Record<string, number>;
  output: number;
  unit: FormulaUnit;
  formattedOutput: string; // e.g., "25.3%", "$1.42", "4.2x"
}

// ============================================================================
// SEARCH TERM TRIAGE (STR) TYPES
// ============================================================================

/**
 * Recommended action for a search term in the STR Triage Arena.
 * This is the core decision the user makes in the simulation.
 */
export type StrAction =
  | 'keep'           // Keep running — term is performing well
  | 'pause'          // Pause the keyword — poor performance but may revisit
  | 'negate-exact'   // Add exact negative keyword — irrelevant term
  | 'negate-phrase'  // Add phrase negative keyword — broadly irrelevant
  | 'optimize-bid';  // Adjust bid up or down — has potential

/**
 * A single search term record as it appears in Amazon Search Term Reports.
 * This is what the user analyzes in the STR Triage Arena.
 */
export interface SearchTermEntry {
  id: string;
  searchTerm: string;
  keyword: string;
  matchType: MatchType;
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
}

/**
 * A user's action on a single search term.
 */
export interface StrUserAction {
  searchTermId: string;
  action: StrAction;
  /** Optional bid adjustment when action is "optimize-bid" */
  newBid?: number;
  /** Optional negative keyword to add when action is "negate-exact" or "negate-phrase" */
  negativeKeyword?: string;
  /** Timestamp of the action */
  timestamp: number;
}

/**
 * The expected/correct action for a search term.
 * Used by the evaluation engine to score user decisions.
 */
export interface StrExpectedAction {
  searchTermId: string;
  action: StrAction;
  newBid?: number;
  negativeKeyword?: string;
  reasoning: string; // Why this is the correct action
  weight: number; // Importance weight (0-1), harder/more impactful terms weigh more
}

/**
 * Evaluation result for a single STR triage decision.
 */
export interface StrActionEvaluation {
  searchTermId: string;
  userAction: StrAction;
  expectedAction: StrAction;
  isCorrect: boolean;
  isPartiallyCorrect: boolean; // e.g., negate-phrase when negate-exact was expected
  points: number; // Points earned (0-100 per action)
  maxPoints: number; // Maximum possible points
  feedback: string; // Educational feedback explaining why
}

/**
 * Complete evaluation result for the STR Triage Arena simulation.
 */
export interface StrTriageEvaluation {
  simulationId: string;
  userId: string;
  totalPoints: number;
  maxPoints: number;
  score: number; // 0-100 normalized
  actionEvaluations: StrActionEvaluation[];
  metricsBefore: PpcMetrics; // Portfolio metrics before user actions
  metricsAfter: PpcMetrics; // Projected metrics after user actions
  improvementScore: number; // How much metrics improved (0-100)
  feedback: string; // Overall feedback summary
}

/**
 * Match type for Amazon PPC keywords.
 */
export type MatchType = 'broad' | 'phrase' | 'exact';

// ============================================================================
// CAMPAIGN BUILDER TYPES
// ============================================================================

/**
 * Campaign type in Amazon Advertising.
 */
export type CampaignType = 'sponsored-products' | 'sponsored-brands' | 'sponsored-display';

/**
 * Targeting type for a campaign.
 */
export type TargetingType = 'manual' | 'auto';

/**
 * Bid strategy for a campaign.
 */
export type BidStrategy = 'legacy' | 'dynamic-up-only' | 'dynamic-up-down';

/**
 * A keyword entry in a campaign.
 */
export interface CampaignKeyword {
  id: string;
  text: string;
  matchType: MatchType;
  bid: number;
  isNegative?: boolean;
}

/**
 * A campaign as constructed in the Campaign Builder simulation.
 */
export interface CampaignStructure {
  id: string;
  name: string;
  type: CampaignType;
  targetingType: TargetingType;
  dailyBudget: number;
  bidStrategy: BidStrategy;
  defaultBid: number;
  keywords: CampaignKeyword[];
  /** Product ASINs being advertised */
  asins: string[];
  /** Ad group name (for Sponsored Products) */
  adGroupName?: string;
}

/**
 * A product in the simulation marketplace.
 */
export interface SimProduct {
  asin: string;
  title: string;
  category: string;
  price: number;
  margin: number; // Profit margin as decimal
  averageSpend: number;
  averageSales: number;
  averageOrders: number;
}

/**
 * Evaluation criteria for the Campaign Builder simulation.
 */
export interface CampaignBuilderCriteria {
  criterionId: string;
  name: string;
  description: string;
  weight: number; // 0-1, sum of all weights = 1
  evaluate: (campaign: CampaignStructure, context: SimulationContext) => CriterionResult;
}

/**
 * Result of evaluating a single criterion.
 */
export interface CriterionResult {
  criterionId: string;
  passed: boolean;
  score: number; // 0-100
  feedback: string;
  details?: string;
}

/**
 * Complete evaluation result for the Campaign Builder simulation.
 */
export interface CampaignBuilderEvaluation {
  simulationId: string;
  userId: string;
  totalScore: number; // 0-100 weighted
  criteriaResults: CriterionResult[];
  campaignStructure: CampaignStructure;
  projectedMetrics: PpcMetrics;
  feedback: string;
}

// ============================================================================
// BID ELEVATOR TYPES
// ============================================================================

/**
 * A bid scenario in the Bid Elevator simulation.
 * The user sees these scenarios and must decide what bid to place.
 */
export interface BidScenario {
  id: string;
  /** The keyword being bid on */
  keyword: string;
  matchType: MatchType;
  /** Current bid amount */
  currentBid: number;
  /** Suggested bid range from Amazon */
  suggestedBidRange: { min: number; recommended: number; max: number };
  /** Historical performance at current bid */
  currentPerformance: PpcRawData;
  /** Market context */
  marketContext: BidMarketContext;
  /** The optimal bid for this scenario */
  optimalBid: number;
  /** Acceptable bid range (within which you get partial credit) */
  acceptableRange: { min: number; max: number };
  /** Reasoning for the optimal bid */
  reasoning: string;
}

/**
 * Market context that informs bidding decisions.
 */
export interface BidMarketContext {
  /** Average CPC in the category */
  averageCpc: number;
  /** Number of competing advertisers */
  competitionLevel: 'low' | 'medium' | 'high';
  /** Search volume trend */
  searchVolumeTrend: 'rising' | 'stable' | 'declining';
  /** Your product's margin (affects max profitable bid) */
  productMargin: number;
  /** Your break-even ACoS */
  breakEvenAcos: number;
}

/**
 * A user's bid decision in the Bid Elevator.
 */
export interface BidDecision {
  scenarioId: string;
  bidAmount: number;
  timestamp: number;
  /** Time taken to decide (ms) */
  decisionTimeMs: number;
}

/**
 * Evaluation result for a single bid decision.
 */
export interface BidDecisionEvaluation {
  scenarioId: string;
  userBid: number;
  optimalBid: number;
  /** How close the bid is to optimal (0-100) */
  accuracy: number;
  /** Is the bid within the acceptable range */
  isAcceptable: boolean;
  /** Projected performance at user's bid */
  projectedMetrics: PpcMetrics;
  /** Projected performance at optimal bid */
  optimalMetrics: PpcMetrics;
  points: number;
  maxPoints: number;
  feedback: string;
}

/**
 * Complete evaluation result for the Bid Elevator simulation.
 */
export interface BidElevatorEvaluation {
  simulationId: string;
  userId: string;
  totalPoints: number;
  maxPoints: number;
  score: number; // 0-100 normalized
  decisionEvaluations: BidDecisionEvaluation[];
  averageDecisionTimeMs: number;
  feedback: string;
}

// ============================================================================
// SIMULATION CONTEXT & STATE
// ============================================================================

/**
 * Shared simulation context — provides all the data a simulation needs.
 * This is immutable during a simulation run.
 */
export interface SimulationContext {
  /** Which simulation type is running */
  type: SimulationType;
  /** The module this simulation belongs to */
  moduleId: string;
  /** Difficulty level */
  difficulty: SimulationDifficulty;
  /** User's current PPC knowledge level (affects hint frequency) */
  userLevel: number;
  /** Time limit in seconds (null = no limit) */
  timeLimitSeconds: number | null;
  /** The products available in this simulation */
  products: SimProduct[];
  /** The metric thresholds used for evaluation */
  thresholds: PpcMetricThresholds;
  /** Random seed for deterministic replay */
  seed: number;
}

/**
 * Simulation types available in MVP.
 */
export type SimulationType = 'campaign-builder' | 'bid-elevator' | 'str-triage-arena';

/**
 * Simulation difficulty levels.
 */
/**
 * The state of a running simulation.
 * This is what gets persisted as JSONB in the database.
 */
export interface SimulationState {
  /** Unique attempt identifier */
  attemptId: string;
  /** Which simulation */
  simulationType: SimulationType;
  /** Current status */
  status: 'idle' | 'active' | 'paused' | 'submitted' | 'graded';
  /** When the simulation started */
  startedAt: number; // Unix timestamp
  /** Total elapsed time in seconds */
  elapsedSeconds: number;
  /** User actions taken during the simulation */
  actions: UserAction[];
  /** Current preview score (client-side calculated) */
  previewScore: number;
  /** Official score (server-side, null until graded) */
  officialScore: number | null;
  /** Type-specific state */
  campaignBuilder?: CampaignBuilderState;
  bidElevator?: BidElevatorState;
  strTriage?: StrTriageState;
}

/**
 * A user action recorded during a simulation.
 */
export interface UserAction {
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

/**
 * Campaign Builder simulation state.
 */
export interface CampaignBuilderState {
  campaigns: CampaignStructure[];
  availableProducts: SimProduct[];
  selectedProductId?: string;
}

/**
 * Bid Elevator simulation state.
 */
export interface BidElevatorState {
  scenarios: BidScenario[];
  decisions: BidDecision[];
  currentScenarioIndex: number;
}

/**
 * STR Triage Arena simulation state.
 */
export interface StrTriageState {
  searchTerms: SearchTermEntry[];
  userActions: StrUserAction[];
  currentIndex: number;
  totalSearchTerms: number;
}

// ============================================================================
// EVALUATION ENGINE TYPES
// ============================================================================

/**
 * The main evaluation engine interface.
 * Each simulation type implements this interface with deterministic logic.
 */
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// ============================================================================
// XP & LEVEL SYSTEM
// ============================================================================

/**
 * XP reward configuration for different actions.
 */

// ============================================================================
// TYPE GUARDS & UTILITIES
// ============================================================================

/**
 * Type guard: Check if an evaluation is a Campaign Builder evaluation.
 */
