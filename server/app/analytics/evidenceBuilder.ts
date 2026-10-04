import {
  AIInsightItem,
  AnomalyRecord,
  DataQualityReport,
  DimensionAnalysisRow,
  EvidenceObject,
  ForecastResult,
  KPISummary,
  TrendAnalysisResult,
} from '../schemas/analytics';

export function buildDatasetEvidence(params: {
  quality: DataQualityReport;
  kpis: KPISummary;
  trend: TrendAnalysisResult;
  products: DimensionAnalysisRow[];
  categories: DimensionAnalysisRow[];
  regions: DimensionAnalysisRow[];
  anomalies: AnomalyRecord[];
  forecast: ForecastResult;
}): { evidenceList: EvidenceObject[]; baseInsights: AIInsightItem[] } {
  const { kpis, trend, products, categories, regions, anomalies, forecast } = params;
  const cur = kpis.currencySymbol || '₹';
  const evidenceList: EvidenceObject[] = [];
  const baseInsights: AIInsightItem[] = [];

  // 1. KPI Summary Evidence
  const kpiEv: EvidenceObject = {
    id: 'ev-kpi-revenue',
    evidence_type: 'kpi_summary',
    title: 'Total Revenue & Profit Performance',
    finding:
      kpis.totalProfit !== null
        ? `Total revenue reached ${cur}${(kpis.totalRevenue ?? 0).toLocaleString()} with total profit of ${cur}${kpis.totalProfit.toLocaleString()} (${kpis.profitMargin}% margin).`
        : `Total revenue reached ${cur}${(kpis.totalRevenue ?? 0).toLocaleString()}. ${kpis.profitUnavailableReason}`,
    value: kpis.totalRevenue,
    secondary_values: {
      total_profit: kpis.totalProfit,
      profit_margin_pct: kpis.profitMargin,
      total_quantity: kpis.totalQuantity,
      mom_revenue_growth_pct: kpis.revenueGrowth,
    },
    unit: 'currency',
    source_columns:
      kpis.totalProfit !== null ? ['Revenue', 'Cost', 'Quantity'] : ['Revenue', 'Quantity'],
    formula: 'sum(Revenue), sum(Revenue - Cost), (sum(Profit)/sum(Revenue))*100',
    confidence: 'High',
  };
  evidenceList.push(kpiEv);

  // 2. Revenue Trend Evidence & Insight
  const trendEv: EvidenceObject = {
    id: 'ev-revenue-trend',
    evidence_type: 'trend_analysis',
    title: `Monthly Revenue Trend (${trend.direction})`,
    finding: trend.plainLanguageSummary,
    value: trend.overallChangePct ?? trend.slopePerMonth,
    secondary_values: {
      direction: trend.direction,
      slope_per_month: trend.slopePerMonth,
      peak_month: trend.peakMonth ? `${trend.peakMonth.label} (${cur}${trend.peakMonth.revenue.toLocaleString()})` : null,
      lowest_month: trend.lowestMonth ? `${trend.lowestMonth.label} (${cur}${trend.lowestMonth.revenue.toLocaleString()})` : null,
    },
    unit: 'percentage',
    source_columns: ['Date', 'Revenue'],
    formula: 'OLS slope(monthly sum(Revenue)) & ((LastMonth - FirstMonth) / FirstMonth) * 100',
    confidence: trend.monthlyValues.length >= 3 ? 'High' : 'Medium',
  };
  evidenceList.push(trendEv);

  baseInsights.push({
    id: 'insight-trend',
    category: 'trend',
    title:
      trend.direction === 'Increasing'
        ? `Revenue Increased ${trend.overallChangePct !== null ? `by ${trend.overallChangePct}%` : 'Steadily'}`
        : trend.direction === 'Decreasing'
        ? `Revenue Decreased ${trend.overallChangePct !== null ? `by ${Math.abs(trend.overallChangePct)}%` : 'Across Period'}`
        : `Revenue Trend: ${trend.direction}`,
    explanation: trend.plainLanguageSummary,
    evidence: trendEv,
    confidence: trendEv.confidence,
    sourceMetric: 'Monthly Revenue (OLS Trend & Period Change)',
    aiGenerated: false,
  });

  // 3. Highest-Performing Product
  if (products.length > 0 && products[0].name !== 'Unknown') {
    const topProd = products[0];
    const prodEv: EvidenceObject = {
      id: 'ev-top-product',
      evidence_type: 'product_ranking',
      title: `Highest-Performing Product: ${topProd.name}`,
      finding: `${topProd.name} ranked #1 by revenue at ${cur}${topProd.revenue.toLocaleString()}, contributing ${topProd.contributionPct}% of total sales across ${topProd.quantity.toLocaleString()} units.`,
      value: topProd.revenue,
      secondary_values: {
        product: topProd.name,
        contribution_pct: topProd.contributionPct,
        quantity: topProd.quantity,
        profit: topProd.profit,
      },
      unit: 'currency',
      source_columns: ['Product', 'Revenue', 'Quantity'],
      formula: 'sum(Revenue) grouped by Product ORDER BY sum(Revenue) DESC LIMIT 1',
      confidence: 'High',
    };
    evidenceList.push(prodEv);

    baseInsights.push({
      id: 'insight-top-product',
      category: 'product',
      title: `Top Revenue Driver: ${topProd.name} (${topProd.contributionPct}% Share)`,
      explanation: `${topProd.name} generated ${cur}${topProd.revenue.toLocaleString()} across ${topProd.quantity.toLocaleString()} units${topProd.profit !== null ? ` and delivered ${cur}${topProd.profit.toLocaleString()} in profit (${topProd.profitMargin}% margin)` : ''}.`,
      evidence: prodEv,
      confidence: 'High',
      sourceMetric: 'Product Revenue & Contribution %',
      aiGenerated: false,
    });
  }

  // 4. Highest-Performing Category
  if (categories.length > 0 && categories[0].name !== 'Unknown') {
    const topCat = categories[0];
    const catEv: EvidenceObject = {
      id: 'ev-top-category',
      evidence_type: 'category_ranking',
      title: `Highest-Performing Category: ${topCat.name}`,
      finding: `${topCat.name} led all categories with ${cur}${topCat.revenue.toLocaleString()} in revenue (${topCat.contributionPct}% of total revenue).`,
      value: topCat.revenue,
      secondary_values: {
        category: topCat.name,
        contribution_pct: topCat.contributionPct,
        quantity: topCat.quantity,
        profit: topCat.profit,
      },
      unit: 'currency',
      source_columns: ['Category', 'Revenue'],
      formula: 'sum(Revenue) grouped by Category ORDER BY sum(Revenue) DESC LIMIT 1',
      confidence: 'High',
    };
    evidenceList.push(catEv);

    baseInsights.push({
      id: 'insight-top-category',
      category: 'category',
      title: `Leading Category: ${topCat.name}`,
      explanation: `${topCat.name} accounted for ${topCat.contributionPct}% of total company revenue (${cur}${topCat.revenue.toLocaleString()})${topCat.profit !== null ? ` with ${cur}${topCat.profit.toLocaleString()} in net profit` : ''}.`,
      evidence: catEv,
      confidence: 'High',
      sourceMetric: 'Category Revenue & Share',
      aiGenerated: false,
    });
  }

  // 5. Best Region & Weakest Region
  const validRegions = regions.filter((r) => r.name !== 'Unknown');
  if (validRegions.length > 0) {
    const bestReg = validRegions[0];
    const bestRegEv: EvidenceObject = {
      id: 'ev-best-region',
      evidence_type: 'regional_ranking',
      title: `Top Performing Region: ${bestReg.name}`,
      finding: `${bestReg.name} generated the highest regional revenue at ${cur}${bestReg.revenue.toLocaleString()} (${bestReg.contributionPct}% of total revenue).`,
      value: bestReg.revenue,
      secondary_values: {
        region: bestReg.name,
        contribution_pct: bestReg.contributionPct,
        profit: bestReg.profit,
      },
      unit: 'currency',
      source_columns: ['Region', 'Revenue'],
      formula: 'sum(Revenue) grouped by Region ORDER BY sum(Revenue) DESC LIMIT 1',
      confidence: 'High',
    };
    evidenceList.push(bestRegEv);

    baseInsights.push({
      id: 'insight-best-region',
      category: 'region',
      title: `Best Performing Region: ${bestReg.name}`,
      explanation: `${bestReg.name} is the strongest market, generating ${cur}${bestReg.revenue.toLocaleString()} (${bestReg.contributionPct}% contribution)${bestReg.profit !== null ? ` and ${cur}${bestReg.profit.toLocaleString()} in regional profit` : ''}.`,
      evidence: bestRegEv,
      confidence: 'High',
      sourceMetric: 'Regional Revenue Ranking',
      aiGenerated: false,
    });

    if (validRegions.length >= 2) {
      const weakestReg = validRegions[validRegions.length - 1];
      const weakRegEv: EvidenceObject = {
        id: 'ev-weakest-region',
        evidence_type: 'regional_ranking',
        title: `Lowest Performing Region: ${weakestReg.name}`,
        finding: `${weakestReg.name} generated the lowest regional revenue at ${cur}${weakestReg.revenue.toLocaleString()} (${weakestReg.contributionPct}% of total revenue).`,
        value: weakestReg.revenue,
        secondary_values: {
          region: weakestReg.name,
          contribution_pct: weakestReg.contributionPct,
          gap_to_best: Number((bestReg.revenue - weakestReg.revenue).toFixed(2)),
        },
        unit: 'currency',
        source_columns: ['Region', 'Revenue'],
        formula: 'sum(Revenue) grouped by Region ORDER BY sum(Revenue) ASC LIMIT 1',
        confidence: 'High',
      };
      evidenceList.push(weakRegEv);

      baseInsights.push({
        id: 'insight-weakest-region',
        category: 'region',
        title: `Underperforming Region: ${weakestReg.name}`,
        explanation: `${weakestReg.name} contributed only ${weakestReg.contributionPct}% of revenue (${cur}${weakestReg.revenue.toLocaleString()}), trailing ${bestReg.name} by ${cur}${(bestReg.revenue - weakestReg.revenue).toLocaleString()}.`,
        evidence: weakRegEv,
        confidence: 'High',
        sourceMetric: 'Regional Revenue Share',
        aiGenerated: false,
      });
    }
  }

  // 6. Important Anomalies
  if (anomalies.length > 0) {
    const topAnomaly = anomalies[0];
    const anomEv: EvidenceObject = {
      id: 'ev-anomaly',
      evidence_type: 'anomaly_detection',
      title: `Statistical Revenue Anomaly on ${topAnomaly.date}`,
      finding: topAnomaly.reason,
      value: topAnomaly.revenue,
      secondary_values: {
        date: topAnomaly.date,
        expected_lower: topAnomaly.expectedRange.lower,
        expected_upper: topAnomaly.expectedRange.upper,
        deviation_pct: topAnomaly.deviationPct,
        top_contributor: topAnomaly.topContributor ?? null,
      },
      unit: 'currency',
      source_columns: ['Date', 'Revenue'],
      formula: 'IQR Outlier Rule: value > Q3 + 1.5 * IQR or value < Q1 - 1.5 * IQR',
      confidence: 'High',
    };
    evidenceList.push(anomEv);

    baseInsights.push({
      id: 'insight-anomaly',
      category: 'anomaly',
      title: `Revenue ${topAnomaly.direction === 'spike' ? 'Spike' : 'Drop'} Detected in ${topAnomaly.date}`,
      explanation: `${topAnomaly.reason}${topAnomaly.topContributor ? ` Primary driver: ${topAnomaly.topContributor}.` : ''}`,
      evidence: anomEv,
      confidence: 'High',
      sourceMetric: 'IQR Anomaly Detection',
      aiGenerated: false,
    });
  }

  // 7. Forecast Summary
  if (forecast.available && forecast.prediction !== null) {
    const fcEv: EvidenceObject = {
      id: 'ev-forecast',
      evidence_type: 'revenue_forecast',
      title: `Next Month Revenue Forecast (${forecast.nextMonthLabel})`,
      finding: `Projected revenue for ${forecast.nextMonthLabel} is ${cur}${forecast.prediction.toLocaleString()} (expected range: ${cur}${(forecast.lowerBound ?? 0).toLocaleString()} to ${cur}${(forecast.upperBound ?? 0).toLocaleString()}, MAE: ${cur}${(forecast.mae ?? 0).toLocaleString()}). ${forecast.disclaimer}`,
      value: forecast.prediction,
      secondary_values: {
        next_month: forecast.nextMonthLabel,
        lower_bound: forecast.lowerBound,
        upper_bound: forecast.upperBound,
        mae: forecast.mae,
        rmse: forecast.rmse,
        disclaimer: forecast.disclaimer,
      },
      unit: 'currency',
      source_columns: ['Date', 'Revenue'],
      formula: 'Monthly trend projection: f(month_index) -> monthly_revenue',
      confidence: forecast.observationsCount >= 6 ? 'High' : 'Medium',
    };
    evidenceList.push(fcEv);

    baseInsights.push({
      id: 'insight-forecast',
      category: 'forecast',
      title: `Next Month Forecast (${forecast.nextMonthLabel}): ${cur}${forecast.prediction.toLocaleString()}`,
      explanation: `Based on ${forecast.observationsCount} monthly observations, statistical trend projection estimates ${cur}${forecast.prediction.toLocaleString()} for ${forecast.nextMonthLabel} (range: ${cur}${(forecast.lowerBound ?? 0).toLocaleString()} – ${cur}${(forecast.upperBound ?? 0).toLocaleString()}, RMSE: ${cur}${(forecast.rmse ?? 0).toLocaleString()}). ${forecast.disclaimer}`,
      evidence: fcEv,
      confidence: fcEv.confidence,
      sourceMetric: 'Revenue Trend Forecast',
      aiGenerated: false,
    });
  }

  return { evidenceList, baseInsights };
}
