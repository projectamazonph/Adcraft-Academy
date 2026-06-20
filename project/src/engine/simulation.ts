/**
 * AdCraft: Simulation State Manager
 *
 * Manages the lifecycle of simulation states — creation, updates, submission.
 * All functions are pure and deterministic.
 * State is persisted as JSONB via Prisma on the server.
 *
 * Flow:
 * 1. createSimulationState() — Initialize a new attempt
 * 2. updateSimulationState() — Record user actions during simulation
 * 3. submitSimulationState() — Mark as ready for grading
 * 4. Server grades → sets officialScore
 */

import type {
  SimulationState,
  SimulationType,
  SimulationContext,
  UserAction,
  CampaignBuilderState,
  BidElevatorState,
  StrTriageState,
  CampaignStructure,
  CampaignKeyword,
  BidDecision,
  StrUserAction,
  SearchTermEntry,
  BidScenario,
} from './types';

// ============================================================================
// STATE CREATION
// ============================================================================

/**
 * Create the initial state for a new simulation attempt.
 */
export function createSimulationState(
  simulationType: SimulationType,
  attemptId: string,
  context: SimulationContext
): SimulationState {
  const baseState: SimulationState = {
    attemptId,
    simulationType,
    status: 'idle',
    startedAt: Date.now(),
    elapsedSeconds: 0,
    actions: [],
    previewScore: 0,
    officialScore: null,
  };

  switch (simulationType) {
    case 'campaign-builder':
      return {
        ...baseState,
        campaignBuilder: createCampaignBuilderState(context),
      };
    case 'bid-elevator':
      return {
        ...baseState,
        bidElevator: createBidElevatorState(context),
      };
    case 'str-triage-arena':
      return {
        ...baseState,
        strTriage: createStrTriageState(context),
      };
    default:
      return baseState;
  }
}

function createCampaignBuilderState(context: SimulationContext): CampaignBuilderState {
  return {
    campaigns: [],
    availableProducts: context.products,
    selectedProductId: undefined,
  };
}

function createBidElevatorState(context: SimulationContext): BidElevatorState {
  return {
    scenarios: [], // Populated from fixtures
    decisions: [],
    currentScenarioIndex: 0,
  };
}

function createStrTriageState(context: SimulationContext): StrTriageState {
  return {
    searchTerms: [], // Populated from fixtures
    userActions: [],
    currentIndex: 0,
    totalSearchTerms: 0,
  };
}

// ============================================================================
// STATE TRANSITIONS
// ============================================================================

/**
 * Start a simulation — transition from 'idle' to 'active'.
 */
export function startSimulation(state: SimulationState): SimulationState {
  if (state.status !== 'idle') {
    return state; // Cannot start from non-idle state
  }
  return {
    ...state,
    status: 'active',
    startedAt: Date.now(),
  };
}

export function addCampaign(
  state: SimulationState,
  campaign: CampaignStructure
): SimulationState {
  if (state.status !== 'active' || !state.campaignBuilder) {
    return state;
  }

  const action: UserAction = {
    type: 'add_campaign',
    payload: { campaignId: campaign.id, campaignName: campaign.name },
    timestamp: Date.now(),
  };

  return {
    ...state,
    actions: [...state.actions, action],
    campaignBuilder: {
      ...state.campaignBuilder,
      campaigns: [...state.campaignBuilder.campaigns, campaign],
    },
  };
}

/**
 * Update a campaign in the Campaign Builder.
 */
export function addKeyword(
  state: SimulationState,
  campaignId: string,
  keyword: CampaignKeyword
): SimulationState {
  if (state.status !== 'active' || !state.campaignBuilder) {
    return state;
  }

  const action: UserAction = {
    type: 'add_keyword',
    payload: { campaignId, keywordId: keyword.id, keywordText: keyword.text },
    timestamp: Date.now(),
  };

  const campaigns = state.campaignBuilder.campaigns.map((c) => {
    if (c.id !== campaignId) return c;
    return { ...c, keywords: [...c.keywords, keyword] };
  });

  return {
    ...state,
    actions: [...state.actions, action],
    campaignBuilder: { ...state.campaignBuilder, campaigns },
  };
}

/**
 * Remove a keyword from a campaign.
 */
export function removeKeyword(
  state: SimulationState,
  campaignId: string,
  keywordId: string
): SimulationState {
  if (state.status !== 'active' || !state.campaignBuilder) {
    return state;
  }

  const action: UserAction = {
    type: 'remove_keyword',
    payload: { campaignId, keywordId },
    timestamp: Date.now(),
  };

  const campaigns = state.campaignBuilder.campaigns.map((c) => {
    if (c.id !== campaignId) return c;
    return { ...c, keywords: c.keywords.filter((k) => k.id !== keywordId) };
  });

  return {
    ...state,
    actions: [...state.actions, action],
    campaignBuilder: { ...state.campaignBuilder, campaigns },
  };
}

// ============================================================================
// BID ELEVATOR ACTIONS
// ============================================================================

/**
 * Initialize Bid Elevator with scenarios from fixtures.
 */
export function initBidElevatorScenarios(
  state: SimulationState,
  scenarios: BidScenario[]
): SimulationState {
  if (!state.bidElevator) {
    return state;
  }
  return {
    ...state,
    bidElevator: {
      ...state.bidElevator,
      scenarios,
    },
  };
}

/**
 * Record a bid decision in the Bid Elevator.
 */
export function recordBidDecision(
  state: SimulationState,
  decision: BidDecision
): SimulationState {
  if (state.status !== 'active' || !state.bidElevator) {
    return state;
  }

  const action: UserAction = {
    type: 'bid_decision',
    payload: { scenarioId: decision.scenarioId, bidAmount: decision.bidAmount },
    timestamp: Date.now(),
  };

  return {
    ...state,
    actions: [...state.actions, action],
    bidElevator: {
      ...state.bidElevator,
      decisions: [...state.bidElevator.decisions, decision],
      currentScenarioIndex: state.bidElevator.currentScenarioIndex + 1,
    },
  };
}

// ============================================================================
// STR TRIAGE ACTIONS
// ============================================================================

/**
 * Initialize STR Triage with search terms from fixtures.
 */
export function initStrTriageSearchTerms(
  state: SimulationState,
  searchTerms: SearchTermEntry[]
): SimulationState {
  if (!state.strTriage) {
    return state;
  }
  return {
    ...state,
    strTriage: {
      ...state.strTriage,
      searchTerms,
      totalSearchTerms: searchTerms.length,
    },
  };
}

/**
 * Record a triage action in the STR Triage Arena.
 */
export function recordStrAction(
  state: SimulationState,
  userAction: StrUserAction
): SimulationState {
  if (state.status !== 'active' || !state.strTriage) {
    return state;
  }

  const action: UserAction = {
    type: 'str_action',
    payload: { searchTermId: userAction.searchTermId, action: userAction.action },
    timestamp: Date.now(),
  };

  return {
    ...state,
    actions: [...state.actions, action],
    strTriage: {
      ...state.strTriage,
      userActions: [...state.strTriage.userActions, userAction],
      currentIndex: state.strTriage.currentIndex + 1,
    },
  };
}


/**
 * Calculate elapsed time for an active simulation.
 */
export function isSimulationComplete(state: SimulationState): boolean {
  switch (state.simulationType) {
    case 'campaign-builder':
      return (state.campaignBuilder?.campaigns.length ?? 0) > 0;
    case 'bid-elevator':
      return (
        (state.bidElevator?.decisions.length ?? 0) ===
        (state.bidElevator?.scenarios.length ?? 0) &&
        (state.bidElevator?.scenarios.length ?? 0) > 0
      );
    case 'str-triage-arena':
      return (
        (state.strTriage?.userActions.length ?? 0) ===
        (state.strTriage?.totalSearchTerms ?? 0) &&
        (state.strTriage?.totalSearchTerms ?? 0) > 0
      );
    default:
      return false;
  }
}
