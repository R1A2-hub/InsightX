import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrencyValue } from '../services/api';
import { DimensionAnalysisRow } from '../types/analytics';

interface DimensionBarChartProps {
  data: DimensionAnalysisRow[];
  activeMetric: 'revenue' | 'profit' | 'quantity';
  currencySymbol: string;
}

const BAR_COLORS = ['#4F46E5', '#2563EB', '#0284C7', '#0D9488', '#475569', '#64748B', '#94A3B8'];

export const DimensionBarChart: React.FC<DimensionBarChartProps> = ({
  data,
  activeMetric,
  currencySymbol,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-sm text-slate-500">
        No breakdown records available.
      </div>
    );
  }

  const sorted = [...data]
    .sort((a, b) => {
      const va = activeMetric === 'profit' ? a.profit ?? 0 : activeMetric === 'quantity' ? a.quantity : a.revenue;
      const vb = activeMetric === 'profit' ? b.profit ?? 0 : activeMetric === 'quantity' ? b.quantity : b.revenue;
      return vb - va;
    })
    .slice(0, 8);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 20, left: 16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#475569', fontSize: 11 }}
            axisLine={{ stroke: '#CBD5E1' }}
            tickLine={false}
            tickFormatter={(v) =>
              activeMetric === 'quantity'
                ? Number(v).toLocaleString()
                : formatCurrencyValue(Number(v), currencySymbol, true)
            }
          />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            tick={{ fill: '#0F172A', fontSize: 12, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
              fontSize: '12px',
            }}
            formatter={(value: unknown) => [
              activeMetric === 'quantity'
                ? `${Number(value).toLocaleString()} units`
                : formatCurrencyValue(Number(value), currencySymbol),
              activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1),
            ]}
          />
          <Bar dataKey={activeMetric} radius={[0, 4, 4, 0]} barSize={20}>
            {sorted.map((entry, idx) => (
              <Cell key={entry.name} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
