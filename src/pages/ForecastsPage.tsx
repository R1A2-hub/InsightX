import React from 'react';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { ForecastChart } from '../charts/ForecastChart';
import { formatCurrencyValue } from '../services/api';
import { DatasetAnalysisBundle } from '../types/analytics';

interface ForecastsPageProps {
  bundle: DatasetAnalysisBundle;
}

export const ForecastsPage: React.FC<ForecastsPageProps> = ({ bundle }) => {
  const { forecast, kpis } = bundle;
  const cur = kpis.currencySymbol || '₹';

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Revenue Forecasting & Projections
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Deterministic statistical projections trained on monthly historical revenue observations.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-900">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>{forecast.disclaimer}</span>
        </div>
      </div>

      {!forecast.available ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <TrendingUp className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-3 text-base font-semibold text-slate-900">
            Forecasting Unavailable for Current Dataset
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-600">
            {forecast.unavailableReason ||
              'Forecasting requires a minimum of 3 monthly observations.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">
                Predicted Revenue ({forecast.nextMonthLabel})
              </p>
              <p className="mt-2 font-mono text-2xl font-bold text-indigo-700 tabular-nums">
                {formatCurrencyValue(forecast.prediction, cur)}
              </p>
              <p className="mt-1 text-xs font-semibold text-amber-700">
                {forecast.disclaimer}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Lower Bound</p>
              <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {formatCurrencyValue(forecast.lowerBound, cur)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Conservative estimate floor
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Upper Bound</p>
              <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {formatCurrencyValue(forecast.upperBound, cur)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Optimistic estimate ceiling
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">
                MAE (Mean Absolute Error)
              </p>
              <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {formatCurrencyValue(forecast.mae, cur)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Average historical residual
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">
                RMSE (Root Mean Squared Error)
              </p>
              <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {formatCurrencyValue(forecast.rmse, cur)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Trained on {forecast.observationsCount} months
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Historical Actuals vs. Revenue Forecast
                </h2>
                <p className="text-xs text-slate-500">
                  Historical values are solid navy; projected trend and next-month estimate ({forecast.nextMonthLabel}) are dashed indigo.
                </p>
              </div>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                Monthly Trend: {formatCurrencyValue(forecast.slope, cur)}/mo · Trend Fit: {forecast.rSquared}
              </span>
            </div>

            <ForecastChart forecast={forecast} currencySymbol={cur} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-900">
              Monthly Observations & Forecast Breakdown
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2.5 font-medium">Period</th>
                    <th className="pb-2.5 font-medium">Record Type</th>
                    <th className="pb-2.5 text-right font-medium">
                      Historical Actual
                    </th>
                    <th className="pb-2.5 text-right font-medium">
                      Projected / Fitted
                    </th>
                    <th className="pb-2.5 text-right font-medium">
                      Confidence Interval
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {forecast.historicalAndFitted.map((pt) => (
                    <tr
                      key={pt.month}
                      className={
                        pt.isForecast
                          ? 'bg-indigo-50/50 font-semibold'
                          : 'hover:bg-slate-50'
                      }
                    >
                      <td className="py-2.5 text-slate-900">{pt.label}</td>
                      <td className="py-2.5 text-slate-600">
                        {pt.isForecast
                          ? 'Forecast (Estimate — not a guarantee)'
                          : 'Historical Actual'}
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-900 tabular-nums">
                        {pt.actualRevenue !== null
                          ? formatCurrencyValue(pt.actualRevenue, cur)
                          : '— (Future Period)'}
                      </td>
                      <td className="py-2.5 text-right font-mono text-indigo-700 tabular-nums">
                        {formatCurrencyValue(pt.fittedRevenue, cur)}
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-600 tabular-nums">
                        {pt.isForecast
                          ? `${formatCurrencyValue(pt.lowerBound, cur)} – ${formatCurrencyValue(pt.upperBound, cur)}`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
