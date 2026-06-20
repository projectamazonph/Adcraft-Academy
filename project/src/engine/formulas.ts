/**
 * AdCraft: PPC Formula Engine
 *
 * Pure functions for calculating all Amazon PPC metrics.
 * Zero side effects, zero framework dependencies.
 * Same function runs on both client (preview) and server (authoritative).
 *
 * Every formula is:
 * 1. Deterministic — same inputs always produce same output
 * 2. Pure — no side effects, no I/O
 * 3. Type-safe — full TypeScript coverage
 * 4. Tested — property-based tests with fast-check
 */

import type {
  PpcRawData,
  PpcMetrics,
  PpcFormula,
  FormulaResult,
  PpcMetricThresholds,
  PpcMetricsHealth,
  MetricHealthStatus,
} from './types';

// ============================================================================
// CORE PPC FORMULAS
// ============================================================================

/**
 * Calculate Cost Per Click (CPC)
 * CPC = Total Spend / Total Clicks
 */
export function calculateCpc(spend: number, clicks: number): number {
  if (clicks === 0) return 0;
  return spend / clicks;
}

/**
 * Calculate Advertising Cost of Sales (ACoS)
 * ACoS = Ad Spend / Attributed Sales
 * Returns a decimal (e.g., 0.25 = 25%)
 */
export function calculateAcos(spend: number, sales: number): number {
  if (sales === 0) return spend > 0 ? Infinity : 0;
  return spend / sales;
}

/**
 * Calculate Total Advertising Cost of Sales (TACoS)
 * TACoS = Ad Spend / Total Sales
 * Total sales includes organic + attributed sales.
 * Returns a decimal (e.g., 0.10 = 10%)
 */
export function calculateTacos(spend: number, totalSales: number): number {
  if (totalSales === 0) return spend > 0 ? Infinity : 0;
  return spend / totalSales;
}

/**
 * Calculate Return on Ad Spend (ROAS)
 * ROAS = Attributed Sales / Ad Spend
 * Inverse of ACoS. Returns a ratio (e.g., 4.0 = 4x return)
 */
export function calculateRoas(spend: number, sales: number): number {
  if (spend === 0) return sales > 0 ? Infinity : 0;
  return sales / spend;
}

/**
 * Calculate Click-Through Rate (CTR)
 * CTR = Clicks / Impressions
 * Returns a decimal (e.g., 0.05 = 5%)
 */
export function calculateCtr(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return clicks / impressions;
}

/**
 * Calculate Conversion Rate (CVR)
 * CVR = Orders / Clicks
 * Returns a decimal (e.g., 0.10 = 10%)
 */
export function calculateConversionRate(orders: number, clicks: number): number {
  if (clicks === 0) return 0;
  return orders / clicks;
}

/**
 * Calculate Break-Even ACoS
 * Break-Even ACoS = Profit Margin (as decimal)
 * This is the maximum ACoS at which you still break even.
 */
export function calculateBreakEvenAcos(margin: number): number {
  return margin; // Break-even ACoS equals your profit margin
}

/**
 * Calculate Maximum Profitable Bid (Max CPC)
 * Max CPC = Average Order Value * Conversion Rate * Target ACoS
 */
export function calculateMaxCpc(
  averageOrderValue: number,
  conversionRate: number,
  targetAcos: number
): number {
  return averageOrderValue * conversionRate * targetAcos;
}

/**
 * Calculate Average Order Value (AOV)
 * AOV = Total Sales / Total Orders
 */
export function calculateAov(sales: number, orders: number): number {
  if (orders === 0) return 0;
  return sales / orders;
}

/**
 * Calculate Impressions Share (IS)
 * IS = Impressions Received / Eligible Impressions
 */
export function calculateImpressionShare(
  impressionsReceived: number,
  eligibleImpressions: number
): number {
  if (eligibleImpressions === 0) return 0;
  return impressionsReceived / eligibleImpressions;
}

// ============================================================================
// METRICS CALCULATION
// ============================================================================

/**
 * Calculate all PPC metrics from raw data.
 * This is the main entry point for metrics computation.
 */
export function calculateMetrics(raw: PpcRawData): PpcMetrics {
  return {
    cpc: calculateCpc(raw.spend, raw.clicks),
    acos: calculateAcos(raw.spend, raw.sales),
    tacos: 0, // Requires total sales (organic + attributed), not available from raw data alone
    roas: calculateRoas(raw.spend, raw.sales),
    ctr: calculateCtr(raw.clicks, raw.impressions),
    conversionRate: calculateConversionRate(raw.orders, raw.clicks),
    impressions: raw.impressions,
    clicks: raw.clicks,
    spend: raw.spend,
    sales: raw.sales,
    orders: raw.orders,
    unitsSold: raw.unitsSold,
  };
}

/**
 * Calculate all PPC metrics including TACoS (requires total sales including organic).
 */
export function calculateMetricsWithTacos(
  raw: PpcRawData,
  totalSales: number
): PpcMetrics {
  const metrics = calculateMetrics(raw);
  metrics.tacos = calculateTacos(raw.spend, totalSales);
  return metrics;
}

// ============================================================================
// METRICS HEALTH ASSESSMENT
// ============================================================================

/**
 * Assess the health of a single metric against its threshold.
 */
export function assessMetricHealth(
  value: number,
  target: number,
  direction: 'lower_is_better' | 'higher_is_better',
  tolerance: number = 0.25 // 25% tolerance for "good" range
): MetricHealthStatus {
  if (!isFinite(value) || value < 0) return 'insufficient_data';

  if (direction === 'lower_is_better') {
    if (value <= target) return 'excellent';
    if (value <= target * (1 + tolerance)) return 'good';
    if (value <= target * (1 + tolerance * 2)) return 'warning';
    return 'critical';
  } else {
    if (value >= target) return 'excellent';
    if (value >= target * (1 - tolerance)) return 'good';
    if (value >= target * (1 - tolerance * 2)) return 'warning';
    return 'critical';
  }
}

/**
 * Assess the health of all PPC metrics against thresholds.
 * Returns a comprehensive health assessment with an overall score.
 */
export function assessMetricsHealth(
  metrics: PpcMetrics,
  thresholds: PpcMetricThresholds
): PpcMetricsHealth {
  const acosHealth = assessMetricHealth(metrics.acos, thresholds.acosTarget, 'lower_is_better');
  const tacosHealth = assessMetricHealth(metrics.tacos, thresholds.tacosTarget, 'lower_is_better');
  const roasHealth = assessMetricHealth(metrics.roas, thresholds.roasMinimum, 'higher_is_better');
  const ctrHealth = assessMetricHealth(metrics.ctr, thresholds.ctrMinimum, 'higher_is_better');
  const cvrHealth = assessMetricHealth(
    metrics.conversionRate,
    thresholds.conversionRateMinimum,
    'higher_is_better'
  );
  const cpcHealth = assessMetricHealth(metrics.cpc, thresholds.cpcMaximum, 'lower_is_better');

  // Calculate overall score (weighted average)
  const healthScores: Record<MetricHealthStatus, number> = {
    excellent: 100,
    good: 80,
    warning: 50,
    critical: 20,
    insufficient_data: 0,
  };

  // Weighted: ACoS and ROAS are most important
  const score =
    healthScores[acosHealth] * 0.3 +
    healthScores[roasHealth] * 0.25 +
    healthScores[ctrHealth] * 0.15 +
    healthScores[cvrHealth] * 0.15 +
    healthScores[cpcHealth] * 0.1 +
    healthScores[tacosHealth] * 0.05;

  // Determine overall health from score
  let overall: MetricHealthStatus;
  if (score >= 90) overall = 'excellent';
  else if (score >= 70) overall = 'good';
  else if (score >= 45) overall = 'warning';
  else overall = 'critical';

  return {
    overall,
    acos: acosHealth,
    tacos: tacosHealth,
    roas: roasHealth,
    ctr: ctrHealth,
    conversionRate: cvrHealth,
    cpc: cpcHealth,
    score: Math.round(score),
  };
}

// ============================================================================
// FORMULA REGISTRY
// ============================================================================

/**
 * Registry of all PPC formulas available in the system.
 * Used by the lesson player and formula widget for teaching.
 */
export const PPC_FORMULAS: PpcFormula[] = [
  {
    id: 'cpc',
    name: 'Cost Per Click',
    slug: 'cpc',
    expression: 'Spend / Clicks',
    description: 'The average amount you pay each time someone clicks your ad. Lower CPC means you get more clicks for your budget.',
    unit: 'currency',
    category: 'cost',
    moduleRef: 1,
    inputs: [
      { name: 'Spend', slug: 'spend', type: 'number', description: 'Total ad spend', defaultValue: 50 },
      { name: 'Clicks', slug: 'clicks', type: 'number', description: 'Total clicks', defaultValue: 100 },
    ],
  },
  {
    id: 'acos',
    name: 'ACoS',
    slug: 'acos',
    expression: 'Spend / Sales',
    description: 'Advertising Cost of Sales — the percentage of attributed sales spent on advertising. Lower ACoS means more efficient ad spend.',
    unit: 'percentage',
    category: 'efficiency',
    moduleRef: 1,
    inputs: [
      { name: 'Spend', slug: 'spend', type: 'number', description: 'Total ad spend', defaultValue: 100 },
      { name: 'Sales', slug: 'sales', type: 'number', description: 'Total attributed sales', defaultValue: 400 },
    ],
  },
  {
    id: 'tacos',
    name: 'TACoS',
    slug: 'tacos',
    expression: 'Spend / Total Sales',
    description: 'Total Advertising Cost of Sales — measures ad spend relative to your total revenue (organic + advertised). Reveals if ads are cannibalizing organic sales.',
    unit: 'percentage',
    category: 'efficiency',
    moduleRef: 1,
    inputs: [
      { name: 'Spend', slug: 'spend', type: 'number', description: 'Total ad spend', defaultValue: 100 },
      { name: 'Total Sales', slug: 'totalSales', type: 'number', description: 'Total revenue (organic + ads)', defaultValue: 2000 },
    ],
  },
  {
    id: 'roas',
    name: 'ROAS',
    slug: 'roas',
    expression: 'Sales / Spend',
    description: 'Return on Ad Spend — how many dollars of revenue you earn for every dollar spent. A ROAS of 4x means you earn $4 for every $1 spent.',
    unit: 'ratio',
    category: 'efficiency',
    moduleRef: 1,
    inputs: [
      { name: 'Sales', slug: 'sales', type: 'number', description: 'Total attributed sales', defaultValue: 400 },
      { name: 'Spend', slug: 'spend', type: 'number', description: 'Total ad spend', defaultValue: 100 },
    ],
  },
  {
    id: 'ctr',
    name: 'CTR',
    slug: 'ctr',
    expression: 'Clicks / Impressions',
    description: 'Click-Through Rate — the percentage of people who see your ad and click it. Higher CTR indicates better ad relevance and targeting.',
    unit: 'percentage',
    category: 'performance',
    moduleRef: 1,
    inputs: [
      { name: 'Clicks', slug: 'clicks', type: 'number', description: 'Total clicks', defaultValue: 50 },
      { name: 'Impressions', slug: 'impressions', type: 'number', description: 'Total impressions', defaultValue: 5000 },
    ],
  },
  {
    id: 'cvr',
    name: 'Conversion Rate',
    slug: 'cvr',
    expression: 'Orders / Clicks',
    description: 'The percentage of clicks that result in a sale. Higher conversion rate means your product page is effective at converting browsers into buyers.',
    unit: 'percentage',
    category: 'performance',
    moduleRef: 1,
    inputs: [
      { name: 'Orders', slug: 'orders', type: 'number', description: 'Total orders', defaultValue: 10 },
      { name: 'Clicks', slug: 'clicks', type: 'number', description: 'Total clicks', defaultValue: 100 },
    ],
  },
  {
    id: 'break-even-acos',
    name: 'Break-Even ACoS',
    slug: 'break-even-acos',
    expression: 'Profit Margin',
    description: 'The ACoS at which you break even — your ad spend exactly equals your profit. Your actual ACoS must be below this to be profitable.',
    unit: 'percentage',
    category: 'profitability',
    moduleRef: 6,
    inputs: [
      { name: 'Profit Margin', slug: 'margin', type: 'number', description: 'Product profit margin (as %)', defaultValue: 30 },
    ],
  },
  {
    id: 'max-cpc',
    name: 'Maximum Profitable Bid',
    slug: 'max-cpc',
    expression: 'AOV x CVR x Target ACoS',
    description: 'The maximum you can bid on a keyword while still maintaining your target ACoS. Bidding above this means you will exceed your target ACoS.',
    unit: 'currency',
    category: 'profitability',
    moduleRef: 6,
    inputs: [
      { name: 'Average Order Value', slug: 'aov', type: 'number', description: 'Revenue per order', defaultValue: 25 },
      { name: 'Conversion Rate', slug: 'cvr', type: 'number', description: 'Conversion rate (as %)', defaultValue: 10 },
      { name: 'Target ACoS', slug: 'targetAcos', type: 'number', description: 'Your target ACoS (as %)', defaultValue: 25 },
    ],
  },
  {
    id: 'aov',
    name: 'Average Order Value',
    slug: 'aov',
    expression: 'Sales / Orders',
    description: 'The average revenue generated per order. Higher AOV means each sale is worth more, allowing for higher bids.',
    unit: 'currency',
    category: 'profitability',
    moduleRef: 1,
    inputs: [
      { name: 'Sales', slug: 'sales', type: 'number', description: 'Total attributed sales', defaultValue: 400 },
      { name: 'Orders', slug: 'orders', type: 'number', description: 'Total orders', defaultValue: 16 },
    ],
  },
];

/**
 * Compute a specific formula by slug.
 */
export function computeFormula(
  slug: string,
  inputs: Record<string, number>
): FormulaResult | null {
  const formula = PPC_FORMULAS.find((f) => f.slug === slug);
  if (!formula) return null;

  let output: number;
  switch (slug) {
    case 'cpc':
      output = calculateCpc(inputs.spend ?? 0, inputs.clicks ?? 0);
      break;
    case 'acos':
      output = calculateAcos(inputs.spend ?? 0, inputs.sales ?? 0);
      break;
    case 'tacos':
      output = calculateTacos(inputs.spend ?? 0, inputs.totalSales ?? 0);
      break;
    case 'roas':
      output = calculateRoas(inputs.spend ?? 0, inputs.sales ?? 0);
      break;
    case 'ctr':
      output = calculateCtr(inputs.clicks ?? 0, inputs.impressions ?? 0);
      break;
    case 'cvr':
      output = calculateConversionRate(inputs.orders ?? 0, inputs.clicks ?? 0);
      break;
    case 'break-even-acos':
      output = calculateBreakEvenAcos((inputs.margin ?? 0) / 100);
      break;
    case 'max-cpc':
      output = calculateMaxCpc(
        inputs.aov ?? 0,
        (inputs.cvr ?? 0) / 100,
        (inputs.targetAcos ?? 0) / 100
      );
      break;
    case 'aov':
      output = calculateAov(inputs.sales ?? 0, inputs.orders ?? 0);
      break;
    default:
      return null;
  }

  const formattedOutput = formatFormulaOutput(output, formula.unit);

  return {
    formulaId: formula.id,
    inputs,
    output,
    unit: formula.unit,
    formattedOutput,
  };
}

/**
 * Format a formula output based on its unit.
 */
export function formatFormulaOutput(value: number, unit: string): string {
  if (!isFinite(value)) return 'N/A';
  switch (unit) {
    case 'percentage':
      return `${(value * 100).toFixed(1)}%`;
    case 'currency':
      return `$${value.toFixed(2)}`;
    case 'ratio':
      return `${value.toFixed(1)}x`;
    case 'rate':
      return `${(value * 100).toFixed(1)}%`;
    case 'count':
      return Math.round(value).toString();
    default:
      return value.toFixed(2);
  }
}

/**
 * Get all formulas for a specific module.
 */
export function getFormulasForModule(moduleNumber: number): PpcFormula[] {
  return PPC_FORMULAS.filter((f) => f.moduleRef === moduleNumber);
}

/**
 * Get a formula by its slug.
 */
export function getFormulaBySlug(slug: string): PpcFormula | undefined {
  return PPC_FORMULAS.find((f) => f.slug === slug);
}
