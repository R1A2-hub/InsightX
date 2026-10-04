import React, { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { DimensionBarChart } from '../charts/DimensionBarChart';
import { RevenueProfitChart } from '../charts/RevenueProfitChart';
import { apiService, formatCurrencyValue } from '../services/api';
import {
  ComparisonAnalysisResult,
  DatasetAnalysisBundle,
  DimensionAnalysisRow,
  DimensionType,
  MetricType,
} from '../types/analytics';

interface AnalyticsPageProps {
  bundle: DatasetAnalysisBundle;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ bundle }) => {
  const {
    kpis,
    monthlySeries,
    productAnalysis,
    categoryAnalysis,
    regionalAnalysis,
    trendAnalysis,
  } = bundle;

  const cur = kpis.currencySymbol || '₹';
  const hasProfit = kpis.totalProfit !== null;

  const [activeMetric, setActiveMetric] = useState<'revenue' | 'profit' | 'quantity'>('revenue');

  const [compDim, setCompDim] = useState<DimensionType>('region');
  const [compMetric, setCompMetric] = useState<MetricType>('revenue');
  const [itemA, setItemA] = useState<string>(regionalAnalysis[0]?.name || '');
  const [itemB, setItemB] = useState<string>(regionalAnalysis[1]?.name || '');
  const [compResult, setCompResult] = useState<ComparisonAnalysisResult | null>(null);
  const [compError, setCompError] = useState<string | null>(null);

  const getDimOptions = (d: DimensionType): DimensionAnalysisRow[] => {
    if (d === 'product') return productAnalysis;
    if (d === 'category') return categoryAnalysis;
    return regionalAnalysis;
  };

  const handleDimensionChange = (d: DimensionType) => {
    setCompDim(d);
    const opts = getDimOptions(d);
    setItemA(opts[0]?.name || '');
    setItemB(opts[1]?.name || opts[0]?.name || '');
    setCompResult(null);
    setCompError(null);
  };

  const handleRunComparison = async () => {
    setCompError(null);
    try {
      const res = await apiService.runComparison({
        dimension: compDim,
        metric: compMetric,
        itemA,
        itemB,
        datasetId: bundle.datasetId,
      });
      setCompResult(res.comparison);
    } catch (err) {
      setCompResult(null);
      setCompError(err instanceof Error ? err.message : 'Comparison failed');
    }
  };

  const renderDimensionSection = (
    title: string,
    subtitle: string,
    rows: DimensionAnalysisRow[]
  ) => (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <span className="text-xs text-slate-500">
          Sorted by Revenue Descending
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <DimensionBarChart
            data={rows}
            activeMetric={activeMetric === 'profit' && !hasProfit ? 'revenue' : activeMetric}
            currencySymbol={cur}
          />
        </div>

        <div className="overflow-x-auto lg:col-span-7">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2.5 font-medium">Rank</th>
                <th className="pb-2.5 font-medium">Name</th>
                <th className="pb-2.5 text-right font-medium">Revenue</th>
                <th className="pb-2.5 text-right font-medium">Quantity</th>
                <th className="pb-2.5 text-right font-medium">Profit</th>
                <th className="pb-2.5 text-right font-medium">Contribution %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.name} className="hover:bg-slate-50">
                  <td className="py-2.5 font-mono text-slate-500 tabular-nums">
                    #{row.rank}
                  </td>
                  <td className="py-2.5 font-semibold text-slate-900">
                    {row.name}
                  </td>
                  <td className="py-2.5 text-right font-mono font-medium text-slate-900 tabular-nums">
                    {formatCurrencyValue(row.revenue, cur)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-700 tabular-nums">
                    {row.quantity.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-700 tabular-nums">
                    {row.profit !== null
                      ? formatCurrencyValue(row.profit, cur)
                      : 'Unavailable'}
                  </td>
                  <td className="py-2.5 text-right font-mono font-medium text-indigo-700 tabular-nums">
                    {row.contributionPct.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const dimOptions = getDimOptions(compDim);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Multi-Dimensional Business Analytics
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Deterministic breakdowns across Time, Products, Categories, and Regions.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {(['revenue', 'profit', 'quantity'] as const).map((m) => {
            const disabled = m === 'profit' && !hasProfit;
            return (
              <button
                key={m}
                type="button"
                disabled={disabled}
                onClick={() => setActiveMetric(m)}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors whitespace-nowrap ${
                  activeMetric === m
                    ? 'bg-white text-slate-900 shadow-xs'
                    : disabled
                    ? 'cursor-not-allowed text-slate-400'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Revenue & Profit Trend Analysis
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              {trendAnalysis.plainLanguageSummary}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span>
              Direction: <strong className="text-slate-900">{trendAnalysis.direction}</strong>
            </span>
            {trendAnalysis.peakMonth && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  Peak: {trendAnalysis.peakMonth.label} (
                  {formatCurrencyValue(trendAnalysis.peakMonth.revenue, cur)})
                </span>
              </>
            )}
            {trendAnalysis.lowestMonth && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  Lowest: {trendAnalysis.lowestMonth.label} (
                  {formatCurrencyValue(trendAnalysis.lowestMonth.revenue, cur)})
                </span>
              </>
            )}
          </div>
        </div>

        <RevenueProfitChart
          data={monthlySeries}
          currencySymbol={cur}
          hasProfit={hasProfit}
        />

        {monthlySeries.length > 0 && (
          <div className="mt-6 overflow-x-auto border-t border-slate-200 pt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-2 font-medium">Month</th>
                  <th className="pb-2 text-right font-medium">Revenue</th>
                  <th className="pb-2 text-right font-medium">Profit</th>
                  <th className="pb-2 text-right font-medium">Quantity</th>
                  <th className="pb-2 text-right font-medium">MoM Growth %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlySeries.map((m) => (
                  <tr key={m.month} className="hover:bg-slate-50">
                    <td className="py-2 font-medium text-slate-900">{m.label}</td>
                    <td className="py-2 text-right font-mono font-medium text-slate-900 tabular-nums">
                      {formatCurrencyValue(m.revenue, cur)}
                    </td>
                    <td className="py-2 text-right font-mono text-slate-700 tabular-nums">
                      {m.profit !== null ? formatCurrencyValue(m.profit, cur) : 'Unavailable'}
                    </td>
                    <td className="py-2 text-right font-mono text-slate-700 tabular-nums">
                      {m.quantity.toLocaleString()}
                    </td>
                    <td
                      className={`py-2 text-right font-mono tabular-nums ${
                        m.growthPct === null
                          ? 'text-slate-400'
                          : m.growthPct >= 0
                          ? 'text-emerald-700'
                          : 'text-red-600'
                      }`}
                    >
                      {m.growthPct === null
                        ? '—'
                        : `${m.growthPct >= 0 ? '+' : ''}${m.growthPct.toFixed(2)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {renderDimensionSection(
        'Product Analysis',
        'Performance ranking across all products by revenue, quantity, profit, and contribution share.',
        productAnalysis
      )}

      {renderDimensionSection(
        'Category Analysis',
        'Category-level aggregation of revenue, unit volume, net profit, and revenue share.',
        categoryAnalysis
      )}

      {renderDimensionSection(
        'Regional Analysis',
        'Geographic sales performance across territories and regions.',
        regionalAnalysis
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-900">
            Deterministic Head-to-Head Comparison
          </h2>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Compare any two Regions, Products, or Categories deterministically on Revenue, Profit, or Quantity.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Dimension
            </label>
            <select
              value={compDim}
              onChange={(e) => handleDimensionChange(e.target.value as DimensionType)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900"
            >
              <option value="region">Region</option>
              <option value="product">Product</option>
              <option value="category">Category</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Metric
            </label>
            <select
              value={compMetric}
              onChange={(e) => setCompMetric(e.target.value as MetricType)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900"
            >
              <option value="revenue">Revenue</option>
              <option value="profit">Profit</option>
              <option value="quantity">Quantity</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Item A
            </label>
            <select
              value={itemA}
              onChange={(e) => setItemA(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900"
            >
              {dimOptions.map((o) => (
                <option key={o.name} value={o.name}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Item B
            </label>
            <select
              value={itemB}
              onChange={(e) => setItemB(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900"
            >
              {dimOptions.map((o) => (
                <option key={o.name} value={o.name}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleRunComparison}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
            >
              Compare Items
            </button>
          </div>
        </div>

        {compError && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            {compError}
          </div>
        )}

        {compResult && (
          <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">{compResult.itemA.name}</p>
              <p className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums">
                {compResult.metric === 'quantity'
                  ? compResult.itemA.value.toLocaleString()
                  : formatCurrencyValue(compResult.itemA.value, cur)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{compResult.itemB.name}</p>
              <p className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums">
                {compResult.metric === 'quantity'
                  ? compResult.itemB.value.toLocaleString()
                  : formatCurrencyValue(compResult.itemB.value, cur)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Difference</p>
              <p className="mt-1 font-mono text-lg font-bold text-indigo-700 tabular-nums">
                {compResult.metric === 'quantity'
                  ? compResult.difference.toLocaleString()
                  : formatCurrencyValue(compResult.difference, cur)}{' '}
                {compResult.percentageDifference !== null &&
                  `(${compResult.percentageDifference}%)`}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Winner</p>
              <p className="mt-1 text-lg font-bold text-emerald-700">
                {compResult.winner}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
