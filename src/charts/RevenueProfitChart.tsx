import React from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrencyValue } from '../services/api';
import { MonthlyMetricPoint } from '../types/analytics';

interface RevenueProfitChartProps {
  data: MonthlyMetricPoint[];
  currencySymbol: string;
  hasProfit: boolean;
}

export const RevenueProfitChart: React.FC<RevenueProfitChartProps> = ({
  data,
  currencySymbol,
  hasProfit,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-sm text-slate-500">
        No monthly time-series data available in this dataset.
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 16, left: 8, bottom: 4 }}>
          <defs>
            <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
            </linearGradient>
          </defs>
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
            formatter={(value: unknown, name: unknown) => [
              formatCurrencyValue(Number(value), currencySymbol),
              String(name) === 'revenue' ? 'Revenue' : 'Profit',
            ]}
          />
          <Legend
            verticalAlign="top"
            height={32}
            formatter={(value) => (
              <span className="text-xs font-medium text-slate-700">
                {value === 'revenue' ? 'Monthly Revenue' : 'Monthly Profit'}
              </span>
            )}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#4F46E5"
            strokeWidth={2.5}
            fill="url(#revGradient)"
            activeDot={{ r: 5, fill: '#4F46E5' }}
          />
          {hasProfit && (
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#0D9488"
              strokeWidth={2.2}
              dot={{ r: 3.5, fill: '#0D9488' }}
              activeDot={{ r: 5, fill: '#0D9488' }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
