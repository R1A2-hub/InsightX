import { NormalizedRow } from '../data/processor';
import {
  AnomalyRecord,
  ComparisonAnalysisResult,
  DimensionAnalysisRow,
  DimensionType,
  ForecastResult,
  KPISummary,
  MetricType,
  MonthlyMetricPoint,
  TrendAnalysisResult,
  TrendDirection,
} from '../schemas/analytics';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatMonthLabel(yyyyMm: string): string {
  const parts = yyyyMm.split('-');
  if (parts.length !== 2) return yyyyMm;
  const year = parts[0];
  const mIdx = parseInt(parts[1], 10) - 1;
  if (mIdx >= 0 && mIdx < 12) {
    return `${MONTH_NAMES[mIdx]} ${year}`;
  }
  return yyyyMm;
}

export function getNextMonthString(yyyyMm: string): string {
  const parts = yyyyMm.split('-');
  if (parts.length !== 2) return 'Next Month';
  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10);
  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function calculateMonthlySeries(
  rows: NormalizedRow[],
  hasCost: boolean
): MonthlyMetricPoint[] {
  const map = new Map<
    string,
    { revenue: number; profit: number; cost: number; quantity: number; count: number }
  >();

  for (const r of rows) {
    if (!r.Month) continue;
    const existing = map.get(r.Month) || { revenue: 0, profit: 0, cost: 0, quantity: 0, count: 0 };
    existing.revenue += r.Revenue ?? 0;
    existing.profit += r.Profit ?? 0;
    existing.cost += r.Cost ?? 0;
    existing.quantity += r.Quantity ?? 0;
    existing.count += 1;
    map.set(r.Month, existing);
  }

  const sortedMonths = Array.from(map.keys()).sort();
  const series: MonthlyMetricPoint[] = [];

  for (let i = 0; i < sortedMonths.length; i++) {
    const m = sortedMonths[i];
    const d = map.get(m)!;
    const prev = i > 0 ? series[i - 1] : null;
    let growthPct: number | null = null;
    if (prev && prev.revenue > 0) {
      growthPct = Number((((d.revenue - prev.revenue) / prev.revenue) * 100).toFixed(2));
    }

    series.push({
      month: m,
      label: formatMonthLabel(m),
      revenue: Number(d.revenue.toFixed(2)),
      profit: hasCost ? Number(d.profit.toFixed(2)) : null,
      cost: hasCost ? Number(d.cost.toFixed(2)) : null,
      quantity: Number(d.quantity.toFixed(2)),
      orderCount: d.count,
      growthPct,
    });
  }

  return series;
}

export function calculateKPIs(
  rows: NormalizedRow[],
  monthlySeries: MonthlyMetricPoint[],
  hasCost: boolean,
  hasQuantity: boolean,
  currencySymbol = '₹'
): KPISummary {
  let totalRevenue = 0;
  let totalProfit = 0;
  let totalCost = 0;
  let totalQuantity = 0;

  for (const r of rows) {
    totalRevenue += r.Revenue ?? 0;
    totalProfit += r.Profit ?? 0;
    totalCost += r.Cost ?? 0;
    totalQuantity += r.Quantity ?? 0;
  }

  totalRevenue = Number(totalRevenue.toFixed(2));
  totalProfit = Number(totalProfit.toFixed(2));
  totalCost = Number(totalCost.toFixed(2));
  totalQuantity = Number(totalQuantity.toFixed(2));

  const profitMargin =
    hasCost && totalRevenue > 0
      ? Number(((totalProfit / totalRevenue) * 100).toFixed(2))
      : null;

  let currentMonthRevenue: number | null = null;
  let previousMonthRevenue: number | null = null;
  let revenueGrowth: number | null = null;

  if (monthlySeries.length >= 2) {
    const curr = monthlySeries[monthlySeries.length - 1];
    const prev = monthlySeries[monthlySeries.length - 2];
    currentMonthRevenue = curr.revenue;
    previousMonthRevenue = prev.revenue;
    if (prev.revenue > 0) {
      revenueGrowth = Number((((curr.revenue - prev.revenue) / prev.revenue) * 100).toFixed(2));
    }
  }

  return {
    totalRevenue,
    totalProfit: hasCost ? totalProfit : null,
    profitMargin,
    totalQuantity: hasQuantity ? totalQuantity : null,
    totalCost: hasCost ? totalCost : null,
    revenueGrowth,
    previousMonthRevenue,
    currentMonthRevenue,
    profitUnavailableReason: hasCost
      ? null
      : 'Profit unavailable because Cost data is missing.',
    currencySymbol,
  };
}

export function analyzeDimension(
  rows: NormalizedRow[],
  dimension: 'Product' | 'Category' | 'Region',
  hasCost: boolean
): DimensionAnalysisRow[] {
  const map = new Map<string, { revenue: number; quantity: number; cost: number; profit: number }>();
  let grandTotalRevenue = 0;

  for (const r of rows) {
    const key = r[dimension] || 'Unknown';
    const rev = r.Revenue ?? 0;
    grandTotalRevenue += rev;
    const item = map.get(key) || { revenue: 0, quantity: 0, cost: 0, profit: 0 };
    item.revenue += rev;
    item.quantity += r.Quantity ?? 0;
    item.cost += r.Cost ?? 0;
    item.profit += r.Profit ?? 0;
    map.set(key, item);
  }

  const list = Array.from(map.entries()).map(([name, stats]) => {
    const revenue = Number(stats.revenue.toFixed(2));
    const profit = hasCost ? Number(stats.profit.toFixed(2)) : null;
    const cost = hasCost ? Number(stats.cost.toFixed(2)) : null;
    const profitMargin =
      hasCost && revenue > 0 && profit !== null
        ? Number(((profit / revenue) * 100).toFixed(2))
        : null;
    const contributionPct =
      grandTotalRevenue > 0
        ? Number(((revenue / grandTotalRevenue) * 100).toFixed(2))
        : 0;

    return {
      name,
      revenue,
      quantity: Number(stats.quantity.toFixed(2)),
      cost,
      profit,
      profitMargin,
      contributionPct,
      rank: 0,
    };
  });

  list.sort((a, b) => b.revenue - a.revenue);
  list.forEach((item, index) => {
    item.rank = index + 1;
  });

  return list;
}

export function analyzeTrend(
  monthlySeries: MonthlyMetricPoint[],
  currencySymbol = '₹'
): TrendAnalysisResult {
  if (monthlySeries.length < 2) {
    return {
      direction: 'Insufficient data',
      slopePerMonth: 0,
      overallChangePct: null,
      peakMonth: monthlySeries[0]
        ? {
            month: monthlySeries[0].month,
            label: monthlySeries[0].label,
            revenue: monthlySeries[0].revenue,
          }
        : null,
      lowestMonth: monthlySeries[0]
        ? {
            month: monthlySeries[0].month,
            label: monthlySeries[0].label,
            revenue: monthlySeries[0].revenue,
          }
        : null,
      monthlyValues: monthlySeries,
      plainLanguageSummary:
        'Insufficient monthly data to establish a trend direction (at least 2 distinct months required).',
    };
  }

  let peak = monthlySeries[0];
  let lowest = monthlySeries[0];
  for (const pt of monthlySeries) {
    if (pt.revenue > peak.revenue) peak = pt;
    if (pt.revenue < lowest.revenue) lowest = pt;
  }

  const n = monthlySeries.length;
  const xMean = (n - 1) / 2;
  const yMean = monthlySeries.reduce((s, p) => s + p.revenue, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (monthlySeries[i].revenue - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den !== 0 ? num / den : 0;

  const firstRev = monthlySeries[0].revenue;
  const lastRev = monthlySeries[n - 1].revenue;
  const overallChangePct =
    firstRev > 0 ? Number((((lastRev - firstRev) / firstRev) * 100).toFixed(2)) : null;

  const normalizedSlopePct = yMean > 0 ? (slope / yMean) * 100 : 0;

  let direction: TrendDirection = 'Stable';
  if (normalizedSlopePct > 1.5) {
    direction = 'Increasing';
  } else if (normalizedSlopePct < -1.5) {
    direction = 'Decreasing';
  }

  const summary = `Monthly revenue shows an ${direction.toLowerCase()} trajectory across ${n} months (${overallChangePct !== null && overallChangePct >= 0 ? '+' : ''}${overallChangePct ?? 0}% from ${monthlySeries[0].label} to ${monthlySeries[n - 1].label}). Revenue peaked in ${peak.label} at ${currencySymbol}${peak.revenue.toLocaleString()} and was lowest in ${lowest.label} at ${currencySymbol}${lowest.revenue.toLocaleString()}.`;

  return {
    direction,
    slopePerMonth: Number(slope.toFixed(2)),
    overallChangePct,
    peakMonth: { month: peak.month, label: peak.label, revenue: peak.revenue },
    lowestMonth: { month: lowest.month, label: lowest.label, revenue: lowest.revenue },
    monthlyValues: monthlySeries,
    plainLanguageSummary: summary,
  };
}

function getQuantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export function detectAnomalies(
  rows: NormalizedRow[],
  monthlySeries: MonthlyMetricPoint[],
  currencySymbol = '₹'
): AnomalyRecord[] {
  const anomalies: AnomalyRecord[] = [];

  // 1. Monthly Revenue IQR
  if (monthlySeries.length >= 4) {
    const revValues = monthlySeries.map((m) => m.revenue).sort((a, b) => a - b);
    const q1 = getQuantile(revValues, 0.25);
    const median = getQuantile(revValues, 0.5);
    const q3 = getQuantile(revValues, 0.75);
    const iqr = q3 - q1;
    const lowerBound = Math.max(0, Number((q1 - 1.5 * iqr).toFixed(2)));
    const upperBound = Number((q3 + 1.5 * iqr).toFixed(2));

    for (const m of monthlySeries) {
      if (m.revenue > upperBound || m.revenue < lowerBound) {
        const direction = m.revenue > upperBound ? 'spike' : 'drop';
        const deviationPct =
          median > 0 ? Number((((m.revenue - median) / median) * 100).toFixed(1)) : 0;

        const monthRows = rows.filter((r) => r.Month === m.month);
        monthRows.sort((a, b) => (b.Revenue ?? 0) - (a.Revenue ?? 0));
        const topRow = monthRows[0];
        const contributor = topRow
          ? `${topRow.Product} in ${topRow.Region} (${currencySymbol}${(topRow.Revenue ?? 0).toLocaleString()})`
          : undefined;

        anomalies.push({
          id: `anomaly-month-${m.month}`,
          date: m.label,
          periodType: 'monthly',
          revenue: m.revenue,
          expectedRange: {
            lower: lowerBound,
            upper: upperBound,
            median: Number(median.toFixed(2)),
            iqr: Number(iqr.toFixed(2)),
          },
          deviationPct,
          direction,
          reason:
            direction === 'spike'
              ? `Monthly revenue of ${currencySymbol}${m.revenue.toLocaleString()} exceeds the upper IQR threshold of ${currencySymbol}${upperBound.toLocaleString()} (Q3 + 1.5×IQR, +${deviationPct}% above median).`
              : `Monthly revenue of ${currencySymbol}${m.revenue.toLocaleString()} fell below the lower IQR threshold of ${currencySymbol}${lowerBound.toLocaleString()} (Q1 − 1.5×IQR, ${deviationPct}% vs median).`,
          topContributor: contributor,
        });
      }
    }
  }

  // 2. Daily / Transaction Level IQR
  const validRows = rows.filter((r) => (r.Revenue ?? 0) > 0);
  if (validRows.length >= 6) {
    const rowRevs = validRows.map((r) => r.Revenue ?? 0).sort((a, b) => a - b);
    const q1 = getQuantile(rowRevs, 0.25);
    const median = getQuantile(rowRevs, 0.5);
    const q3 = getQuantile(rowRevs, 0.75);
    const iqr = q3 - q1;
    const lowerBound = Math.max(0, Number((q1 - 2.0 * iqr).toFixed(2)));
    const upperBound = Number((q3 + 2.0 * iqr).toFixed(2));

    for (let idx = 0; idx < validRows.length; idx++) {
      const r = validRows[idx];
      const rev = r.Revenue ?? 0;
      if (rev > upperBound && iqr > 0) {
        const deviationPct =
          median > 0 ? Number((((rev - median) / median) * 100).toFixed(1)) : 0;
        anomalies.push({
          id: `anomaly-tx-${r.Date || idx}-${idx}`,
          date: r.Date || `Row #${idx + 1}`,
          periodType: 'daily',
          revenue: rev,
          expectedRange: {
            lower: lowerBound,
            upper: upperBound,
            median: Number(median.toFixed(2)),
            iqr: Number(iqr.toFixed(2)),
          },
          deviationPct,
          direction: 'spike',
          reason: `Transaction revenue of ${currencySymbol}${rev.toLocaleString()} for ${r.Product} (${r.Region}) exceeds the expected upper transaction threshold of ${currencySymbol}${upperBound.toLocaleString()} (+${deviationPct}% above median transaction).`,
          topContributor: `${r.Product} (${r.Category}) · ${r.Region}`,
        });
      }
    }
  }

  return anomalies;
}

export function forecastRevenue(monthlySeries: MonthlyMetricPoint[]): ForecastResult {
  const n = monthlySeries.length;
  const disclaimer = 'Estimate — not a guarantee.';

  if (n < 3) {
    return {
      available: false,
      unavailableReason: `Forecasting requires a minimum of 3 monthly observations (dataset currently contains ${n}).`,
      modelName: 'Predictive Trend Analysis',
      observationsCount: n,
      nextMonth: 'N/A',
      nextMonthLabel: 'N/A',
      prediction: null,
      lowerBound: null,
      upperBound: null,
      mae: null,
      rmse: null,
      rSquared: null,
      slope: null,
      intercept: null,
      disclaimer,
      historicalAndFitted: [],
    };
  }

  const xValues = monthlySeries.map((_, i) => i);
  const yValues = monthlySeries.map((m) => m.revenue);

  const xMean = xValues.reduce((a, b) => a + b, 0) / n;
  const yMean = yValues.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += (xValues[i] - xMean) ** 2;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  let absErrorSum = 0;
  let sqErrorSum = 0;
  let totalSumSquares = 0;

  const historicalAndFitted: ForecastResult['historicalAndFitted'] = [];

  for (let i = 0; i < n; i++) {
    const actual = yValues[i];
    const fitted = Number((intercept + slope * i).toFixed(2));
    const err = actual - fitted;
    absErrorSum += Math.abs(err);
    sqErrorSum += err * err;
    totalSumSquares += (actual - yMean) ** 2;

    historicalAndFitted.push({
      month: monthlySeries[i].month,
      label: monthlySeries[i].label,
      actualRevenue: actual,
      fittedRevenue: fitted,
      isForecast: false,
    });
  }

  const mae = Number((absErrorSum / n).toFixed(2));
  const rmse = Number(Math.sqrt(sqErrorSum / n).toFixed(2));
  const rSquared =
    totalSumSquares > 0 ? Number(Math.max(0, 1 - sqErrorSum / totalSumSquares).toFixed(3)) : 0;

  const rawPred = intercept + slope * n;
  const prediction = Number(Math.max(0, rawPred).toFixed(2));
  const margin = Math.max(rmse * 1.28, mae * 1.25, prediction * 0.05);
  const lowerBound = Number(Math.max(0, prediction - margin).toFixed(2));
  const upperBound = Number((prediction + margin).toFixed(2));

  const nextMonth = getNextMonthString(monthlySeries[n - 1].month);
  const nextMonthLabel = formatMonthLabel(nextMonth);

  historicalAndFitted.push({
    month: nextMonth,
    label: `${nextMonthLabel} (Forecast)`,
    actualRevenue: null,
    fittedRevenue: prediction,
    isForecast: true,
    lowerBound,
    upperBound,
  });

  return {
    available: true,
    modelName: 'Predictive Trend Analysis',
    observationsCount: n,
    nextMonth,
    nextMonthLabel,
    prediction,
    lowerBound,
    upperBound,
    mae,
    rmse,
    rSquared,
    slope: Number(slope.toFixed(2)),
    intercept: Number(intercept.toFixed(2)),
    disclaimer,
    historicalAndFitted,
  };
}

export function compareDimensionItems(
  dimensionRows: DimensionAnalysisRow[],
  dimension: DimensionType,
  metric: MetricType,
  itemAQuery: string,
  itemBQuery: string,
  currencySymbol = '₹'
): ComparisonAnalysisResult | null {
  const findMatch = (q: string): DimensionAnalysisRow | undefined => {
    const cleanQ = q.trim().toLowerCase();
    return (
      dimensionRows.find((r) => r.name.toLowerCase() === cleanQ) ||
      dimensionRows.find((r) => r.name.toLowerCase().includes(cleanQ)) ||
      dimensionRows.find((r) => cleanQ.includes(r.name.toLowerCase()))
    );
  };

  const rowA = findMatch(itemAQuery);
  const rowB = findMatch(itemBQuery);

  if (!rowA || !rowB) {
    return null;
  }

  const getVal = (row: DimensionAnalysisRow): number | null => {
    switch (metric) {
      case 'revenue':
        return row.revenue;
      case 'profit':
        return row.profit;
      case 'cost':
        return row.cost;
      case 'quantity':
        return row.quantity;
      case 'profit_margin':
        return row.profitMargin;
      default:
        return row.revenue;
    }
  };

  const valA = getVal(rowA);
  const valB = getVal(rowB);

  if (valA === null || valB === null) {
    return null;
  }

  const diff = Number(Math.abs(valA - valB).toFixed(2));
  const base = Math.min(Math.abs(valA), Math.abs(valB));
  const pctDiff = base > 0 ? Number(((diff / base) * 100).toFixed(2)) : null;
  const winner = valA > valB ? rowA.name : valB > valA ? rowB.name : 'Tie';

  const formatMetric = (v: number) => {
    if (metric === 'quantity') return `${v.toLocaleString()} units`;
    if (metric === 'profit_margin') return `${v.toFixed(2)}%`;
    return `${currencySymbol}${v.toLocaleString()}`;
  };

  const summary = `${rowA.name} ${metric.replace('_', ' ')}: ${formatMetric(valA)} vs ${rowB.name} ${metric.replace('_', ' ')}: ${formatMetric(valB)}. Difference: ${formatMetric(diff)}${pctDiff !== null ? ` (${pctDiff}%)` : ''}. Winner: ${winner}.`;

  return {
    dimension,
    metric,
    itemA: { name: rowA.name, value: valA },
    itemB: { name: rowB.name, value: valB },
    difference: diff,
    percentageDifference: pctDiff,
    winner,
    summary,
  };
}
