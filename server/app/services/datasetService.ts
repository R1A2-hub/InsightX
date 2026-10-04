import { enrichInsightsWithGemini, explainQuestionWithGemini } from '../ai/geminiService';
import {
  analyzeDimension,
  analyzeTrend,
  calculateKPIs,
  calculateMonthlySeries,
  detectAnomalies,
  forecastRevenue,
} from '../analytics/engine';
import { buildDatasetEvidence } from '../analytics/evidenceBuilder';
import { resolveQuestionDeterministically } from '../analytics/intentEngine';
import { parseRawFileBuffer, processAndCleanDataset } from '../data/processor';
import { getSampleDatasets } from '../data/sampleData';
import { datasetRepository } from '../models/repository';
import { ChatResponsePayload, DatasetAnalysisBundle } from '../schemas/analytics';

export async function runFullPipelineFromRows(
  rawRows: Record<string, unknown>[],
  filename: string,
  fileSizeBytes = 0,
  skipAiEnrichment = false
): Promise<DatasetAnalysisBundle> {
  const processed = processAndCleanDataset(rawRows, filename, fileSizeBytes);
  const { rows, quality, currencySymbol } = processed;

  const hasCost = quality.capabilities.cost.status !== 'Unavailable';
  const hasQuantity = quality.capabilities.quantity.status !== 'Unavailable';

  const monthlySeries = calculateMonthlySeries(rows, hasCost);
  const kpis = calculateKPIs(rows, monthlySeries, hasCost, hasQuantity, currencySymbol);
  const productAnalysis = analyzeDimension(rows, 'Product', hasCost);
  const categoryAnalysis = analyzeDimension(rows, 'Category', hasCost);
  const regionalAnalysis = analyzeDimension(rows, 'Region', hasCost);
  const trendAnalysis = analyzeTrend(monthlySeries, currencySymbol);
  const anomalies = detectAnomalies(rows, monthlySeries, currencySymbol);
  const forecast = forecastRevenue(monthlySeries);

  const { evidenceList, baseInsights } = buildDatasetEvidence({
    quality,
    kpis,
    trend: trendAnalysis,
    products: productAnalysis,
    categories: categoryAnalysis,
    regions: regionalAnalysis,
    anomalies,
    forecast,
  });

  let insights = baseInsights;
  let lastError: string | null = null;
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');

  if (!skipAiEnrichment) {
    const aiResult = await enrichInsightsWithGemini(baseInsights, currencySymbol);
    insights = aiResult.insights;
    lastError = aiResult.llmError;
  }

  const datasetId = `ds_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const bundle: DatasetAnalysisBundle = {
    datasetId,
    quality,
    kpis,
    monthlySeries,
    productAnalysis,
    categoryAnalysis,
    regionalAnalysis,
    trendAnalysis,
    anomalies,
    forecast,
    evidenceList,
    insights,
    llmStatus: {
      configured: hasApiKey,
      lastError,
    },
    sampleRows: rows.slice(0, 15).map((r) => ({
      Date: r.Date,
      Product: r.Product,
      Category: r.Category,
      Region: r.Region,
      Quantity: r.Quantity,
      Selling_Price: r.Selling_Price,
      Revenue: r.Revenue,
      Cost: r.Cost,
      Profit: r.Profit,
    })),
  };

  await datasetRepository.save(bundle);
  return bundle;
}

export async function ingestUploadedBuffer(
  buffer: Buffer,
  filename: string
): Promise<DatasetAnalysisBundle> {
  const rawRows = parseRawFileBuffer(buffer, filename);
  return runFullPipelineFromRows(rawRows, filename, buffer.length);
}

export async function loadSampleDatasetById(sampleId = 'sample-enterprise'): Promise<DatasetAnalysisBundle> {
  const presets = getSampleDatasets();
  const chosen = presets.find((p) => p.id === sampleId) || presets[0];
  const approxBytes = JSON.stringify(chosen.rows).length;
  return runFullPipelineFromRows(chosen.rows, chosen.filename, approxBytes);
}

export async function answerAnalystQuestion(
  question: string,
  datasetId?: string
): Promise<ChatResponsePayload> {
  const bundle = datasetId
    ? await datasetRepository.getById(datasetId)
    : await datasetRepository.getActive();

  if (!bundle) {
    throw new Error('No dataset is currently loaded. Please upload a dataset or load a sample dataset first.');
  }

  const resolved = resolveQuestionDeterministically(question, bundle);

  const { explanation, llmError } = await explainQuestionWithGemini({
    question,
    parsedIntent: resolved.parsedIntent,
    deterministicAnswer: resolved.deterministicAnswer,
    evidence: resolved.evidence,
    currencySymbol: bundle.kpis.currencySymbol,
  });

  return {
    question,
    parsedIntent: resolved.parsedIntent,
    deterministicAnswer: resolved.deterministicAnswer,
    aiExplanation: explanation,
    llmError,
    evidence: resolved.evidence,
    comparison: resolved.comparison,
    capabilityStatus: resolved.capabilityStatus,
    suggestedFollowUps: resolved.suggestedFollowUps,
  };
}
