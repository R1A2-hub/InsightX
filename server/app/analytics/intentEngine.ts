import { compareDimensionItems } from './engine';
import {
  CapabilityStatus,
  ComparisonAnalysisResult,
  DatasetAnalysisBundle,
  DimensionAnalysisRow,
  DimensionType,
  EvidenceObject,
  MetricType,
  ParsedQuestionIntent,
  QuestionIntent,
} from '../schemas/analytics';

const HINGLISH_MARKERS = [
  'kitna',
  'kitni',
  'sabse',
  'zyada',
  'jyada',
  'laaya',
  'laya',
  'bhai',
  'konsa',
  'kaunsa',
  'kaun',
  'krha',
  'kar',
  'rha',
  'raha',
  'skti',
  'sakti',
  'hua',
  'hui',
  'me se',
  'ya ',
  'kaisa',
  'kya',
  'batao',
  'kam',
];

export function detectQuestionIntent(
  question: string,
  knownProducts: string[] = [],
  knownCategories: string[] = [],
  knownRegions: string[] = []
): ParsedQuestionIntent {
  const q = question.trim();
  const lower = q.toLowerCase();

  const isHinglish = HINGLISH_MARKERS.some((m) => lower.includes(m));

  let metric: MetricType = 'revenue';
  if (lower.includes('margin')) {
    metric = 'profit_margin';
  } else if (lower.includes('profit') || lower.includes('munafa') || lower.includes('fayda')) {
    metric = 'profit';
  } else if (lower.includes('cost') || lower.includes('expense') || lower.includes('kharcha')) {
    metric = 'cost';
  } else if (
    lower.includes('quantity') ||
    lower.includes('qty') ||
    lower.includes('units') ||
    lower.includes('volume')
  ) {
    metric = 'quantity';
  } else if (
    lower.includes('revenue') ||
    lower.includes('sales') ||
    lower.includes('earning') ||
    lower.includes('turnover')
  ) {
    metric = 'revenue';
  }

  let dimension: DimensionType | null = null;
  if (lower.includes('product') || lower.includes('item') || lower.includes('sku')) {
    dimension = 'product';
  } else if (lower.includes('category') || lower.includes('categories') || lower.includes('department')) {
    dimension = 'category';
  } else if (
    lower.includes('region') ||
    lower.includes('area') ||
    lower.includes('zone') ||
    lower.includes('territory')
  ) {
    dimension = 'region';
  }

  const matchEntities = (entities: string[]): string[] => {
    const matched: string[] = [];
    for (const ent of entities) {
      if (!ent || ent === 'Unknown') continue;
      const entLower = ent.toLowerCase();
      if (lower.includes(entLower)) {
        matched.push(ent);
        continue;
      }
      const tokens = entLower.split(/\s+/).filter((t) => t.length >= 4);
      for (const tok of tokens) {
        if (new RegExp(`\\b${tok}\\b`, 'i').test(lower) && !matched.includes(ent)) {
          matched.push(ent);
        }
      }
    }
    return matched;
  };

  const matchedRegions = matchEntities(knownRegions);
  const matchedProducts = matchEntities(knownProducts);
  const matchedCategories = matchEntities(knownCategories);

  let comparisonValues: string[] = [];
  if (matchedRegions.length >= 2) {
    dimension = 'region';
    comparisonValues = matchedRegions.slice(0, 2);
  } else if (matchedProducts.length >= 2) {
    dimension = 'product';
    comparisonValues = matchedProducts.slice(0, 2);
  } else if (matchedCategories.length >= 2) {
    dimension = 'category';
    comparisonValues = matchedCategories.slice(0, 2);
  } else {
    const vsMatch = q.match(/([a-zA-Z0-9\s]+?)\s+(?:vs\.?|versus|or|ya)\s+([a-zA-Z0-9\s]+)/i);
    const compareMatch = q.match(/compare\s+([a-zA-Z0-9\s]+?)\s+(?:and|with|vs\.?)\s+([a-zA-Z0-9\s]+)/i);
    const rawPair = compareMatch || vsMatch;
    if (rawPair) {
      const cleanToken = (s: string) =>
        s
          .replace(
            /\b(compare|which|what|who|is|was|revenue|profit|sales|cost|quantity|me|se|konsa|kaunsa|better|perform|krha|kar|raha|h|hai|in|between)\b/gi,
            ''
          )
          .trim();
      const a = cleanToken(rawPair[1]);
      const b = cleanToken(rawPair[2]);
      if (a && b) {
        comparisonValues = [a, b];
        if (!dimension) {
          if (['north', 'south', 'east', 'west'].includes(a.toLowerCase())) {
            dimension = 'region';
          } else {
            dimension = 'product';
          }
        }
      }
    }
  }

  let intent: QuestionIntent = 'unknown';
  const bottomRank =
    lower.includes('least') ||
    lower.includes('lowest') ||
    lower.includes('worst') ||
    lower.includes('weakest') ||
    lower.includes('sabse kam');

  if (
    lower.includes('next month') ||
    lower.includes('forecast') ||
    lower.includes('predict') ||
    lower.includes('expect') ||
    lower.includes('future') ||
    lower.includes('projection') ||
    (lower.includes('agla') && lower.includes('mahina')) ||
    lower.includes('ho skti') ||
    lower.includes('ho sakti')
  ) {
    intent = 'forecast';
  } else if (
    comparisonValues.length >= 2 ||
    lower.includes(' vs ') ||
    lower.includes('versus') ||
    lower.includes('compare') ||
    lower.includes('me se konsa') ||
    lower.includes('me se kaunsa')
  ) {
    intent = 'comparison';
  } else if (
    lower.includes('anomal') ||
    lower.includes('unusual') ||
    lower.includes('outlier') ||
    lower.includes('spike')
  ) {
    intent = 'anomaly';
  } else if (
    lower.includes('trend') ||
    lower.includes('increase') ||
    lower.includes('decrease') ||
    lower.includes('drop') ||
    lower.includes('grow') ||
    lower.includes('why did') ||
    lower.includes('over time') ||
    lower.includes('monthly')
  ) {
    intent = 'trend';
  } else if (
    dimension !== null &&
    (lower.includes('which') ||
      lower.includes('best') ||
      lower.includes('most') ||
      lower.includes('top') ||
      lower.includes('highest') ||
      lower.includes('higher') ||
      lower.includes('sabse') ||
      lower.includes('konsa') ||
      lower.includes('kaunsa') ||
      bottomRank)
  ) {
    intent = 'top_dimension';
  } else if (
    lower.includes('total') ||
    lower.includes('what was') ||
    lower.includes('what is') ||
    lower.includes('how much') ||
    lower.includes('kitna') ||
    lower.includes('kitni') ||
    lower.includes('profit') ||
    lower.includes('revenue') ||
    lower.includes('sales') ||
    lower.includes('cost') ||
    lower.includes('quantity')
  ) {
    if (dimension !== null) {
      intent = 'top_dimension';
    } else {
      intent = 'metric_value';
    }
  }

  return {
    rawQuestion: question,
    intent,
    metric,
    dimension,
    comparisonValues,
    isHinglish,
    bottomRank,
  };
}

export function resolveQuestionDeterministically(
  question: string,
  bundle: DatasetAnalysisBundle
): {
  parsedIntent: ParsedQuestionIntent;
  deterministicAnswer: string;
  evidence: EvidenceObject[];
  comparison: ComparisonAnalysisResult | null;
  capabilityStatus: CapabilityStatus;
  suggestedFollowUps: string[];
} {
  const knownProducts = bundle.productAnalysis.map((p) => p.name);
  const knownCategories = bundle.categoryAnalysis.map((c) => c.name);
  const knownRegions = bundle.regionalAnalysis.map((r) => r.name);

  const parsed = detectQuestionIntent(question, knownProducts, knownCategories, knownRegions);
  const cur = bundle.kpis.currencySymbol || '₹';
  const hasCost = bundle.quality.capabilities.cost.status !== 'Unavailable';

  if (
    (parsed.metric === 'profit' || parsed.metric === 'profit_margin' || parsed.metric === 'cost') &&
    !hasCost
  ) {
    const unavailEv: EvidenceObject = {
      id: 'ev-unavailable-profit',
      evidence_type: 'unavailable_metric',
      title: `${parsed.metric.toUpperCase()} Unavailable`,
      finding:
        'Profit and Cost cannot be calculated because the dataset does not contain Cost information.',
      value: null,
      unit: 'text',
      source_columns: bundle.quality.detectedColumns,
      formula: 'Requires Cost / Total_Cost / Expense column (Profit = Revenue - Cost)',
      confidence: 'High',
    };

    const msg =
      parsed.metric === 'cost'
        ? 'Cost cannot be reported because the dataset does not contain a Cost or Expense column. Include a Cost column in your CSV/XLSX upload to unlock Cost, Profit, and Profit Margin analysis.'
        : 'Profit cannot be calculated because the dataset does not contain Cost information. To enable Profit (Revenue − Cost) and Profit Margin calculations, upload a dataset containing a Cost, Total_Cost, or Expense column.';

    return {
      parsedIntent: parsed,
      deterministicAnswer: msg,
      evidence: [unavailEv],
      comparison: null,
      capabilityStatus: 'Unavailable',
      suggestedFollowUps: [
        'Which product generated the most revenue?',
        'Which region performed best?',
        'How much revenue can we expect next month?',
      ],
    };
  }

  const getDimRows = (dim: DimensionType | null): DimensionAnalysisRow[] => {
    if (dim === 'product') return bundle.productAnalysis;
    if (dim === 'category') return bundle.categoryAnalysis;
    if (dim === 'region') return bundle.regionalAnalysis;
    return bundle.productAnalysis;
  };

  // 1. COMPARISON INTENT
  if (parsed.intent === 'comparison') {
    const dim: DimensionType = parsed.dimension || 'region';
    const rows = getDimRows(dim);

    let itemA = parsed.comparisonValues[0];
    let itemB = parsed.comparisonValues[1];
    if ((!itemA || !itemB) && rows.length >= 2) {
      itemA = rows[0].name;
      itemB = rows[1].name;
    }

    if (itemA && itemB) {
      const comp = compareDimensionItems(rows, dim, parsed.metric, itemA, itemB, cur);
      if (comp) {
        const evType =
          dim === 'region'
            ? 'regional_comparison'
            : dim === 'product'
            ? 'product_comparison'
            : 'category_comparison';
        const compEv: EvidenceObject = {
          id: `ev-comp-${itemA}-${itemB}`,
          evidence_type: evType,
          title: `${comp.itemA.name} vs ${comp.itemB.name} (${parsed.metric})`,
          finding: comp.summary,
          value: comp.difference,
          secondary_values: {
            [comp.itemA.name]: comp.itemA.value,
            [comp.itemB.name]: comp.itemB.value,
            difference: comp.difference,
            percentage_difference: comp.percentageDifference,
            winner: comp.winner,
          },
          unit:
            parsed.metric === 'quantity'
              ? 'units'
              : parsed.metric === 'profit_margin'
              ? 'percentage'
              : 'currency',
          source_columns: [dim.charAt(0).toUpperCase() + dim.slice(1), 'Revenue'],
          formula: `sum(${parsed.metric}) grouped by ${dim} for ${comp.itemA.name} vs ${comp.itemB.name}`,
          confidence: 'High',
        };

        return {
          parsedIntent: parsed,
          deterministicAnswer: comp.summary,
          evidence: [compEv],
          comparison: comp,
          capabilityStatus:
            parsed.metric === 'profit'
              ? bundle.quality.capabilities.profit.status
              : bundle.quality.capabilities.revenue.status,
          suggestedFollowUps: [
            `Which ${dim} generated the most revenue?`,
            'What was our total profit?',
            'How much revenue can we expect next month?',
          ],
        };
      }
    }
  }

  // 2. TOP DIMENSION INTENT
  if (parsed.intent === 'top_dimension') {
    const dim: DimensionType = parsed.dimension || 'product';
    const rawRows = getDimRows(dim).filter((r) => r.name !== 'Unknown');
    if (rawRows.length === 0) {
      return {
        parsedIntent: parsed,
        deterministicAnswer: `No valid ${dim} records are available in the current dataset.`,
        evidence: [],
        comparison: null,
        capabilityStatus: 'Unavailable',
        suggestedFollowUps: ['What was our total revenue?', 'Show monthly revenue trend'],
      };
    }

    const sorted = [...rawRows].sort((a, b) => {
      const va =
        parsed.metric === 'profit'
          ? a.profit ?? 0
          : parsed.metric === 'quantity'
          ? a.quantity
          : parsed.metric === 'cost'
          ? a.cost ?? 0
          : a.revenue;
      const vb =
        parsed.metric === 'profit'
          ? b.profit ?? 0
          : parsed.metric === 'quantity'
          ? b.quantity
          : parsed.metric === 'cost'
          ? b.cost ?? 0
          : b.revenue;
      return parsed.bottomRank ? va - vb : vb - va;
    });

    const target = sorted[0];
    const runnerUp = sorted[1];
    const val =
      parsed.metric === 'profit'
        ? target.profit ?? 0
        : parsed.metric === 'quantity'
        ? target.quantity
        : parsed.metric === 'cost'
        ? target.cost ?? 0
        : target.revenue;

    const valFormatted =
      parsed.metric === 'quantity' ? `${val.toLocaleString()} units` : `${cur}${val.toLocaleString()}`;

    const rankWord = parsed.bottomRank ? 'lowest-performing' : 'highest-performing';
    const answer = `${target.name} is the ${rankWord} ${dim} by ${parsed.metric.replace('_', ' ')} at ${valFormatted} (${target.contributionPct}% of total revenue, ${target.quantity.toLocaleString()} units sold)${runnerUp ? `, followed by ${runnerUp.name} (${cur}${runnerUp.revenue.toLocaleString()})` : ''}.`;

    const ev: EvidenceObject = {
      id: `ev-top-${dim}-${parsed.metric}`,
      evidence_type:
        dim === 'product'
          ? 'product_ranking'
          : dim === 'category'
          ? 'category_ranking'
          : 'regional_ranking',
      title: `${parsed.bottomRank ? 'Lowest' : 'Top'} ${dim.charAt(0).toUpperCase() + dim.slice(1)} by ${parsed.metric}: ${target.name}`,
      finding: answer,
      value: val,
      secondary_values: {
        name: target.name,
        revenue: target.revenue,
        profit: target.profit,
        quantity: target.quantity,
        contribution_pct: target.contributionPct,
        runner_up: runnerUp ? runnerUp.name : null,
      },
      unit: parsed.metric === 'quantity' ? 'units' : 'currency',
      source_columns: [dim.charAt(0).toUpperCase() + dim.slice(1), 'Revenue', 'Quantity'],
      formula: `sum(${parsed.metric}) grouped by ${dim} ORDER BY sum(${parsed.metric}) ${parsed.bottomRank ? 'ASC' : 'DESC'}`,
      confidence: 'High',
    };

    return {
      parsedIntent: parsed,
      deterministicAnswer: answer,
      evidence: [ev],
      comparison: null,
      capabilityStatus:
        parsed.metric === 'profit'
          ? bundle.quality.capabilities.profit.status
          : bundle.quality.capabilities.revenue.status,
      suggestedFollowUps: [
        runnerUp ? `Compare ${target.name} and ${runnerUp.name}` : 'What was our total profit?',
        'Which region performed best?',
        'How much revenue can we expect next month?',
      ],
    };
  }

  // 3. FORECAST INTENT
  if (parsed.intent === 'forecast') {
    const fc = bundle.forecast;
    if (!fc.available || fc.prediction === null) {
      return {
        parsedIntent: parsed,
        deterministicAnswer:
          fc.unavailableReason ||
          'Forecasting is unavailable because fewer than 3 monthly observations exist in the dataset.',
        evidence: [],
        comparison: null,
        capabilityStatus: 'Unavailable',
        suggestedFollowUps: ['What was our total revenue?', 'Which product generated the most revenue?'],
      };
    }

    const answer = `For next month (${fc.nextMonthLabel}), the predictive revenue forecast is ${cur}${fc.prediction.toLocaleString()} (expected range: ${cur}${(fc.lowerBound ?? 0).toLocaleString()} to ${cur}${(fc.upperBound ?? 0).toLocaleString()}, MAE: ${cur}${(fc.mae ?? 0).toLocaleString()}, RMSE: ${cur}${(fc.rmse ?? 0).toLocaleString()}). ${fc.disclaimer}`;

    const fcEv =
      bundle.evidenceList.find((e) => e.evidence_type === 'revenue_forecast') || {
        id: 'ev-forecast-chat',
        evidence_type: 'revenue_forecast',
        title: `Revenue Forecast for ${fc.nextMonthLabel}`,
        finding: answer,
        value: fc.prediction,
        unit: 'currency',
        source_columns: ['Date', 'Revenue'],
        formula: 'Monthly trend projection: f(month_index) -> monthly_revenue',
        confidence: 'High',
      };

    return {
      parsedIntent: parsed,
      deterministicAnswer: answer,
      evidence: [fcEv],
      comparison: null,
      capabilityStatus: 'Derived',
      suggestedFollowUps: [
        'Why did revenue increase or decrease?',
        'Which product generated the most revenue?',
        'North vs South revenue?',
      ],
    };
  }

  // 4. TREND INTENT
  if (parsed.intent === 'trend') {
    const tr = bundle.trendAnalysis;
    const anomNote =
      bundle.anomalies.length > 0
        ? ` Notable anomaly detected in ${bundle.anomalies[0].date}: ${bundle.anomalies[0].reason}`
        : '';
    const answer = `${tr.plainLanguageSummary}${anomNote}`;
    const trEv =
      bundle.evidenceList.find((e) => e.evidence_type === 'trend_analysis') ||
      bundle.evidenceList[0];

    return {
      parsedIntent: parsed,
      deterministicAnswer: answer,
      evidence: trEv ? [trEv] : [],
      comparison: null,
      capabilityStatus: 'Derived',
      suggestedFollowUps: [
        'How much revenue can we expect next month?',
        'Which region performed best?',
        'What was our total profit?',
      ],
    };
  }

  // 5. ANOMALY INTENT
  if (parsed.intent === 'anomaly') {
    if (bundle.anomalies.length === 0) {
      return {
        parsedIntent: parsed,
        deterministicAnswer:
          'No statistical revenue anomalies were detected using the 1.5×IQR outlier threshold across the dataset.',
        evidence: [],
        comparison: null,
        capabilityStatus: 'Derived',
        suggestedFollowUps: ['Show monthly revenue trend', 'How much revenue can we expect next month?'],
      };
    }
    const topAnom = bundle.anomalies[0];
    const answer = `Detected ${bundle.anomalies.length} statistical anomaly(ies). Primary anomaly on ${topAnom.date}: ${topAnom.reason}${topAnom.topContributor ? ` Driven primarily by ${topAnom.topContributor}.` : ''}`;
    const anomEv = bundle.evidenceList.find((e) => e.evidence_type === 'anomaly_detection');
    return {
      parsedIntent: parsed,
      deterministicAnswer: answer,
      evidence: anomEv ? [anomEv] : [],
      comparison: null,
      capabilityStatus: 'Derived',
      suggestedFollowUps: [
        'Which product generated the most revenue?',
        'How much revenue can we expect next month?',
      ],
    };
  }

  // 6. METRIC VALUE INTENT
  const kpis = bundle.kpis;
  if (parsed.metric === 'profit') {
    const ans = `Total profit across the dataset is ${cur}${(kpis.totalProfit ?? 0).toLocaleString()} on total revenue of ${cur}${(kpis.totalRevenue ?? 0).toLocaleString()} and total cost of ${cur}${(kpis.totalCost ?? 0).toLocaleString()}, yielding a profit margin of ${kpis.profitMargin}%.`;
    const ev: EvidenceObject = {
      id: 'ev-metric-profit',
      evidence_type: 'kpi_summary',
      title: 'Total Profit & Profit Margin',
      finding: ans,
      value: kpis.totalProfit,
      secondary_values: {
        total_revenue: kpis.totalRevenue,
        total_cost: kpis.totalCost,
        profit_margin_pct: kpis.profitMargin,
      },
      unit: 'currency',
      source_columns: ['Revenue', 'Cost'],
      formula: 'sum(Revenue - Cost)',
      confidence: 'High',
    };
    return {
      parsedIntent: parsed,
      deterministicAnswer: ans,
      evidence: [ev],
      comparison: null,
      capabilityStatus: bundle.quality.capabilities.profit.status,
      suggestedFollowUps: [
        'Which category had higher profit?',
        'Which product generated the most revenue?',
        'North vs South revenue?',
      ],
    };
  }

  if (parsed.metric === 'quantity') {
    const ans = `Total quantity sold is ${(kpis.totalQuantity ?? 0).toLocaleString()} units across ${bundle.quality.cleanedRowCount.toLocaleString()} cleaned records.`;
    const ev: EvidenceObject = {
      id: 'ev-metric-qty',
      evidence_type: 'kpi_summary',
      title: 'Total Quantity Sold',
      finding: ans,
      value: kpis.totalQuantity,
      unit: 'units',
      source_columns: ['Quantity'],
      formula: 'sum(Quantity)',
      confidence: 'High',
    };
    return {
      parsedIntent: parsed,
      deterministicAnswer: ans,
      evidence: [ev],
      comparison: null,
      capabilityStatus: bundle.quality.capabilities.quantity.status,
      suggestedFollowUps: [
        'Which product generated the most revenue?',
        'What was our total profit?',
      ],
    };
  }

  if (parsed.metric === 'cost') {
    const ans = `Total cost across the dataset is ${cur}${(kpis.totalCost ?? 0).toLocaleString()} (representing ${(100 - (kpis.profitMargin ?? 0)).toFixed(2)}% of total revenue).`;
    const ev: EvidenceObject = {
      id: 'ev-metric-cost',
      evidence_type: 'kpi_summary',
      title: 'Total Cost',
      finding: ans,
      value: kpis.totalCost,
      unit: 'currency',
      source_columns: ['Cost'],
      formula: 'sum(Cost)',
      confidence: 'High',
    };
    return {
      parsedIntent: parsed,
      deterministicAnswer: ans,
      evidence: [ev],
      comparison: null,
      capabilityStatus: bundle.quality.capabilities.cost.status,
      suggestedFollowUps: ['What was our total profit?', 'Which region performed best?'],
    };
  }

  const topProd = bundle.productAnalysis[0];
  const topReg = bundle.regionalAnalysis[0];
  const ans = `Total revenue is ${cur}${(kpis.totalRevenue ?? 0).toLocaleString()}${kpis.totalProfit !== null ? ` with ${cur}${kpis.totalProfit.toLocaleString()} in total profit (${kpis.profitMargin}% margin)` : ''}${kpis.revenueGrowth !== null ? ` and ${kpis.revenueGrowth >= 0 ? '+' : ''}${kpis.revenueGrowth}% latest month-over-month revenue growth` : ''}.${topProd ? ` Top product: ${topProd.name} (${cur}${topProd.revenue.toLocaleString()}).` : ''}${topReg ? ` Top region: ${topReg.name} (${cur}${topReg.revenue.toLocaleString()}).` : ''}`;

  return {
    parsedIntent: parsed,
    deterministicAnswer: ans,
    evidence: bundle.evidenceList.slice(0, 3),
    comparison: null,
    capabilityStatus: bundle.quality.capabilities.revenue.status,
    suggestedFollowUps: [
      'Which product generated the most revenue?',
      'North vs South revenue?',
      'How much revenue can we expect next month?',
    ],
  };
}
