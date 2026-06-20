'use client';

import { create } from 'zustand';
import type {
  CampaignStructure,
  CampaignKeyword,
  CampaignType,
  TargetingType,
  BidStrategy,
  CampaignBuilderEvaluation,
  SimulationContext,
  SimProduct,
  CriterionResult,
} from '@/engine';
import {
  previewCampaignBuilderScore,
  validateCampaignBuilder,
} from '@/engine';
import {
  startAttempt,
  gradeCampaignBuilderAttempt,
} from '@/app/actions/simulation';
import fixtureData from '../../fixtures/campaign-builder-pack-1.json';

// ---------------------------------------------------------------------------
// Fixture → Engine type mapping
// ---------------------------------------------------------------------------

interface FixtureKeyword {
  id: string;
  text: string;
  matchType: string;
  suggestedBid: number;
  searchVolume: string;
  competition: string;
  relevanceScore: number;
}

interface FixtureNegativeKeyword {
  id: string;
  text: string;
  matchType: string;
  reasoning: string;
}

interface FixtureReferenceCampaign {
  id: string;
  name: string;
  type: string;
  targetingType: string;
  dailyBudget: number;
  bidStrategy: string;
  defaultBid: number;
  keywords: FixtureRefKeyword[];
  asins: string[];
  adGroupName?: string;
  reasoning: string;
}

interface FixtureRefKeyword {
  id: string;
  text: string;
  matchType: string;
  bid: number;
  isNegative: boolean;
}

function mapProducts(): SimProduct[] {
  return (fixtureData.availableProducts as typeof fixtureData.availableProducts).map((p) => ({
    asin: p.asin,
    title: p.title,
    category: p.category,
    price: p.price,
    margin: p.margin,
    averageSpend: p.averageSpend,
    averageSales: p.averageSales,
    averageOrders: p.averageOrders,
  }));
}

// Build simulation context
function buildContext(): SimulationContext {
  return {
    type: 'campaign-builder',
    moduleId: 'campaign-architecture',
    difficulty: 'intermediate',
    userLevel: 1,
    timeLimitSeconds: null,
    products: mapProducts(),
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

const SIM_CONTEXT = buildContext();
const AVAILABLE_PRODUCTS = mapProducts();
const SUGGESTED_KEYWORDS = fixtureData.suggestedKeywords as FixtureKeyword[];
const SUGGESTED_NEGATIVES = fixtureData.suggestedNegativeKeywords as FixtureNegativeKeyword[];
const REFERENCE_CAMPAIGNS = fixtureData.referenceCampaigns as FixtureReferenceCampaign[];
const EVALUATION_CRITERIA = fixtureData.evaluationCriteria;

// ---------------------------------------------------------------------------
// Campaign evaluation (client-side for preview)
// ---------------------------------------------------------------------------

function evaluateCampaignStructure(campaign: CampaignStructure): CampaignBuilderEvaluation {
  const criteriaResults: CriterionResult[] = [];

  // 1. Structure criterion (weight: 0.25)
  const structureScore = evaluateStructure(campaign);
  criteriaResults.push({
    criterionId: 'structure',
    passed: structureScore >= 60,
    score: structureScore,
    feedback: getStructureFeedback(campaign, structureScore),
  });

  // 2. Keyword selection criterion (weight: 0.30)
  const keywordScore = evaluateKeywords(campaign);
  criteriaResults.push({
    criterionId: 'keyword-selection',
    passed: keywordScore >= 50,
    score: keywordScore,
    feedback: getKeywordFeedback(campaign, keywordScore),
  });

  // 3. Negative keywords criterion (weight: 0.20)
  const negativeScore = evaluateNegatives(campaign);
  criteriaResults.push({
    criterionId: 'negative-keywords',
    passed: negativeScore >= 40,
    score: negativeScore,
    feedback: getNegativeFeedback(campaign, negativeScore),
  });

  // 4. Bidding criterion (weight: 0.15)
  const biddingScore = evaluateBidding(campaign);
  criteriaResults.push({
    criterionId: 'bidding',
    passed: biddingScore >= 50,
    score: biddingScore,
    feedback: getBiddingFeedback(campaign, biddingScore),
  });

  // 5. Budget criterion (weight: 0.10)
  const budgetScore = evaluateBudget(campaign);
  criteriaResults.push({
    criterionId: 'budget',
    passed: budgetScore >= 50,
    score: budgetScore,
    feedback: getBudgetFeedback(campaign, budgetScore),
  });

  // Calculate weighted total
  const weights = [0.25, 0.30, 0.20, 0.15, 0.10];
  const totalScore = Math.round(
    criteriaResults.reduce((sum, r, i) => sum + r.score * weights[i], 0)
  );

  return {
    simulationId: 'campaign-builder',
    userId: '',
    totalScore,
    criteriaResults,
    campaignStructure: campaign,
    projectedMetrics: {
      impressions: 5000,
      clicks: 150,
      spend: 120,
      orders: 12,
      sales: 360,
      unitsSold: 12,
      ctr: 0.03,
      cpc: 0.80,
      conversionRate: 0.08,
      acos: 0.33,
      tacos: 0.33,
      roas: 3.0,
    },
    feedback: generateOverallFeedback(totalScore),
  };
}

// --- Individual criterion evaluators ---

function evaluateStructure(campaign: CampaignStructure): number {
  let score = 0;
  // Sponsored Products (correct for single ASIN): +40
  if (campaign.type === 'sponsored-products') score += 40;
  else if (campaign.type === 'sponsored-brands') score += 15;
  else if (campaign.type === 'sponsored-display') score += 10;

  // Manual targeting (keyword control): +30
  if (campaign.targetingType === 'manual') score += 30;
  else score += 10; // Auto is OK but less control

  // Dynamic bid strategy: +30
  if (campaign.bidStrategy === 'dynamic-up-down') score += 30;
  else if (campaign.bidStrategy === 'dynamic-up-only') score += 25;
  else score += 5; // Legacy is suboptimal

  return Math.min(100, score);
}

function evaluateKeywords(campaign: CampaignStructure): number {
  const positive = campaign.keywords.filter((k) => !k.isNegative);
  if (positive.length === 0) return 0;

  let score = 0;

  // Has exact match keywords: +25
  const exactCount = positive.filter((k) => k.matchType === 'exact').length;
  if (exactCount >= 3) score += 25;
  else if (exactCount >= 1) score += 15;

  // Has broad/phrase match: +25
  const discoveryCount = positive.filter((k) => k.matchType === 'broad' || k.matchType === 'phrase').length;
  if (discoveryCount >= 2) score += 25;
  else if (discoveryCount >= 1) score += 15;

  // Relevance check - penalize low-relevance keywords
  const lowRelevanceKws = positive.filter((k) => {
    const suggested = SUGGESTED_KEYWORDS.find((sk) => sk.text === k.text && sk.matchType === k.matchType);
    return suggested && suggested.relevanceScore < 0.3;
  });
  if (lowRelevanceKws.length === 0) score += 25;
  else if (lowRelevanceKws.length <= 1) score += 15;
  else score += 5;

  // Keyword count reasonableness
  if (positive.length >= 3 && positive.length <= 15) score += 25;
  else if (positive.length >= 1) score += 10;

  return Math.min(100, score);
}

function evaluateNegatives(campaign: CampaignStructure): number {
  const negatives = campaign.keywords.filter((k) => k.isNegative);
  let score = 0;

  // Has negative keywords at all: +25
  if (negatives.length >= 2) score += 25;
  else if (negatives.length >= 1) score += 15;

  // Has 'free' or 'cheap' negated: +25
  const hasFreeCheap = negatives.some((k) => k.text === 'free' || k.text === 'cheap');
  if (hasFreeCheap) score += 25;

  // Has irrelevant product type negated: +25
  const hasIrrelevant = negatives.some((k) =>
    SUGGESTED_NEGATIVES.some((sn) => sn.text === k.text && sn.reasoning.includes('not') || sn.reasoning.includes('looking'))
  );
  if (hasIrrelevant) score += 25;

  // Has informational search negated: +25
  const hasInfo = negatives.some((k) =>
    k.text.includes('how to') || k.text.includes('how to use')
  );
  if (hasInfo) score += 25;
  else if (negatives.length >= 3) score += 15; // At least has other negatives

  return Math.min(100, score);
}

function evaluateBidding(campaign: CampaignStructure): number {
  let score = 0;
  const positive = campaign.keywords.filter((k) => !k.isNegative);
  const maxProfitableCpc = 29.99 * 0.08 * 0.25; // ~$0.60

  // Default bid in range: +25
  if (campaign.defaultBid >= 0.50 && campaign.defaultBid <= 2.00) score += 25;
  else if (campaign.defaultBid > 0) score += 10;

  // Exact > Broad (exact should have higher bids): +25
  const avgExactBid = positive.filter((k) => k.matchType === 'exact').reduce((s, k) => s + k.bid, 0) / Math.max(1, exactCount(positive));
  const avgBroadBid = positive.filter((k) => k.matchType === 'broad').reduce((s, k) => s + k.bid, 0) / Math.max(1, broadCount(positive));
  if (exactCount(positive) > 0 && broadCount(positive) > 0 && avgExactBid > avgBroadBid) score += 25;
  else if (exactCount(positive) > 0 || broadCount(positive) > 0) score += 10;

  // Bids don't wildly exceed max profitable CPC: +25
  const overBids = positive.filter((k) => k.bid > maxProfitableCpc * 3);
  if (overBids.length === 0) score += 25;
  else if (overBids.length <= 2) score += 15;

  // All positive keywords have bids set: +25
  if (positive.length > 0 && positive.every((k) => k.bid > 0)) score += 25;
  else if (positive.some((k) => k.bid > 0)) score += 10;

  return Math.min(100, score);
}

function exactCount(keywords: CampaignKeyword[]): number {
  return keywords.filter((k) => k.matchType === 'exact').length;
}

function broadCount(keywords: CampaignKeyword[]): number {
  return keywords.filter((k) => k.matchType === 'broad').length;
}

function evaluateBudget(campaign: CampaignStructure): number {
  let score = 0;

  // Minimum $10 for data collection: +33
  if (campaign.dailyBudget >= 10) score += 33;
  else if (campaign.dailyBudget >= 5) score += 15;

  // Maximum $100 for this product: +33
  if (campaign.dailyBudget <= 100) score += 33;
  else score += 10;

  // At least 10 clicks per day at default bid: +34
  const estimatedClicks = Math.floor(campaign.dailyBudget / campaign.defaultBid);
  if (estimatedClicks >= 10) score += 34;
  else if (estimatedClicks >= 5) score += 20;

  return Math.min(100, score);
}

// --- Feedback generators ---

function getStructureFeedback(campaign: CampaignStructure, score: number): string {
  const parts: string[] = [];
  if (campaign.type !== 'sponsored-products') {
    parts.push(`Campaign type "${campaign.type}" is not ideal for a single ASIN product. Sponsored Products is the best choice for individual product ads.`);
  } else {
    parts.push('Great choice using Sponsored Products — this is the correct campaign type for advertising a single ASIN.');
  }
  if (campaign.targetingType === 'auto') {
    parts.push('Auto targeting lets Amazon decide which search terms to bid on. Manual targeting gives you keyword-level control, which is important for learning PPC fundamentals.');
  } else {
    parts.push('Manual targeting is the right call — it gives you direct control over which keywords trigger your ads.');
  }
  if (campaign.bidStrategy === 'legacy') {
    parts.push('Legacy (fixed) bidding means your bid never adjusts. Dynamic strategies (up-only or up-down) generally perform better because Amazon can optimize bids based on likelihood to convert.');
  } else if (campaign.bidStrategy === 'dynamic-up-only') {
    parts.push('Dynamic bids up-only is a safe choice — Amazon will raise your bid when a conversion is likely, but never lower it below your set amount.');
  } else {
    parts.push('Dynamic bids up and down is the most aggressive strategy — Amazon can both raise and lower bids. Best for campaigns where you want maximum optimization.');
  }
  return parts.join(' ');
}

function getKeywordFeedback(campaign: CampaignStructure, score: number): string {
  const positive = campaign.keywords.filter((k) => !k.isNegative);
  const parts: string[] = [];

  if (positive.length === 0) {
    return 'No positive keywords were added. A manual targeting campaign needs at least one keyword to run. Add keywords that shoppers would use to find your product.';
  }

  const exactKws = positive.filter((k) => k.matchType === 'exact');
  const broadKws = positive.filter((k) => k.matchType === 'broad');
  const phraseKws = positive.filter((k) => k.matchType === 'phrase');

  if (exactKws.length >= 3) {
    parts.push(`Good keyword selection with ${exactKws.length} exact match keywords — these capture high-intent shoppers who know exactly what they want.`);
  } else if (exactKws.length > 0) {
    parts.push(`You have ${exactKws.length} exact match keyword(s). Consider adding more to capture high-intent searchers — "garlic press" and "heavy duty garlic press" are strong exact match candidates.`);
  } else {
    parts.push('No exact match keywords found. Exact match is crucial for capturing shoppers with clear purchase intent. Add your most relevant keywords as exact match.');
  }

  if (broadKws.length + phraseKws.length > 0) {
    parts.push(`${broadKws.length + phraseKws.length} broad/phrase keywords provide discovery — they help you find new search terms you might not have thought of.`);
  } else {
    parts.push('Consider adding broad or phrase match keywords for discovery. They have lower conversion rates but help you find new winning search terms.');
  }

  return parts.join(' ');
}

function getNegativeFeedback(campaign: CampaignStructure, score: number): string {
  const negatives = campaign.keywords.filter((k) => k.isNegative);
  const parts: string[] = [];

  if (negatives.length === 0) {
    return 'No negative keywords added. Without negatives, your ads may show for irrelevant searches like "free garlic press" or "how to use a garlic press" — wasting your budget on clicks that won\'t convert.';
  }

  parts.push(`You added ${negatives.length} negative keyword(s).`);

  const hasFreeCheap = negatives.some((k) => k.text === 'free' || k.text === 'cheap');
  if (hasFreeCheap) {
    parts.push('Good job negating price-sensitive terms like "free" or "cheap" — these shoppers rarely convert on a premium product.');
  } else {
    parts.push('Consider adding "free" and "cheap" as negative keywords — price-sensitive shoppers looking for free or cheap items won\'t buy a $29.99 premium product.');
  }

  const hasIrrelevant = negatives.some((k) => k.text.includes('electric') || k.text.includes('replacement') || k.text.includes('parts'));
  if (hasIrrelevant) {
    parts.push('Good filtering of irrelevant product types — this prevents spend on shoppers looking for different products.');
  }

  return parts.join(' ');
}

function getBiddingFeedback(campaign: CampaignStructure, score: number): string {
  const positive = campaign.keywords.filter((k) => !k.isNegative);
  const parts: string[] = [];
  const maxProfitableCpc = 29.99 * 0.08 * 0.25;

  if (positive.length === 0) {
    return 'No bids to evaluate — add positive keywords first.';
  }

  if (campaign.defaultBid >= 0.50 && campaign.defaultBid <= 2.00) {
    parts.push(`Default bid of $${campaign.defaultBid.toFixed(2)} is in a reasonable range for this category.`);
  } else if (campaign.defaultBid > 2.00) {
    parts.push(`Default bid of $${campaign.defaultBid.toFixed(2)} is quite high. With a max profitable CPC of ~$${maxProfitableCpc.toFixed(2)}, high bids could lead to unprofitable clicks.`);
  } else {
    parts.push(`Default bid of $${campaign.defaultBid.toFixed(2)} is very low. Your ads may not get enough impressions to generate meaningful data.`);
  }

  const avgBid = positive.reduce((s, k) => s + k.bid, 0) / positive.length;
  parts.push(`Average keyword bid is $${avgBid.toFixed(2)} across ${positive.length} positive keywords.`);

  return parts.join(' ');
}

function getBudgetFeedback(campaign: CampaignStructure, score: number): string {
  const parts: string[] = [];
  const estimatedClicks = Math.floor(campaign.dailyBudget / Math.max(0.01, campaign.defaultBid));

  if (campaign.dailyBudget >= 10 && campaign.dailyBudget <= 100) {
    parts.push(`Daily budget of $${campaign.dailyBudget.toFixed(2)} is appropriate for this product.`);
  } else if (campaign.dailyBudget < 10) {
    parts.push(`Daily budget of $${campaign.dailyBudget.toFixed(2)} may be too low. You need at least 10 clicks per day to gather meaningful performance data.`);
  } else {
    parts.push(`Daily budget of $${campaign.dailyBudget.toFixed(2)} is generous. For a $29.99 product, you might not need to spend this much initially.`);
  }

  parts.push(`At your default bid, this budget allows for approximately ${estimatedClicks} clicks per day.`);

  return parts.join(' ');
}

function generateOverallFeedback(score: number): string {
  if (score >= 90) return 'Outstanding campaign architecture! Your structure, keywords, and bidding strategy demonstrate expert-level understanding of Amazon PPC. This campaign would perform well in the real world.';
  if (score >= 75) return 'Strong campaign design! You\'ve got the fundamentals right — good structure, relevant keywords, and appropriate negatives. A few tweaks could make this even more effective.';
  if (score >= 50) return 'Decent foundation, but there\'s room to improve. Review the criteria feedback to see where your campaign can be strengthened. Focus on keyword relevance and negative keyword coverage.';
  if (score >= 25) return 'Your campaign needs significant improvement. The structure or keyword choices may not effectively reach your target audience. Review the basics of Sponsored Products campaigns and try again.';
  return 'The campaign structure needs fundamental changes. Start by selecting the right campaign type (Sponsored Products), add relevant keywords with appropriate match types, and include negative keywords to filter waste.';
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

export type CampaignPhase = 'briefing' | 'workshop' | 'scoring' | 'review';

export interface CampaignBuilderStore {
  phase: CampaignPhase;
  campaign: CampaignStructure;
  evaluation: CampaignBuilderEvaluation | null;
  previewScore: number;
  officialScore: number | null;
  scoreDiscrepancy: boolean;
  xpEarned: number;
  attemptId: string | null;
  isGrading: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  productContext: typeof fixtureData.productContext;
  thresholds: typeof fixtureData.thresholds;
  suggestedKeywords: FixtureKeyword[];
  suggestedNegatives: FixtureNegativeKeyword[];
  referenceCampaigns: FixtureReferenceCampaign[];
  evaluationCriteria: typeof EVALUATION_CRITERIA;
  missionBrief: typeof fixtureData.missionBrief;

  // Actions
  startSimulation: (userId?: string) => void;
  setCampaignField: <K extends keyof CampaignStructure>(key: K, value: CampaignStructure[K]) => void;
  addKeyword: (keyword: CampaignKeyword) => void;
  removeKeyword: (keywordId: string) => void;
  updateKeyword: (keywordId: string, updates: Partial<CampaignKeyword>) => void;
  submitCampaign: () => void;
  goToReview: () => void;
  resetSimulation: () => void;
}

const generateId = () => `kw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const useCampaignBuilderStore = create<CampaignBuilderStore>((set, get) => ({
  phase: 'briefing',
  campaign: {
    id: `camp-${Date.now()}`,
    name: '',
    type: 'sponsored-products',
    targetingType: 'manual',
    dailyBudget: 25,
    bidStrategy: 'dynamic-up-down',
    defaultBid: 1.00,
    keywords: [],
    asins: ['B0EXAMPLE01'],
  },
  evaluation: null,
  previewScore: 0,
  officialScore: null,
  scoreDiscrepancy: false,
  xpEarned: 0,
  attemptId: null,
  isGrading: false,
  validationErrors: [],
  validationWarnings: [],
  productContext: fixtureData.productContext,
  thresholds: fixtureData.thresholds,
  suggestedKeywords: SUGGESTED_KEYWORDS,
  suggestedNegatives: SUGGESTED_NEGATIVES,
  referenceCampaigns: REFERENCE_CAMPAIGNS,
  evaluationCriteria: EVALUATION_CRITERIA,
  missionBrief: fixtureData.missionBrief,

  startSimulation: (userId?: string) => {
    set({ phase: 'workshop' });

    // Start server-side attempt record (non-blocking)
    startAttempt({
      userId: userId || undefined,
      simulationType: 'CAMPAIGN_BUILDER',
      simulationSlug: 'campaign-builder',
    }).then((result) => {
      if (result.success) {
        set({ attemptId: result.data.attemptId });
      }
    }).catch(() => {
      console.warn('[Campaign Builder] Failed to start server attempt');
    });
  },

  setCampaignField: <K extends keyof CampaignStructure>(key: K, value: CampaignStructure[K]) => {
    const { campaign } = get();
    const updated = { ...campaign, [key]: value };
    const preview = previewCampaignBuilderScore(updated);
    const validation = validateCampaignBuilder(updated);
    set({
      campaign: updated,
      previewScore: preview,
      validationErrors: validation.errors.map((e) => e.message),
      validationWarnings: validation.warnings.map((w) => w.message),
    });
  },

  addKeyword: (keyword: CampaignKeyword) => {
    const { campaign } = get();
    const updated = { ...campaign, keywords: [...campaign.keywords, keyword] };
    const preview = previewCampaignBuilderScore(updated);
    set({ campaign: updated, previewScore: preview });
  },

  removeKeyword: (keywordId: string) => {
    const { campaign } = get();
    const updated = { ...campaign, keywords: campaign.keywords.filter((k) => k.id !== keywordId) };
    const preview = previewCampaignBuilderScore(updated);
    set({ campaign: updated, previewScore: preview });
  },

  updateKeyword: (keywordId: string, updates: Partial<CampaignKeyword>) => {
    const { campaign } = get();
    const updated = {
      ...campaign,
      keywords: campaign.keywords.map((k) => k.id === keywordId ? { ...k, ...updates } : k),
    };
    const preview = previewCampaignBuilderScore(updated);
    set({ campaign: updated, previewScore: preview });
  },

  submitCampaign: () => {
    const { campaign, attemptId, previewScore } = get();
    const evaluation = evaluateCampaignStructure(campaign);
    const timeSpentSeconds = 0; // Campaign builder doesn't track time precisely

    set({
      phase: 'scoring',
      evaluation,
      xpEarned: Math.round(evaluation.totalScore * 2),
    });

    // Server-side grading (authoritative) — non-blocking
    if (attemptId) {
      set({ isGrading: true });
      gradeCampaignBuilderAttempt({
        attemptId,
        previewScore,
        campaign,
        evaluation,
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
      campaign: {
        id: `camp-${Date.now()}`,
        name: '',
        type: 'sponsored-products',
        targetingType: 'manual',
        dailyBudget: 25,
        bidStrategy: 'dynamic-up-down',
        defaultBid: 1.00,
        keywords: [],
        asins: ['B0EXAMPLE01'],
      },
      evaluation: null,
      previewScore: 0,
      officialScore: null,
      scoreDiscrepancy: false,
      xpEarned: 0,
      attemptId: null,
      isGrading: false,
      validationErrors: [],
      validationWarnings: [],
    });
  },
}));

// Expose for components
export { SIM_CONTEXT, fixtureData, generateId };
