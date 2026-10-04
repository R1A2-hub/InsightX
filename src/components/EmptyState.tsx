import React, { useRef } from 'react';
import {
  FileSpreadsheet,
  Sparkles,
  Upload,
} from 'lucide-react';

interface EmptyStateProps {
  onUploadFile: (file: File) => void;
  onLoadSample: (sampleId: string) => void;
  isLoading: boolean;
  error: string | null;
}

const PIPELINE_STEPS = [
  { step: '01. Upload & Validate', desc: 'CSV & XLSX up to 10 MB verified for schema integrity' },
  { step: '02. Profile & Clean', desc: 'Deduplication, median imputation & date normalization' },
  { step: '03. Schema Mapping', desc: 'Canonical mapping for Revenue, Cost, Quantity & Region' },
  { step: '04. Deterministic Engine', desc: 'Exact KPIs, rankings, IQR anomalies & OLS forecasts' },
  { step: '05. Evidence Builder', desc: 'Structured mathematical proof objects assembled' },
  { step: '06. AI Explanation', desc: 'Natural English & Hinglish answers grounded in evidence' },
];

export const EmptyState: React.FC<EmptyStateProps> = ({
  onUploadFile,
  onLoadSample,
  isLoading,
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
      e.target.value = '';
    }
  };

  return (
    <div className="mx-auto max-w-4xl py-8 px-4">
      <div className="rounded-xl border border-slate-200 bg-white p-8 lg:p-12">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FileSpreadsheet className="h-6 w-6" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Upload your business data to start analyzing.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            InsightX deterministically cleans your sales records, normalizes column aliases, computes exact revenue and profit margins, detects IQR anomalies, forecasts future sales, and answers questions in English or Hinglish.
          </p>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap"
            >
              <Upload className="h-4 w-4" />
              <span>{isLoading ? 'Processing Dataset...' : 'Upload Dataset'}</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => onLoadSample('sample-enterprise')}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:opacity-60 whitespace-nowrap"
            >
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>Try Sample Dataset</span>
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
            <span>Supports .CSV and .XLSX (max 10 MB)</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onLoadSample('sample-no-cost')}
              className="font-medium text-indigo-600 underline-offset-2 hover:underline"
            >
              Or test Sample Dataset without Cost column (Derived Revenue demo)
            </button>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200 pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              The InsightX Deterministic Analytics Pipeline
            </h2>
            <span className="text-xs text-slate-500">
              Compute First · Explain Second
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PIPELINE_STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-lg border border-slate-200 bg-slate-50/60 p-4"
              >
                <p className="text-xs font-semibold text-slate-900">{item.step}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
