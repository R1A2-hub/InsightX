import React from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrencyValue } from '../services/api';
import { ForecastResult } from '../types/analytics';

interface ForecastChartProps {
  forecast: ForecastResult;
  currencySymbol: string;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ forecast, currencySymbol }) => {
  if (!forecast.available || forecast.historicalAndFitted.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-sm text-slate-600">
        {forecast.unavailableReason || 'Insufficient monthly observations for forecasting.'}
      </div>
    );
  }

  const lastHistorical =
    forecast.historicalAndFitted[forecast.historicalAndFitted.length - 2]?.label;

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={forecast.historicalAndFitted}
          margin={{ top: 12, right: 20, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#475569', fontSize: 12 }}
            axisLine={{ stroke: '#CBD5E1' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#475569', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCurrencyValue(Number(v), currencySymbol, true)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
              fontSize: '12px',
            }}
            formatter={(value: unknown, name: unknown) => {
              const nameStr = String(name ?? '');
              if (value === null || value === undefined) return ['—', nameStr];
              const labelMap: Record<string, string> = {
                actualRevenue: 'Historical Actual Revenue',
                fittedRevenue: 'Projected Sales Trend',
                upperBound: 'Upper Estimate Bound',
                lowerBound: 'Lower Estimate Bound',
              };
              return [
                formatCurrencyValue(Number(value), currencySymbol),
                labelMap[nameStr] || nameStr,
              ];
            }}
          />
          <Legend
            verticalAlign="top"
            height={32}
            formatter={(value) => (
              <span className="text-xs font-medium text-slate-700">
                {value === 'actualRevenue'
                  ? 'Historical Actual Revenue'
                  : 'Projected Trend & Next-Month Estimate'}
              </span>
            )}
          />
          {lastHistorical && (
            <ReferenceLine
              x={lastHistorical}
              stroke="#94A3B8"
              strokeDasharray="4 4"
              label={{
                value: 'Forecast Horizon →',
                position: 'insideTopRight',
                fill: '#475569',
                fontSize: 11,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="actualRevenue"
            stroke="#0F172A"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#0F172A' }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="fittedRevenue"
            stroke="#4F46E5"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: '#4F46E5' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
