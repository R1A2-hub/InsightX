import React, { useRef } from 'react';
import {
  CheckCircle2,
  FileSpreadsheet,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { formatCurrencyValue } from '../services/api';
import {
  DatasetAnalysisBundle,
  DatasetListItem,
  NavSection,
  SamplePresetMeta,
} from '../types/analytics';

interface DatasetsPageProps {
  bundle: DatasetAnalysisBundle | null;
  datasets: DatasetListItem[];
  samples: SamplePresetMeta[];
  onUploadFile: (file: File) => void;
  onLoadSample: (sampleId: string) => void;
  onActivateDataset: (datasetId: string) => void;
  onDeleteDataset: (datasetId: string) => void;
  onNavigate: (section: NavSection) => void;
  isLoading: boolean;
  error: string | null;
}

const PIPELINE_STAGES = [
  'Upload',
  'Validate',
  'Profile',
  'Clean',
  'Understand Schema',
  'Calculate Metrics',
  'Analyze Dimensions',
  'Detect Trends',
  'Detect Anomalies',
  'Forecast',
  'Generate Evidence',
  'Generate AI Insights',
];

export const DatasetsPage: React.FC<DatasetsPageProps> = ({
  bundle,
  datasets,
  samples,
  onUploadFile,
  onLoadSample,
  onActivateDataset,
  onDeleteDataset,
  onNavigate,
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
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dataset Upload & Schema Profiling
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Upload a CSV or Excel (.xlsx) sales dataset up to 10 MB for deterministic validation, cleaning, and schema normalization.
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap"
          >
            <Upload className="h-4 w-4" />
            <span>{isLoading ? 'Running Pipeline...' : 'Upload CSV / XLSX'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-8 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/20 lg:col-span-2"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900">
            Click to select a CSV or Excel (.xlsx) file
          </h2>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
            Maximum file size: 10 MB. Automatically recognizes common column aliases for Quantity, Selling_Price, Revenue, Cost, Product, Category, Region, and Date.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span>Supported: .csv, .xlsx</span>
            <span aria-hidden="true">·</span>
            <span>Validates empty files, unreadable formats & missing usable columns</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Try Sample Datasets
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Test the complete InsightX pipeline immediately with realistic SMB sales data.
          </p>
          <div className="mt-4 space-y-3">
            {samples.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5"
              >
                <p className="text-xs font-semibold text-slate-900">{s.name}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  {s.description}
                </p>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => onLoadSample(s.id)}
                  className="mt-2.5 w-full rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                >
                  Load {s.filename} ({s.rowCount} rows)
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {bundle && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Pipeline Execution Status: Complete
              </h2>
              <p className="text-xs text-slate-500">
                Active dataset <strong className="text-slate-800">{bundle.quality.filename}</strong> processed through all 12 deterministic & AI explanation stages.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Open Dashboard →
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {PIPELINE_STAGES.map((stage, idx) => (
              <div
                key={stage}
                className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2"
              >
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="truncate text-xs font-medium text-slate-800">
                  {idx + 1}. {stage}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-200 pt-6 sm:grid-cols-4 lg:grid-cols-7">
            <div>
              <p className="text-xs text-slate-500">Filename</p>
              <p className="mt-1 truncate text-xs font-semibold text-slate-900">
                {bundle.quality.filename}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Rows (Raw / Clean)</p>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-900 tabular-nums">
                {bundle.quality.rawRowCount} / {bundle.quality.cleanedRowCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Columns</p>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-900 tabular-nums">
                {bundle.quality.columnCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Missing Values</p>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-900 tabular-nums">
                {bundle.quality.totalMissingValues} (Imputed)
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Duplicate Rows</p>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-900 tabular-nums">
                {bundle.quality.duplicateRowsRemoved} (Removed)
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-500">Date Range</p>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-900 tabular-nums">
                {bundle.quality.dateRange.minDate
                  ? `${bundle.quality.dateRange.minDate} → ${bundle.quality.dateRange.maxDate} (${bundle.quality.dateRange.totalMonths} mos)`
                  : 'No date column'}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold text-slate-900">
              Detected Columns & Canonical Schema Normalization
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 font-medium">Uploaded Column</th>
                    <th className="pb-2 font-medium">Normalized Canonical Name</th>
                    <th className="pb-2 font-medium">Data Type</th>
                    <th className="pb-2 text-right font-medium">Missing Values</th>
                    <th className="pb-2 font-medium pl-4">Sample Values</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bundle.quality.columnMappings.map((col) => (
                    <tr key={col.originalName}>
                      <td className="py-2.5 font-mono font-medium text-slate-800">
                        {col.originalName}
                      </td>
                      <td className="py-2.5 font-mono font-semibold text-indigo-700">
                        {col.canonicalName || 'Unmapped (Preserved)'}
                      </td>
                      <td className="py-2.5 text-slate-600">{col.dataType}</td>
                      <td className="py-2.5 text-right font-mono text-slate-700 tabular-nums">
                        {col.missingCount}
                      </td>
                      <td className="py-2.5 pl-4 font-mono text-slate-500">
                        {col.sampleValues.slice(0, 3).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {datasets.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Session Datasets ({datasets.length})
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-2.5 font-medium">Filename</th>
                  <th className="pb-2.5 text-right font-medium">Clean Rows</th>
                  <th className="pb-2.5 text-right font-medium">Columns</th>
                  <th className="pb-2.5 text-right font-medium">Total Revenue</th>
                  <th className="pb-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {datasets.map((d) => {
                  const isActive = bundle?.datasetId === d.datasetId;
                  return (
                    <tr key={d.datasetId} className="hover:bg-slate-50">
                      <td className="py-3 font-semibold text-slate-900">
                        {d.filename}{' '}
                        {isActive && (
                          <span className="ml-2 text-[11px] font-medium text-indigo-600">
                            · Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right font-mono text-slate-700 tabular-nums">
                        {d.cleanedRowCount.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-mono text-slate-700 tabular-nums">
                        {d.columnCount}
                      </td>
                      <td className="py-3 text-right font-mono font-medium text-slate-900 tabular-nums">
                        {formatCurrencyValue(d.totalRevenue, d.currencySymbol)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => onActivateDataset(d.datasetId)}
                              className="rounded border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                            >
                              Switch To
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteDataset(d.datasetId)}
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Remove dataset"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
