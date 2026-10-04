import { describe, expect, it } from 'vitest';
import {
  analyzeDimension,
  analyzeTrend,
  calculateKPIs,
  calculateMonthlySeries,
  compareDimensionItems,
  detectAnomalies,
  forecastRevenue,
} from '../server/app/analytics/engine';
import { detectQuestionIntent, resolveQuestionDeterministically } from '../server/app/analytics/intentEngine';
import { processAndCleanDataset } from '../server/app/data/processor';
import { getSampleDatasets } from '../server/app/data/sampleData';
import { runFullPipelineFromRows } from '../server/app/services/datasetService';

describe('InsightX Deterministic Analytics Engine', () => {
  it('1. derives Revenue = Quantity * Selling_Price when Revenue column is absent', () => {
    const raw = [
      { order_date: '2025-01-10', item: 'Laptop', category: 'Tech', zone: 'North', qty: 5, unit_price: 50000, cost: 40000 },
      { order_date: '2025-02-15', item: 'Mouse', category: 'Tech', zone: 'South', qty: 10, unit_price: 1000, cost: 600 },
    ];
    const processed = processAndCleanDataset(raw, 'test_derived_revenue.csv');
    expect(processed.quality.capabilities.revenue.status).toBe('Derived');
    expect(processed.rows[0].Revenue).toBe(250000);
    expect(processed.rows[1].Revenue).toBe(10000);
  });

  it('2 & 3. calculates Profit and Profit Margin when Cost exists, and marks Unavailable when Cost is missing', () => {
    const withCost = [
      { date: '2025-01-10', product: 'Laptop', revenue: 100000, cost: 75000, quantity: 2 },
    ];
    const procWithCost = processAndCleanDataset(withCost, 'with_cost.csv');
    const monthly = calculateMonthlySeries(procWithCost.rows, true);
    const kpisWithCost = calculateKPIs(procWithCost.rows, monthly, true, true);
    expect(kpisWithCost.totalProfit).toBe(25000);
    expect(kpisWithCost.profitMargin).toBe(25);
    expect(kpisWithCost.profitUnavailableReason).toBeNull();

    const withoutCost = [
      { date: '2025-01-10', product: 'Laptop', revenue: 100000, quantity: 2 },
    ];
    const procNoCost = processAndCleanDataset(withoutCost, 'no_cost.csv');
    const monthlyNoCost = calculateMonthlySeries(procNoCost.rows, false);
    const kpisNoCost = calculateKPIs(procNoCost.rows, monthlyNoCost, false, true);
    expect(kpisNoCost.totalProfit).toBeNull();
    expect(kpisNoCost.profitMargin).toBeNull();
    expect(kpisNoCost.profitUnavailableReason).toBe('Profit unavailable because Cost data is missing.');
  });

  it('4. calculates Month-over-Month Revenue Growth % accurately', () => {
    const raw = [
      { date: '2025-01-10', product: 'A', revenue: 100000, cost: 60000, qty: 10 },
      { date: '2025-02-10', product: 'A', revenue: 125000, cost: 70000, qty: 12 },
    ];
    const proc = processAndCleanDataset(raw, 'growth.csv');
    const monthly = calculateMonthlySeries(proc.rows, true);
    const kpis = calculateKPIs(proc.rows, monthly, true, true);
    expect(kpis.revenueGrowth).toBe(25);
  });

  it('5, 6 & 7. performs Product, Category, and Regional analysis sorted by Revenue descending with Contribution % and Rank', () => {
    const raw = [
      { date: '2025-01-10', product: 'Mouse', category: 'Accessories', region: 'South', revenue: 20000, cost: 10000, qty: 20 },
      { date: '2025-01-12', product: 'Laptop', category: 'Electronics', region: 'North', revenue: 80000, cost: 60000, qty: 2 },
    ];
    const proc = processAndCleanDataset(raw, 'dimensions.csv');
    const products = analyzeDimension(proc.rows, 'Product', true);
    const categories = analyzeDimension(proc.rows, 'Category', true);
    const regions = analyzeDimension(proc.rows, 'Region', true);

    expect(products[0].name).toBe('Laptop');
    expect(products[0].rank).toBe(1);
    expect(products[0].contributionPct).toBe(80);
    expect(products[1].name).toBe('Mouse');
    expect(products[1].rank).toBe(2);
    expect(products[1].contributionPct).toBe(20);

    expect(categories[0].name).toBe('Electronics');
    expect(regions[0].name).toBe('North');
  });

  it('8. detects Increasing, Decreasing, and Insufficient data trends accurately', () => {
    const incSeries = [
      { month: '2025-01', label: 'Jan 2025', revenue: 100000, profit: 20000, cost: 80000, quantity: 10, orderCount: 1, growthPct: null },
      { month: '2025-02', label: 'Feb 2025', revenue: 130000, profit: 26000, cost: 104000, quantity: 13, orderCount: 1, growthPct: 30 },
      { month: '2025-03', label: 'Mar 2025', revenue: 160000, profit: 32000, cost: 128000, quantity: 16, orderCount: 1, growthPct: 23.08 },
    ];
    const incTrend = analyzeTrend(incSeries);
    expect(incTrend.direction).toBe('Increasing');
    expect(incTrend.peakMonth?.month).toBe('2025-03');
    expect(incTrend.lowestMonth?.month).toBe('2025-01');

    const decSeries = [...incSeries].reverse().map((m, idx) => ({ ...m, month: `2025-0${idx + 1}` }));
    expect(analyzeTrend(decSeries).direction).toBe('Decreasing');
    expect(analyzeTrend([incSeries[0]]).direction).toBe('Insufficient data');
  });

  it('9. performs deterministic Comparison analysis between two dimension items', () => {
    const raw = [
      { date: '2025-01-10', product: 'Laptop', category: 'Tech', region: 'North', revenue: 125000, cost: 80000, qty: 3 },
      { date: '2025-01-12', product: 'Mouse', category: 'Tech', region: 'South', revenue: 98000, cost: 50000, qty: 98 },
    ];
    const proc = processAndCleanDataset(raw, 'comp.csv');
    const regions = analyzeDimension(proc.rows, 'Region', true);
    const comp = compareDimensionItems(regions, 'region', 'revenue', 'North', 'South');

    expect(comp).not.toBeNull();
    expect(comp?.itemA.value).toBe(125000);
    expect(comp?.itemB.value).toBe(98000);
    expect(comp?.difference).toBe(27000);
    expect(comp?.winner).toBe('North');
  });

  it('10. forecasts next month revenue using Linear Regression and enforces minimum 3 observations', () => {
    const shortSeries = [
      { month: '2025-01', label: 'Jan 2025', revenue: 100000, profit: null, cost: null, quantity: 10, orderCount: 1, growthPct: null },
      { month: '2025-02', label: 'Feb 2025', revenue: 120000, profit: null, cost: null, quantity: 12, orderCount: 1, growthPct: 20 },
    ];
    expect(forecastRevenue(shortSeries).available).toBe(false);

    const validSeries = [
      ...shortSeries,
      { month: '2025-03', label: 'Mar 2025', revenue: 140000, profit: null, cost: null, quantity: 14, orderCount: 1, growthPct: 16.67 },
      { month: '2025-04', label: 'Apr 2025', revenue: 160000, profit: null, cost: null, quantity: 16, orderCount: 1, growthPct: 14.29 },
    ];
    const fc = forecastRevenue(validSeries);
    expect(fc.available).toBe(true);
    expect(fc.prediction).toBe(180000);
    expect(fc.mae).toBe(0);
    expect(fc.rmse).toBe(0);
    expect(fc.disclaimer).toBe('Estimate — not a guarantee.');
  });

  it('11. detects statistical revenue anomalies using IQR', () => {
    const sample = getSampleDatasets()[0];
    const proc = processAndCleanDataset(sample.rows, sample.filename);
    const monthly = calculateMonthlySeries(proc.rows, true);
    const anomalies = detectAnomalies(proc.rows, monthly);
    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies[0].direction).toBe('spike');
  });

  it('12. detects Question Intents in both English and Hinglish without calling Gemini API', async () => {
    const q1 = detectQuestionIntent('Which product sabse zyada revenue laaya?', ['Laptop', 'Mouse'], [], []);
    expect(q1.intent).toBe('top_dimension');
    expect(q1.metric).toBe('revenue');
    expect(q1.dimension).toBe('product');
    expect(q1.isHinglish).toBe(true);

    const q2 = detectQuestionIntent('North vs South revenue?', [], [], ['North', 'South']);
    expect(q2.intent).toBe('comparison');
    expect(q2.metric).toBe('revenue');
    expect(q2.dimension).toBe('region');
    expect(q2.comparisonValues).toEqual(['North', 'South']);

    const q3 = detectQuestionIntent('profit kitna hua bhai?');
    expect(q3.intent).toBe('metric_value');
    expect(q3.metric).toBe('profit');
    expect(q3.isHinglish).toBe(true);

    const q4 = detectQuestionIntent('next month sales kitni ho skti h?');
    expect(q4.intent).toBe('forecast');

    const sample = getSampleDatasets()[0];
    const bundle = await runFullPipelineFromRows(sample.rows, sample.filename, 1024, true);
    const resolved = resolveQuestionDeterministically('North vs South revenue?', bundle);
    expect(resolved.comparison?.winner).toBe('North');
  });
});
