import { Capacitor } from '@capacitor/core';
import {
  ChatResponsePayload,
  ComparisonAnalysisResult,
  DatasetAnalysisBundle,
  DatasetListItem,
  DimensionType,
  MetricType,
  SamplePresetMeta,
} from '../types/analytics';

export const DEFAULT_PRODUCTION_API = 'https://insightx-ai-data-analyst-20453368826.asia-southeast1.run.app';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('insightx_api_base_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // When running inside native Android or iOS app container
  if (Capacitor.isNativePlatform()) {
    return DEFAULT_PRODUCTION_API;
  }

  // When running in standard web browser, use relative URL (same-origin)
  return '';
}

export function setCustomApiBaseUrl(url: string | null): void {
  if (typeof window === 'undefined') return;
  if (!url || !url.trim()) {
    localStorage.removeItem('insightx_api_base_url');
  } else {
    localStorage.setItem('insightx_api_base_url', url.trim().replace(/\/+$/, ''));
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export const apiService = {
  async getDatasetsList(): Promise<{
    datasets: DatasetListItem[];
    activeDatasetId: string | null;
    samples: SamplePresetMeta[];
  }> {
    const res = await fetch(`${getApiBaseUrl()}/api/datasets`);
    return handleResponse(res);
  },

  async getActiveDataset(): Promise<{ bundle: DatasetAnalysisBundle | null }> {
    const res = await fetch(`${getApiBaseUrl()}/api/datasets/active`);
    return handleResponse(res);
  },

  async uploadDatasetFile(file: File): Promise<{ bundle: DatasetAnalysisBundle }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${getApiBaseUrl()}/api/datasets/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  async loadSampleDataset(sampleId = 'sample-enterprise'): Promise<{ bundle: DatasetAnalysisBundle }> {
    const res = await fetch(`${getApiBaseUrl()}/api/datasets/sample`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleId }),
    });
    return handleResponse(res);
  },

  async activateDataset(datasetId: string): Promise<{ bundle: DatasetAnalysisBundle }> {
    const res = await fetch(`${getApiBaseUrl()}/api/datasets/${encodeURIComponent(datasetId)}/activate`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  async deleteDataset(datasetId: string): Promise<{
    bundle: DatasetAnalysisBundle | null;
    datasets: DatasetListItem[];
  }> {
    const res = await fetch(`${getApiBaseUrl()}/api/datasets/${encodeURIComponent(datasetId)}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async askAnalystQuestion(question: string, datasetId?: string): Promise<ChatResponsePayload> {
    const res = await fetch(`${getApiBaseUrl()}/api/chat/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, datasetId }),
    });
    return handleResponse(res);
  },

  async runComparison(params: {
    dimension: DimensionType;
    metric: MetricType;
    itemA: string;
    itemB: string;
    datasetId?: string;
  }): Promise<{ comparison: ComparisonAnalysisResult }> {
    const res = await fetch(`${getApiBaseUrl()}/api/analytics/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },
};

export function formatCurrencyValue(
  value: number | null | undefined,
  symbol = '₹',
  compact = false
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'Unavailable';
  }
  if (compact) {
    const abs = Math.abs(value);
    if (symbol === '₹') {
      if (abs >= 10000000) return `${symbol}${(value / 10000000).toFixed(2)} Cr`;
      if (abs >= 100000) return `${symbol}${(value / 100000).toFixed(2)} L`;
    }
    if (abs >= 1000000) return `${symbol}${(value / 1000000).toFixed(2)}M`;
    if (abs >= 1000) return `${symbol}${(value / 1000).toFixed(1)}K`;
  }
  return `${symbol}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
