import React from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { DatasetAnalysisBundle } from '../types/analytics';

interface DataQualityPageProps {
  bundle: DatasetAnalysisBundle;
}

export const DataQualityPage: React.FC<DataQualityPageProps> = ({ bundle }) => {
  const { quality, sampleRows } = bundle;

  const capabilityEntries = [
    { name: 'Revenue', data: quality.capabilities.revenue },
    { name: 'Profit', data: quality.capabilities.profit },
    { name: 'Profit Margin', data: quality.capabilities.profitMargin },
    { name: 'Cost', data: quality.capabilities.cost },
    { name: 'Quantity', data: quality.capabilities.quantity },
    { name: 'Month-over-Month Growth', data: quality.capabilities.growth },
    { name: 'Revenue Forecast', data: quality.capabilities.forecast },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Data Quality, Cleaning & Capability Audit
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Full transparency into missing values, deduplication, median imputation, schema mapping, and metric availability.
          </p>
        </div>
        <div className="font-mono text-xs text-slate-600 tabular-nums">
          {quality.cleanedRowCount.toLocaleString()} clean rows / {quality.rawRowCount.toLocaleString()} raw rows
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Missing Values</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-slate-900 tabular-nums">
            {quality.totalMissingValues}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Numeric → median</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Duplicate Rows</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-slate-900 tabular-nums">
            {quality.duplicateRowsRemoved}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Removed safely</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Invalid Dates</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-slate-900 tabular-nums">
            {quality.invalidDatesCount}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">ISO YYYY-MM-DD</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Invalid Numerics</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-slate-900 tabular-nums">
            {quality.invalidNumericCount}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Coerced & imputed</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Unknown Categories</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-slate-900 tabular-nums">
            {quality.unknownCategoriesCount}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Filled as "Unknown"</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Columns Used</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-indigo-700 tabular-nums">
            {quality.columnsUsedForAnalytics.length} / {quality.columnCount}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Canonical + derived</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Analytical Capability Statuses
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Determines whether each business capability is Directly Available, Derived, or Unavailable.
          </p>
          <div className="mt-4 divide-y divide-slate-100">
            {capabilityEntries.map((cap) => (
              <div
                key={cap.name}
                className="flex items-start justify-between gap-4 py-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-900">{cap.name}</p>
                  <p className="mt-0.5 text-slate-500">{cap.data.note}</p>
                </div>
                <span
                  className={`font-mono font-semibold whitespace-nowrap ${
                    cap.data.status === 'Directly Available'
                      ? 'text-emerald-700'
                      : cap.data.status === 'Derived'
                      ? 'text-indigo-700'
                      : 'text-amber-700'
                  }`}
                >
                  {cap.data.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Transparent Data Cleaning Audit Log
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Every deterministic transformation applied during dataset ingestion.
          </p>

          <div className="mt-4 space-y-3">
            {quality.cleaningActions.map((act, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-slate-900">
                      {act.step}
                      {act.column ? ` (${act.column})` : ''}
                    </p>
                    <p className="mt-0.5 text-slate-600">{act.description}</p>
                  </div>
                </div>
                <span className="font-mono text-slate-500 tabular-nums whitespace-nowrap">
                  {act.affectedRows} rows
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-600">
            <p>
              <strong className="text-slate-900">Columns Detected:</strong>{' '}
              {quality.detectedColumns.join(', ')}
            </p>
            <p className="mt-1">
              <strong className="text-slate-900">Columns Used for Analytics:</strong>{' '}
              {quality.columnsUsedForAnalytics.join(', ')}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Cleaned & Normalized Dataset Preview (First 15 Rows)
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Product</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">Region</th>
                <th className="pb-2 text-right font-medium">Quantity</th>
                <th className="pb-2 text-right font-medium">Selling_Price</th>
                <th className="pb-2 text-right font-medium">Revenue</th>
                <th className="pb-2 text-right font-medium">Cost</th>
                <th className="pb-2 text-right font-medium">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {sampleRows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-2 text-slate-700">{String(r.Date ?? '—')}</td>
                  <td className="py-2 font-sans font-medium text-slate-900">
                    {String(r.Product)}
                  </td>
                  <td className="py-2 font-sans text-slate-600">
                    {String(r.Category)}
                  </td>
                  <td className="py-2 font-sans text-slate-600">
                    {String(r.Region)}
                  </td>
                  <td className="py-2 text-right text-slate-700">
                    {r.Quantity !== null ? Number(r.Quantity).toLocaleString() : '—'}
                  </td>
                  <td className="py-2 text-right text-slate-700">
                    {r.Selling_Price !== null
                      ? Number(r.Selling_Price).toLocaleString()
                      : '—'}
                  </td>
                  <td className="py-2 text-right font-semibold text-slate-900">
                    {r.Revenue !== null ? Number(r.Revenue).toLocaleString() : '—'}
                  </td>
                  <td className="py-2 text-right text-slate-700">
                    {r.Cost !== null ? Number(r.Cost).toLocaleString() : 'Missing'}
                  </td>
                  <td className="py-2 text-right text-emerald-700">
                    {r.Profit !== null
                      ? Number(r.Profit).toLocaleString()
                      : 'Unavailable'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
