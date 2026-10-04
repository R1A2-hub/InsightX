import React from 'react';
import { formatCurrencyValue } from '../services/api';
import { DataQualityReport, KPISummary } from '../types/analytics';

interface KpiCardsGridProps {
  kpis: KPISummary;
  quality: DataQualityReport;
}

export const KpiCardsGrid: React.FC<KpiCardsGridProps> = ({ kpis, quality }) => {
  const cur = kpis.currencySymbol || '₹';
  const hasProfit = kpis.totalProfit !== null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium text-slate-600">Total Revenue</span>
          <span>{quality.capabilities.revenue.status}</span>
        </div>
        <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
          {formatCurrencyValue(kpis.totalRevenue, cur)}
        </p>
        <p className="mt-1.5 text-xs text-slate-500">
          {quality.capabilities.revenue.note}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium text-slate-600">Total Profit</span>
          <span>{quality.capabilities.profit.status}</span>
        </div>
        {hasProfit ? (
          <>
            <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {formatCurrencyValue(kpis.totalProfit, cur)}
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              Cost: {formatCurrencyValue(kpis.totalCost, cur)} · Revenue − Cost
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 font-mono text-base font-semibold text-amber-700">
              Unavailable
            </p>
            <p className="mt-1 text-xs leading-snug text-amber-800">
              {kpis.profitUnavailableReason ||
                'Profit unavailable because Cost data is missing.'}
            </p>
          </>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium text-slate-600">Profit Margin</span>
          <span>{quality.capabilities.profitMargin.status}</span>
        </div>
        {kpis.profitMargin !== null ? (
          <>
            <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {kpis.profitMargin.toFixed(2)}%
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              Formula: (Profit / Revenue) × 100
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 font-mono text-base font-semibold text-amber-700">
              Unavailable
            </p>
            <p className="mt-1 text-xs leading-snug text-amber-800">
              Profit unavailable because Cost data is missing.
            </p>
          </>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium text-slate-600">Total Quantity</span>
          <span>{quality.capabilities.quantity.status}</span>
        </div>
        {kpis.totalQuantity !== null ? (
          <>
            <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {kpis.totalQuantity.toLocaleString()}
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              Units across {quality.cleanedRowCount.toLocaleString()} records
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 font-mono text-base font-semibold text-slate-400">
              Unavailable
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Quantity column not present in dataset
            </p>
          </>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium text-slate-600">Revenue Growth</span>
          <span>{quality.capabilities.growth.status}</span>
        </div>
        {kpis.revenueGrowth !== null ? (
          <>
            <p
              className={`mt-2 font-mono text-2xl font-bold tracking-tight tabular-nums ${
                kpis.revenueGrowth >= 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {kpis.revenueGrowth >= 0 ? '+' : ''}
              {kpis.revenueGrowth.toFixed(2)}%
            </p>
            <p className="mt-1.5 font-mono text-xs text-slate-500 tabular-nums">
              Latest vs Prior ({formatCurrencyValue(kpis.previousMonthRevenue, cur, true)})
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 font-mono text-base font-semibold text-slate-400">
              Insufficient Periods
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Requires at least 2 monthly periods
            </p>
          </>
        )}
      </div>
    </div>
  );
};
