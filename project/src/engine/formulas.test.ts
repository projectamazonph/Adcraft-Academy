/**
 * AdCraft: Unit Tests for PPC Formula Engine
 *
 * Tests all 11 formula functions, metrics calculation, health assessment,
 * formula registry, and formatting. Uses deterministic test cases + property-based
 * tests with fast-check for edge case coverage.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
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
} from '@/engine/formulas';
import type { PpcRawData, PpcMetricThresholds } from '@/engine/types';

// ============================================================================
// CORE PPC FORMULA TESTS
// ============================================================================

describe('calculateCpc', () => {
  it('calculates CPC correctly for standard inputs', () => {
    expect(calculateCpc(100, 200)).toBe(0.5);
  });

  it('returns 0 when clicks is 0 (division by zero guard)', () => {
    expect(calculateCpc(100, 0)).toBe(0);
  });

  it('returns 0 when both spend and clicks are 0', () => {
    expect(calculateCpc(0, 0)).toBe(0);
  });

  it('handles large values correctly', () => {
    expect(calculateCpc(10000, 5000)).toBe(2);
  });

  it('handles fractional results', () => {
    expect(calculateCpc(33, 100)).toBeCloseTo(0.33, 2);
  });
});

describe('calculateAcos', () => {
  it('calculates ACoS correctly for standard inputs', () => {
    expect(calculateAcos(100, 400)).toBe(0.25);
  });

  it('returns Infinity when sales is 0 and spend > 0', () => {
    expect(calculateAcos(100, 0)).toBe(Infinity);
  });

  it('returns 0 when both spend and sales are 0', () => {
    expect(calculateAcos(0, 0)).toBe(0);
  });

  it('returns 0 when spend is 0 but sales > 0', () => {
    expect(calculateAcos(0, 500)).toBe(0);
  });

  it('returns >1 when spending more than earning (unprofitable)', () => {
    expect(calculateAcos(500, 200)).toBe(2.5);
  });
});

describe('calculateTacos', () => {
  it('calculates TACoS correctly', () => {
    expect(calculateTacos(100, 2000)).toBe(0.05);
  });

  it('returns Infinity when totalSales is 0 and spend > 0', () => {
    expect(calculateTacos(100, 0)).toBe(Infinity);
  });

  it('returns 0 when both are 0', () => {
    expect(calculateTacos(0, 0)).toBe(0);
  });
});

describe('calculateRoas', () => {
  it('calculates ROAS correctly', () => {
    expect(calculateRoas(100, 400)).toBe(4);
  });

  it('returns Infinity when spend is 0 and sales > 0', () => {
    expect(calculateRoas(0, 500)).toBe(Infinity);
  });

  it('returns 0 when both are 0', () => {
    expect(calculateRoas(0, 0)).toBe(0);
  });

  it('ROAS is inverse of ACoS for same inputs', () => {
    const spend = 100;
    const sales = 400;
    expect(calculateRoas(spend, sales)).toBe(1 / calculateAcos(spend, sales));
  });
});

describe('calculateCtr', () => {
  it('calculates CTR correctly', () => {
    expect(calculateCtr(50, 5000)).toBe(0.01);
  });

  it('returns 0 when impressions is 0', () => {
    expect(calculateCtr(50, 0)).toBe(0);
  });

  it('returns 0 when both are 0', () => {
    expect(calculateCtr(0, 0)).toBe(0);
  });
});

describe('calculateConversionRate', () => {
  it('calculates CVR correctly', () => {
    expect(calculateConversionRate(10, 100)).toBe(0.1);
  });

  it('returns 0 when clicks is 0', () => {
    expect(calculateConversionRate(10, 0)).toBe(0);
  });
});

describe('calculateBreakEvenAcos', () => {
  it('returns the margin value directly', () => {
    expect(calculateBreakEvenAcos(0.3)).toBe(0.3);
  });

  it('returns 0 for zero margin', () => {
    expect(calculateBreakEvenAcos(0)).toBe(0);
  });
});

describe('calculateMaxCpc', () => {
  it('calculates max CPC correctly', () => {
    // AOV=25, CVR=0.1, Target ACoS=0.25 => 25 * 0.1 * 0.25 = 0.625
    expect(calculateMaxCpc(25, 0.1, 0.25)).toBeCloseTo(0.625, 3);
  });

  it('returns 0 when any input is 0', () => {
    expect(calculateMaxCpc(0, 0.1, 0.25)).toBe(0);
    expect(calculateMaxCpc(25, 0, 0.25)).toBe(0);
    expect(calculateMaxCpc(25, 0.1, 0)).toBe(0);
  });
});

describe('calculateAov', () => {
  it('calculates AOV correctly', () => {
    expect(calculateAov(400, 16)).toBe(25);
  });

  it('returns 0 when orders is 0', () => {
    expect(calculateAov(400, 0)).toBe(0);
  });
});

describe('calculateImpressionShare', () => {
  it('calculates impression share correctly', () => {
    expect(calculateImpressionShare(750, 1000)).toBe(0.75);
  });

  it('returns 0 when eligible impressions is 0', () => {
    expect(calculateImpressionShare(750, 0)).toBe(0);
  });
});

// ============================================================================
// METRICS CALCULATION TESTS
// ============================================================================

describe('calculateMetrics', () => {
  const sampleRaw: PpcRawData = {
    impressions: 10000,
    clicks: 500,
    spend: 750,
    sales: 3000,
    orders: 120,
    unitsSold: 150,
  };

  it('calculates all metrics from raw data', () => {
    const metrics = calculateMetrics(sampleRaw);
    expect(metrics.cpc).toBeCloseTo(1.5, 2);
    expect(metrics.acos).toBeCloseTo(0.25, 2);
    expect(metrics.roas).toBe(4);
    expect(metrics.ctr).toBeCloseTo(0.05, 3);
    expect(metrics.conversionRate).toBeCloseTo(0.24, 2);
    expect(metrics.impressions).toBe(10000);
    expect(metrics.tacos).toBe(0); // Not available from raw data alone
  });

  it('preserves raw data values in output', () => {
    const metrics = calculateMetrics(sampleRaw);
    expect(metrics.clicks).toBe(500);
    expect(metrics.spend).toBe(750);
    expect(metrics.sales).toBe(3000);
    expect(metrics.orders).toBe(120);
    expect(metrics.unitsSold).toBe(150);
  });
});

describe('calculateMetricsWithTacos', () => {
  it('includes TACoS when totalSales is provided', () => {
    const raw: PpcRawData = {
      impressions: 10000,
      clicks: 500,
      spend: 750,
      sales: 3000,
      orders: 120,
      unitsSold: 150,
    };
    const metrics = calculateMetricsWithTacos(raw, 15000);
    expect(metrics.tacos).toBeCloseTo(0.05, 3);
  });
});

// ============================================================================
// HEALTH ASSESSMENT TESTS
// ============================================================================

describe('assessMetricHealth', () => {
  it('returns "excellent" when value meets target (lower_is_better)', () => {
    expect(assessMetricHealth(0.15, 0.25, 'lower_is_better')).toBe('excellent');
  });

  it('returns "excellent" when value meets target (higher_is_better)', () => {
    expect(assessMetricHealth(5, 4, 'higher_is_better')).toBe('excellent');
  });

  it('returns "good" when within tolerance range', () => {
    // Target 0.25, tolerance 0.25 → good up to 0.3125
    expect(assessMetricHealth(0.30, 0.25, 'lower_is_better')).toBe('good');
  });

  it('returns "warning" when slightly beyond good range', () => {
    // Target 0.25, tolerance 0.25 → warning up to 0.375
    expect(assessMetricHealth(0.35, 0.25, 'lower_is_better')).toBe('warning');
  });

  it('returns "critical" when far beyond target', () => {
    expect(assessMetricHealth(0.50, 0.25, 'lower_is_better')).toBe('critical');
  });

  it('returns "insufficient_data" for Infinity', () => {
    expect(assessMetricHealth(Infinity, 0.25, 'lower_is_better')).toBe('insufficient_data');
  });

  it('returns "insufficient_data" for negative values', () => {
    expect(assessMetricHealth(-1, 0.25, 'lower_is_better')).toBe('insufficient_data');
  });
});

describe('assessMetricsHealth', () => {
  const defaultThresholds: PpcMetricThresholds = {
    acosTarget: 0.25,
    tacosTarget: 0.10,
    roasMinimum: 4,
    ctrMinimum: 0.005,
    conversionRateMinimum: 0.10,
    cpcMaximum: 1.5,
  };

  it('returns a health assessment with overall status and score', () => {
    const metrics = calculateMetrics({
      impressions: 10000,
      clicks: 500,
      spend: 750,
      sales: 3000,
      orders: 120,
      unitsSold: 150,
    });
    const health = assessMetricsHealth(metrics, defaultThresholds);
    expect(health.overall).toBeDefined();
    expect(health.score).toBeGreaterThanOrEqual(0);
    expect(health.score).toBeLessThanOrEqual(100);
    expect(health.acos).toBeDefined();
    expect(health.roas).toBeDefined();
  });
});

// ============================================================================
// FORMULA REGISTRY TESTS
// ============================================================================

describe('PPC_FORMULAS registry', () => {
  it('contains exactly 9 formulas', () => {
    expect(PPC_FORMULAS).toHaveLength(9);
  });

  it('each formula has required fields', () => {
    for (const formula of PPC_FORMULAS) {
      expect(formula.id).toBeTruthy();
      expect(formula.name).toBeTruthy();
      expect(formula.slug).toBeTruthy();
      expect(formula.expression).toBeTruthy();
      expect(formula.description).toBeTruthy();
      expect(formula.unit).toBeTruthy();
      expect(formula.inputs.length).toBeGreaterThan(0);
      expect(formula.moduleRef).toBeDefined();
    }
  });

  it('all slugs are unique', () => {
    const slugs = PPC_FORMULAS.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('getFormulasForModule', () => {
  it('returns Module 1 formulas (CPC, ACoS, TACoS, ROAS, CTR, CVR, AOV)', () => {
    const mod1 = getFormulasForModule(1);
    expect(mod1.length).toBe(7);
    const slugs = mod1.map((f) => f.slug).sort();
    expect(slugs).toEqual(['acos', 'aov', 'cpc', 'ctr', 'cvr', 'roas', 'tacos']);
  });

  it('returns Module 6 formulas (break-even ACoS, max CPC)', () => {
    const mod6 = getFormulasForModule(6);
    expect(mod6.length).toBe(2);
    const slugs = mod6.map((f) => f.slug).sort();
    expect(slugs).toEqual(['break-even-acos', 'max-cpc']);
  });

  it('returns empty array for module with no formulas', () => {
    expect(getFormulasForModule(99)).toHaveLength(0);
  });
});

describe('getFormulaBySlug', () => {
  it('finds a formula by slug', () => {
    const f = getFormulaBySlug('acos');
    expect(f).toBeDefined();
    expect(f!.name).toBe('ACoS');
  });

  it('returns undefined for unknown slug', () => {
    expect(getFormulaBySlug('nonexistent')).toBeUndefined();
  });
});

describe('computeFormula', () => {
  it('computes CPC from inputs', () => {
    const result = computeFormula('cpc', { spend: 100, clicks: 200 });
    expect(result).not.toBeNull();
    expect(result!.output).toBe(0.5);
    expect(result!.unit).toBe('currency');
    expect(result!.formattedOutput).toBe('$0.50');
  });

  it('computes ACoS from inputs', () => {
    const result = computeFormula('acos', { spend: 100, sales: 400 });
    expect(result).not.toBeNull();
    expect(result!.output).toBe(0.25);
    expect(result!.formattedOutput).toBe('25.0%');
  });

  it('returns null for unknown slug', () => {
    expect(computeFormula('unknown', {})).toBeNull();
  });
});

describe('formatFormulaOutput', () => {
  it('formats percentage correctly', () => {
    expect(formatFormulaOutput(0.25, 'percentage')).toBe('25.0%');
  });

  it('formats currency correctly', () => {
    expect(formatFormulaOutput(1.5, 'currency')).toBe('$1.50');
  });

  it('formats ratio correctly', () => {
    expect(formatFormulaOutput(4, 'ratio')).toBe('4.0x');
  });

  it('formats rate correctly', () => {
    expect(formatFormulaOutput(0.05, 'rate')).toBe('5.0%');
  });

  it('formats count correctly', () => {
    expect(formatFormulaOutput(42.7, 'count')).toBe('43');
  });

  it('formats Infinity as N/A', () => {
    expect(formatFormulaOutput(Infinity, 'percentage')).toBe('N/A');
  });
});

// ============================================================================
// PROPERTY-BASED TESTS (fast-check)
// ============================================================================

describe('Property-based tests: formula invariants', () => {
  it('CPC is always non-negative for non-negative inputs', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        (spend, clicks) => {
          const cpc = calculateCpc(spend, clicks);
          return cpc >= 0 || cpc === 0;
        }
      )
    );
  });

  it('ACoS and ROAS are inverses for positive spend and sales', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1e6 }),
        fc.double({ min: 0.01, max: 1e6 }),
        (spend, sales) => {
          const acos = calculateAcos(spend, sales);
          const roas = calculateRoas(spend, sales);
          if (isFinite(acos) && isFinite(roas)) {
            expect(acos * roas).toBeCloseTo(1, 6);
          }
          return true;
        }
      )
    );
  });

  it('CTR is always between 0 and 1 for realistic inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000 }),
        fc.integer({ min: 0, max: 1000000 }),
        (clicks, impressions) => {
          const ctr = calculateCtr(clicks, Math.max(impressions, clicks)); // impressions >= clicks always
          return ctr >= 0 && ctr <= 1;
        }
      )
    );
  });

  it('CVR is always between 0 and 1 for realistic inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000 }),
        fc.integer({ min: 0, max: 1000000 }),
        (orders, clicks) => {
          const cvr = calculateConversionRate(orders, Math.max(clicks, orders)); // clicks >= orders always
          return cvr >= 0 && cvr <= 1;
        }
      )
    );
  });

  it('Max CPC is always non-negative for non-negative inputs', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1e4, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (aov, cvr, targetAcos) => {
          const maxCpc = calculateMaxCpc(aov, cvr, targetAcos);
          return maxCpc >= 0;
        }
      )
    );
  });

  it('calculateMetrics never returns NaN for valid raw data', () => {
    fc.assert(
      fc.property(
        fc.record({
          impressions: fc.integer({ min: 0, max: 100000000 }),
          clicks: fc.integer({ min: 0, max: 1000000 }),
          spend: fc.integer({ min: 0, max: 1000000 }),
          sales: fc.integer({ min: 0, max: 100000000 }),
          orders: fc.integer({ min: 0, max: 1000000 }),
          unitsSold: fc.integer({ min: 0, max: 1000000 }),
        }),
        (raw) => {
          const metrics = calculateMetrics(raw);
          // tacos is always 0 from calculateMetrics (needs totalSales)
          expect(isFinite(metrics.cpc) || metrics.cpc === 0).toBe(true);
          expect(isFinite(metrics.acos) || metrics.acos === 0 || metrics.acos === Infinity).toBe(true);
          expect(isFinite(metrics.roas) || metrics.roas === 0 || metrics.roas === Infinity).toBe(true);
          expect(isFinite(metrics.ctr)).toBe(true);
          expect(isFinite(metrics.conversionRate)).toBe(true);
          return true;
        }
      )
    );
  });

  it('AOV * CVR * Target ACoS = Max CPC (formula consistency)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.double({ min: 0.01, max: 0.5, noNaN: true }),
        fc.double({ min: 0.05, max: 0.5, noNaN: true }),
        (aov, cvr, targetAcos) => {
          const maxCpc = calculateMaxCpc(aov, cvr, targetAcos);
          expect(maxCpc).toBeCloseTo(aov * cvr * targetAcos, 6);
          return true;
        }
      )
    );
  });
});
