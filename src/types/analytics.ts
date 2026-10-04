import type {
  AIInsightItem,
  AnomalyRecord,
  CapabilityStatus,
  ChatResponsePayload,
  CleaningAction,
  ColumnMapping,
  ComparisonAnalysisResult,
  DataQualityReport,
  DatasetAnalysisBundle,
  DimensionAnalysisRow,
  DimensionType,
  EvidenceObject,
  ForecastResult,
  KPISummary,
  MetricType,
  MonthlyMetricPoint,
  ParsedQuestionIntent,
  QuestionIntent,
  TrendAnalysisResult,
  TrendDirection,
} from '../../server/app/schemas/analytics';

export type {
  AIInsightItem,
  AnomalyRecord,
  CapabilityStatus,
  ChatResponsePayload,
  CleaningAction,
  ColumnMapping,
  ComparisonAnalysisResult,
  DataQualityReport,
  DatasetAnalysisBundle,
  DimensionAnalysisRow,
  DimensionType,
  EvidenceObject,
  ForecastResult,
  KPISummary,
  MetricType,
  MonthlyMetricPoint,
  ParsedQuestionIntent,
  QuestionIntent,
  TrendAnalysisResult,
  TrendDirection,
};

export type NavSection =
  | 'dashboard'
  | 'datasets'
  | 'analytics'
  | 'insights'
  | 'chat'
  | 'forecasts'
  | 'quality'
  | 'settings';

export interface DatasetListItem {
  datasetId: string;
  filename: string;
  uploadedAt: string;
  cleanedRowCount: number;
  columnCount: number;
  totalRevenue: number | null;
  currencySymbol: string;
}

export interface SamplePresetMeta {
  id: string;
  name: string;
  filename: string;
  description: string;
  rowCount: number;
}
