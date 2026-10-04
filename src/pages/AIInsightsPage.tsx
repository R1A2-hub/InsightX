import React, { useState } from 'react';
import { AlertTriangle, Code2 } from 'lucide-react';
import { formatCurrencyValue } from '../services/api';
import { DatasetAnalysisBundle } from '../types/analytics';

interface AIInsightsPageProps {
  bundle: DatasetAnalysisBundle;
}

export const AIInsightsPage: React.FC<AIInsightsPageProps> = ({ bundle }) => {
  const { insights, anomalies, kpis, llmStatus } = bundle;
  const cur = kpis.currencySymbol || '₹';
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            AI Business Insights & Evidence Engine
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Every insight is generated from trusted mathematical Evidence objects computed by the analytics engine.
          </p>
        </div>
        <div className="text-xs text-slate-500">
          <span>Principle: Compute First · Explain Second</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {insights.map((ins) => {
          const isExpanded = expandedEvidenceId === ins.id;
          return (
            <div
              key={ins.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium text-indigo-600">
                    {ins.sourceMetric}
                  </span>
                  <span>
                    Confidence: <strong className="text-slate-800">{ins.confidence}</strong>
                  </span>
                </div>

                <h2 className="mt-2 text-base font-bold text-slate-900">
                  {ins.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {ins.explanation}
                </p>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500">
                    Formula: {ins.evidence.formula}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedEvidenceId(isExpanded ? null : ins.id)
                    }
                    className="flex items-center gap-1 font-semibold text-indigo-600 hover:underline"
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    <span>{isExpanded ? 'Hide Evidence JSON' : 'Inspect Evidence'}</span>
                  </button>
                </div>

                {isExpanded && (
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-3.5 font-mono text-[11px] leading-relaxed text-slate-100">
                    {JSON.stringify(ins.evidence, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Deterministic Anomaly Detection (IQR Method)
            </h2>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            {anomalies.length} unusual record(s) identified
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Outliers are identified strictly via Interquartile Range thresholds ([Q1 − 1.5×IQR, Q3 + 1.5×IQR]). Gemini never decides mathematical anomalies.
        </p>

        {anomalies.length === 0 ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-600">
            No unusual revenue values detected outside the expected IQR statistical range.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-2.5 font-medium">Date / Period</th>
                  <th className="pb-2.5 text-right font-medium">Actual Revenue</th>
                  <th className="pb-2.5 text-right font-medium">Expected IQR Range</th>
                  <th className="pb-2.5 pl-4 font-medium">Why It Is Considered Unusual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {anomalies.map((anom) => (
                  <tr key={anom.id} className="hover:bg-slate-50">
                    <td className="py-3 font-mono font-semibold text-slate-900 tabular-nums">
                      {anom.date}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-amber-700 tabular-nums">
                      {formatCurrencyValue(anom.revenue, cur)}
                    </td>
                    <td className="py-3 text-right font-mono text-slate-600 tabular-nums">
                      {formatCurrencyValue(anom.expectedRange.lower, cur)} –{' '}
                      {formatCurrencyValue(anom.expectedRange.upper, cur)}
                    </td>
                    <td className="py-3 pl-4 text-slate-700">
                      <p>{anom.reason}</p>
                      {anom.topContributor && (
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Primary contributor: {anom.topContributor}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
