import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { RevenueProfitChart } from '../charts/RevenueProfitChart';
import { KpiCardsGrid } from '../components/KpiCardsGrid';
import { formatCurrencyValue } from '../services/api';
import { DatasetAnalysisBundle, NavSection } from '../types/analytics';

interface DashboardPageProps {
  bundle: DatasetAnalysisBundle;
  onNavigate: (section: NavSection) => void;
  onQuickAsk: (question: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  bundle,
  onNavigate,
  onQuickAsk,
}) => {
  const { quality, kpis, monthlySeries, productAnalysis, regionalAnalysis, trendAnalysis, anomalies, forecast, insights } =
    bundle;
  const cur = kpis.currencySymbol || '₹';
  const hasProfit = kpis.totalProfit !== null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Executive Business Intelligence
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">{quality.filename}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {quality.cleanedRowCount.toLocaleString()} cleaned rows
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {quality.columnCount} columns
            </span>
            {quality.dateRange.minDate && quality.dateRange.maxDate && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {quality.dateRange.minDate} to {quality.dateRange.maxDate} ({quality.dateRange.totalMonths} months)
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('chat')}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 whitespace-nowrap"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Ask Analyst Chat</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('quality')}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
          >
            Data Quality Report
          </button>
        </div>
      </div>

      <KpiCardsGrid kpis={kpis} quality={quality} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Monthly Revenue & Profit Trend
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Direction: <strong className="text-slate-800">{trendAnalysis.direction}</strong>
                {trendAnalysis.peakMonth && (
                  <>
                    {' '}
                    · Peak: {trendAnalysis.peakMonth.label} (
                    {formatCurrencyValue(trendAnalysis.peakMonth.revenue, cur)})
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <span>Full Analytics</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <RevenueProfitChart
            data={monthlySeries}
            currencySymbol={cur}
            hasProfit={hasProfit}
          />
        </div>

        <div className="flex flex-col justify-between gap-6 rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Next Month Forecast
              </h2>
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>

            {forecast.available && forecast.prediction !== null ? (
              <div className="mt-4">
                <p className="text-xs text-slate-500">
                  Projected Revenue for {forecast.nextMonthLabel}
                </p>
                <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                  {formatCurrencyValue(forecast.prediction, cur)}
                </p>
                <p className="mt-1 font-mono text-xs text-slate-600 tabular-nums">
                  Bounds: {formatCurrencyValue(forecast.lowerBound, cur)} –{' '}
                  {formatCurrencyValue(forecast.upperBound, cur)}
                </p>
                <p className="mt-1 font-mono text-xs text-slate-500 tabular-nums">
                  MAE: {formatCurrencyValue(forecast.mae, cur)} · RMSE:{' '}
                  {formatCurrencyValue(forecast.rmse, cur)}
                </p>
                <p className="mt-2 text-xs font-semibold text-amber-700">
                  {forecast.disclaimer}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500">
                {forecast.unavailableReason}
              </p>
            )}
          </div>

          <div className="border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                IQR Anomaly Detection
              </h3>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            {anomalies.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                No unusual revenue spikes or drops outside 1.5×IQR thresholds.
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                <p className="text-xs font-medium text-slate-800">
                  {anomalies[0].date}: {formatCurrencyValue(anomalies[0].revenue, cur)} (
                  {anomalies[0].deviationPct >= 0 ? '+' : ''}
                  {anomalies[0].deviationPct}% vs median)
                </p>
                <p className="text-xs leading-relaxed text-slate-600">
                  Expected range: {formatCurrencyValue(anomalies[0].expectedRange.lower, cur)}{' '}
                  to {formatCurrencyValue(anomalies[0].expectedRange.upper, cur)}
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('insights')}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Inspect all {anomalies.length} anomaly finding(s) →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Top Performing Products
              </h2>
              <p className="text-xs text-slate-500">
                Sorted by deterministic revenue contribution
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-2.5 font-medium">Rank</th>
                  <th className="pb-2.5 font-medium">Product</th>
                  <th className="pb-2.5 text-right font-medium">Revenue</th>
                  <th className="pb-2.5 text-right font-medium">Profit</th>
                  <th className="pb-2.5 text-right font-medium">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productAnalysis.slice(0, 5).map((row) => (
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
                      {row.profit !== null ? formatCurrencyValue(row.profit, cur) : 'N/A'}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-600 tabular-nums">
                      {row.contributionPct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Regional Performance Breakdown
              </h2>
              <p className="text-xs text-slate-500">
                Revenue, quantity, and profit contribution by region
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Compare Regions
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-2.5 font-medium">Rank</th>
                  <th className="pb-2.5 font-medium">Region</th>
                  <th className="pb-2.5 text-right font-medium">Revenue</th>
                  <th className="pb-2.5 text-right font-medium">Units</th>
                  <th className="pb-2.5 text-right font-medium">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {regionalAnalysis.slice(0, 5).map((row) => (
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
                    <td className="py-2.5 text-right font-mono text-slate-600 tabular-nums">
                      {row.contributionPct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Evidence-Backed AI Insights & Quick Questions
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('insights')}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            View All {insights.length} Insights & Evidence Objects →
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {insights.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{item.sourceMetric}</span>
                <span>Confidence: {item.confidence}</span>
              </div>
              <h3 className="mt-1.5 text-sm font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {item.explanation}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <span className="text-xs font-medium text-slate-500">
            Ask Analyst (English or Hinglish):
          </span>
          {[
            'Which product generated the most revenue?',
            'North vs South revenue?',
            'which product sabse zyada revenue laaya?',
            'next month sales kitni ho skti h?',
          ].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onQuickAsk(q)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-700 whitespace-nowrap"
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
