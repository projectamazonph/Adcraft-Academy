/**
 * AdCraft: Evaluation Engine — Barrel Export
 *
 * This is the public API for the Pure TypeScript Deterministic Engine.
 * All engine functions are pure, deterministic, and have zero framework dependencies.
 *
 * Usage:
 *   import { calculateAcos, evaluateStrTriage, createSimulationState } from '@/engine';
 */

// Types — all domain types for the engine
export type {
  PpcMetrics,
  PpcRawData,
  PpcMetricThresholds,
  PpcMetricsHealth,
  MetricHealthStatus,
  PpcFormula,
  FormulaUnit,
  FormulaCategory,
  FormulaResult,
  StrAction,
  SearchTermEntry,
  StrUserAction,
  StrExpectedAction,
  StrActionEvaluation,
  StrTriageEvaluation,
  MatchType,
  CampaignType,
  TargetingType,
  BidStrategy,
  CampaignKeyword,
  CampaignStructure,
  SimProduct,
  CriterionResult,
  CampaignBuilderEvaluation,
  BidScenario,
  BidDecision,
  BidDecisionEvaluation,
  BidElevatorEvaluation,
  SimulationType,
  SimulationContext,
  SimulationState,
  UserAction,
  CampaignBuilderState,
  BidElevatorState,
  StrTriageState,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './types';


// Functions — evaluation
export {
  evaluateStrTriage,
  previewStrTriageScore,
  previewCampaignBuilderScore,
  previewBidElevatorScore,
  validateCampaignBuilder,
  validateStrTriageActions,
  evaluateBidElevator,
} from './evaluation';

// Functions — formulas
export {
  calculateCpc,
  calculateAcos,
  calculateTacos,
  calculateRoas,
  calculateCtr,
  calculateConversionRate,
  calculateBreakEvenAcos,
  calculateMaxCpc,
  calculateAov,
  calculateImpressionShare,
  calculateMetrics,
  calculateMetricsWithTacos,
  assessMetricHealth,
  assessMetricsHealth,
  computeFormula,
  formatFormulaOutput,
  getFormulasForModule,
  getFormulaBySlug,
  PPC_FORMULAS,
} from './formulas';

// Functions — simulation
export {
  createSimulationState,
  startSimulation,
  addCampaign,
  addKeyword,
  removeKeyword,
  initBidElevatorScenarios,
  recordBidDecision,
  initStrTriageSearchTerms,
  recordStrAction,
  isSimulationComplete,
} from './simulation';
