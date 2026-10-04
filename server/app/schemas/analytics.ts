export type CapabilityStatus = 'Directly Available' | 'Derived' | 'Unavailable';

export type CanonicalColumn =
  | 'Quantity'
  | 'Selling_Price'
  | 'Revenue'
  | 'Cost'
  | 'Product'
  | 'Category'
  | 'Region'
  | 'Date';

export interface ColumnMapping {
  originalName: string;
  canonicalName: string | null;
  dataType: 'numeric' | 'date' | 'categorical' | 'boolean' | 'unknown';
  missingCount: number;
  invalidCount: number;
  sampleValues: string[];
  usedForAnalytics: boolean;
}

export interface CleaningAction {
  step: string;
  column?: string;
  description: string;
  affectedRows: number;
}

export interface DataQualityReport {
  filename: string;
  uploadedAt: string;
  fileSizeBytes: number;
  rawRowCount: number;
  cleanedRowCount: number;
  columnCount: number;
  detectedColumns: string[];
  canonicalColumnsPresent: string[];
  columnsUsedForAnalytics: string[];
  columnMappings: ColumnMapping[];
  missingValuesByColumn: Record<string, number>;
  totalMissingValues: number;
  duplicateRowsRemoved: number;
  invalidDatesCount: number;
  invalidNumericCount: number;
  unknownCategoriesCount: number;
  dateRange: {
    minDate: string | null;
    maxDate: string | null;
    totalMonths: number;
  };
  cleaningActions: CleaningAction[];
  capabilities: {
    revenue: { status: CapabilityStatus; note: string };
    profit: { status: CapabilityStatus; note: string };
    profitMargin: { status: CapabilityStatus; note: string };
    cost: { status: CapabilityStatus; note: string };
    quantity: { status: CapabilityStatus; note: string };
    growth: { status: CapabilityStatus; note: string };
    forecast: { status: CapabilityStatus; note: string };
  };
}

export interface KPISummary {
  totalRevenue: number | null;
  totalProfit: number | null;
  profitMargin: number | null;
  totalQuantity: number | null;
  totalCost: number | null;
  revenueGrowth: number | null;
  previousMonthRevenue: number | null;
  currentMonthRevenue: number | null;
  profitUnavailableReason: string | null;
  currencySymbol: string;
}

export interface MonthlyMetricPoint {
  month: string; // YYYY-MM
  label: string; // e.g. Jan 2025
  revenue: number;
  profit: number | null;
  cost: number | null;
  quantity: number;
  orderCount: number;
  growthPct: number | null;
}

export interface DimensionAnalysisRow {
  name: string;
  revenue: number;
  quantity: number;
  cost: number | null;
  profit: number | null;
  profitMargin: number | null;
  contributionPct: number;
  rank: number;
}

export type TrendDirection = 'Increasing' | 'Decreasing' | 'Stable' | 'Insufficient data';

export interface TrendAnalysisResult {
  direction: TrendDirection;
  slopePerMonth: number;
  overallChangePct: number | null;
  peakMonth: { month: string; label: string; revenue: number } | null;
  lowestMonth: { month: string; label: string; revenue: number } | null;
  monthlyValues: MonthlyMetricPoint[];
  plainLanguageSummary: string;
}

export interface AnomalyRecord {
  id: string;
  date: string;
  periodType: 'monthly' | 'daily';
  revenue: number;
  expectedRange: {
    lower: number;
    upper: number;
    median: number;
    iqr: number;
  };
  deviationPct: number;
  direction: 'spike' | 'drop';
  reason: string;
  topContributor?: string;
}

export interface ForecastResult {
  available: boolean;
  unavailableReason?: string;
  modelName: string;
  observationsCount: number;
  nextMonth: string;
  nextMonthLabel: string;
  prediction: number | null;
  lowerBound: number | null;
  upperBound: number | null;
  mae: number | null;
  rmse: number | null;
  rSquared: number | null;
  slope: number | null;
  intercept: number | null;
  disclaimer: string;
  historicalAndFitted: Array<{
    month: string;
    label: string;
    actualRevenue: number | null;
    fittedRevenue: number;
    isForecast: boolean;
    lowerBound?: number;
    upperBound?: number;
  }>;
}

export interface EvidenceObject {
  id: string;
  evidence_type:
    | 'kpi_summary'
    | 'trend_analysis'
    | 'product_ranking'
    | 'category_ranking'
    | 'regional_ranking'
    | 'regional_comparison'
    | 'product_comparison'
    | 'category_comparison'
    | 'anomaly_detection'
    | 'revenue_forecast'
    | 'unavailable_metric';
  title: string;
  finding: string;
  value: number | string | null;
  secondary_values?: Record<string, number | string | null>;
  unit: 'currency' | 'percentage' | 'units' | 'text';
  source_columns: string[];
  formula: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export interface AIInsightItem {
  id: string;
  category: 'trend' | 'product' | 'category' | 'region' | 'anomaly' | 'forecast';
  title: string;
  explanation: string;
  evidence: EvidenceObject;
  confidence: 'High' | 'Medium' | 'Low';
  sourceMetric: string;
  aiGenerated: boolean;
}

export type QuestionIntent =
  | 'top_dimension'
  | 'metric_value'
  | 'trend'
  | 'forecast'
  | 'comparison'
  | 'anomaly'
  | 'unknown';

export type MetricType = 'revenue' | 'profit' | 'cost' | 'quantity' | 'profit_margin';
export type DimensionType = 'product' | 'category' | 'region';

export interface ParsedQuestionIntent {
  rawQuestion: string;
  intent: QuestionIntent;
  metric: MetricType;
  dimension: DimensionType | null;
  comparisonValues: string[];
  isHinglish: boolean;
  bottomRank?: boolean;
}

export interface ComparisonAnalysisResult {
  dimension: DimensionType;
  metric: MetricType;
  itemA: { name: string; value: number };
  itemB: { name: string; value: number };
  difference: number;
  percentageDifference: number | null;
  winner: string;
  summary: string;
}

export interface ChatResponsePayload {
  question: string;
  parsedIntent: ParsedQuestionIntent;
  deterministicAnswer: string;
  aiExplanation: string;
  llmError: string | null;
  evidence: EvidenceObject[];
  comparison?: ComparisonAnalysisResult | null;
  capabilityStatus: CapabilityStatus;
  suggestedFollowUps: string[];
}

export interface DatasetAnalysisBundle {
  datasetId: string;
  quality: DataQualityReport;
  kpis: KPISummary;
  monthlySeries: MonthlyMetricPoint[];
  productAnalysis: DimensionAnalysisRow[];
  categoryAnalysis: DimensionAnalysisRow[];
  regionalAnalysis: DimensionAnalysisRow[];
  trendAnalysis: TrendAnalysisResult;
  anomalies: AnomalyRecord[];
  forecast: ForecastResult;
  evidenceList: EvidenceObject[];
  insights: AIInsightItem[];
  llmStatus: {
    configured: boolean;
    lastError: string | null;
  };
  sampleRows: Record<string, string | number | boolean | null>[];
}
