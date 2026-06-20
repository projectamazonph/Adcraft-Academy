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
  CampaignBuilderCriteria,
  CriterionResult,
  CampaignBuilderEvaluation,
  BidScenario,
  BidMarketContext,
  BidDecision,
  BidDecisionEvaluation,
  BidElevatorEvaluation,
  SimulationType,
  SimulationDifficulty,
  SimulationContext,
  SimulationState,
  UserAction,
  CampaignBuilderState,
  BidElevatorState,
  StrTriageState,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  SimulationEvaluation,
} from './types';

