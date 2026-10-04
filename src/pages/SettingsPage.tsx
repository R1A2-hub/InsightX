import React from 'react';
import { Layers, ShieldAlert } from 'lucide-react';
import { DatasetAnalysisBundle } from '../types/analytics';

interface SettingsPageProps {
  bundle: DatasetAnalysisBundle | null;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ bundle }) => {
  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Architecture & Analytical Guardrails
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          InsightX enforces strict separation between deterministic business computation and AI language explanation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">
              6-Layer Application Architecture
            </h2>
          </div>
          <ol className="mt-4 space-y-3 text-xs text-slate-600">
            <li>
              <strong className="text-slate-900">1. Frontend Layer:</strong> React, TypeScript, Tailwind CSS, and Recharts interactive BI workspace.
            </li>
            <li>
              <strong className="text-slate-900">2. API Layer:</strong> REST endpoints handling multipart CSV/XLSX ingestion, validation, and structured queries.
            </li>
            <li>
              <strong className="text-slate-900">3. Data Processing Layer:</strong> Alias normalization, deduplication, median numeric imputation, and ISO date parsing.
            </li>
            <li>
              <strong className="text-slate-900">4. Deterministic Analytics Engine:</strong> Exact KPI aggregation, product/category/region rankings, IQR anomaly detection, and OLS linear regression forecasting.
            </li>
            <li>
              <strong className="text-slate-900">5. Evidence Builder:</strong> Packages verified numerical outputs, source columns, and formulas into immutable Evidence objects.
            </li>
            <li>
              <strong className="text-slate-900">6. AI Explanation Layer:</strong> Isolated Google Gemini service that translates trusted Evidence into concise English or Hinglish narratives.
            </li>
          </ol>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">
              AI Prompt Safety & Anti-Hallucination Rules
            </h2>
          </div>
          <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
            <li>· Evidence is treated strictly as DATA, never as instructions.</li>
            <li>· The AI model never invents, estimates, or recalculates business numbers.</li>
            <li>· Unavailable metrics (such as missing Cost/Profit) are explicitly blocked from fabrication.</li>
            <li>· Historical values and Linear Regression forecasts are strictly separated.</li>
            <li>· All forecasts carry the mandatory label: "Estimate — not a guarantee."</li>
            <li>· Full deterministic analytics remain operational even if the LLM service is unreachable.</li>
          </ul>

          {bundle && (
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
              <p className="font-semibold text-slate-900">Active Session Summary</p>
              <p className="mt-1 text-slate-600">
                Dataset: {bundle.quality.filename} · {bundle.evidenceList.length} verified Evidence objects in memory.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
