import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Globe,
  Layers,
  RefreshCw,
  Server,
  ShieldAlert,
  Smartphone,
  Wifi,
  XCircle,
} from 'lucide-react';
import {
  DEFAULT_PRODUCTION_API,
  getApiBaseUrl,
  setCustomApiBaseUrl,
} from '../services/api';
import { getClientPlatform } from '../services/androidService';
import { DatasetAnalysisBundle } from '../types/analytics';

interface SettingsPageProps {
  bundle: DatasetAnalysisBundle | null;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ bundle }) => {
  const platform = getClientPlatform();
  const currentBaseUrl = getApiBaseUrl();

  const [customUrlInput, setCustomUrlInput] = useState('');
  const [pingStatus, setPingStatus] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    latencyMs?: number;
    errorMsg?: string;
  }>({ status: 'idle' });

  useEffect(() => {
    const saved = localStorage.getItem('insightx_api_base_url') || '';
    setCustomUrlInput(saved);
  }, []);

  const handleTestConnection = async (targetUrl?: string) => {
    setPingStatus({ status: 'testing' });
    const urlToTest = (targetUrl !== undefined ? targetUrl : getApiBaseUrl()) || '';
    const startTime = performance.now();
    try {
      const res = await fetch(`${urlToTest}/api/datasets`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const latency = Math.round(performance.now() - startTime);
      if (res.ok) {
        setPingStatus({ status: 'success', latencyMs: latency });
      } else {
        setPingStatus({
          status: 'error',
          errorMsg: `HTTP ${res.status}: ${res.statusText}`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network unreachable';
      setPingStatus({ status: 'error', errorMsg: msg });
    }
  };

  const handleSaveCustomUrl = () => {
    setCustomApiBaseUrl(customUrlInput);
    handleTestConnection(customUrlInput.trim().replace(/\/+$/, ''));
  };

  const handleResetDefault = () => {
    setCustomUrlInput('');
    setCustomApiBaseUrl(null);
    handleTestConnection();
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Architecture & Client Settings
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          InsightX enforces centralized deterministic business computation, supporting both Web and Android clients.
        </p>
      </div>

      {/* Client & Connection Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {platform === 'android' ? (
                <Smartphone className="h-4 w-4 text-emerald-600" />
              ) : (
                <Globe className="h-4 w-4 text-indigo-600" />
              )}
              <h2 className="text-base font-semibold text-slate-900">
                Client Environment
              </h2>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                platform === 'android'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}
            >
              {platform === 'android' ? 'Android Native (Capacitor)' : 'Web Client'}
            </span>
          </div>

          <div className="mt-4 space-y-3 text-xs text-slate-600">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-medium text-slate-700">Application Name:</span>
              <span className="font-semibold text-slate-900">InsightX — AI Data Analyst</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-medium text-slate-700">Android Package ID:</span>
              <span className="font-mono text-slate-900">com.insightx.aidataanalyst</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-medium text-slate-700">Target Android SDK:</span>
              <span className="font-mono text-slate-900">API 36 (Android 15+)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700">Backend Principle:</span>
              <span className="font-semibold text-indigo-600">Shared Single Analytics Source</span>
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-slate-50 p-3.5 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Android Packaging Output:</p>
            <ul className="mt-1.5 space-y-1 font-mono text-[11px] text-slate-600">
              <li>· Debug APK: <code className="text-indigo-600">./gradlew assembleDebug</code></li>
              <li>· Release APK: <code className="text-indigo-600">./gradlew assembleRelease</code></li>
              <li>· Play Store AAB: <code className="text-indigo-600">./gradlew bundleRelease</code></li>
            </ul>
          </div>
        </div>

        {/* Backend Connection & API Endpoint */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Backend API Connection
              </h2>
            </div>
            <button
              type="button"
              onClick={() => handleTestConnection()}
              disabled={pingStatus.status === 'testing'}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3 w-3 ${
                  pingStatus.status === 'testing' ? 'animate-spin text-indigo-600' : ''
                }`}
              />
              <span>Test Connection</span>
            </button>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-700">
              Active API Base URL
            </label>
            <div className="mt-1 flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-800">
              <Wifi className="mr-2 h-3.5 w-3.5 text-slate-400" />
              <span className="truncate">
                {currentBaseUrl || '(Same-Origin / Relative /api)'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Default Cloud Backend:{' '}
              <span className="font-mono text-indigo-600">{DEFAULT_PRODUCTION_API}</span>
            </p>
          </div>

          {/* Test Status feedback */}
          {pingStatus.status === 'success' && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Backend is reachable and healthy (latency: <strong>{pingStatus.latencyMs}ms</strong>)
              </span>
            </div>
          )}
          {pingStatus.status === 'error' && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>
                Connection failed: {pingStatus.errorMsg || 'Could not connect to server'}
              </span>
            </div>
          )}

          {/* Custom Host Override for Android Emulator / Local Dev */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <label className="block text-xs font-medium text-slate-700">
              Custom API URL (for Android Emulator / Local Testing):
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                type="text"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="e.g. http://10.0.2.2:3000 or LAN IP"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveCustomUrl}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Apply
              </button>
              {customUrlInput && (
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6-Layer Architecture & Anti-Hallucination Guardrails */}
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
              <strong className="text-slate-900">1. Dual Client Layer:</strong> Responsive React SPA (Web) + Android Native App (Capacitor) sharing the identical user experience and contracts.
            </li>
            <li>
              <strong className="text-slate-900">2. API Layer:</strong> REST endpoints with CORS support handling multipart CSV/XLSX ingestion, validation, and structured queries.
            </li>
            <li>
              <strong className="text-slate-900">3. Data Processing Layer:</strong> Alias normalization, deduplication, median numeric imputation, and ISO date parsing.
            </li>
            <li>
              <strong className="text-slate-900">4. Deterministic Analytics Engine:</strong> Exact KPI aggregation, product/category/region rankings, IQR anomaly detection, and predictive trend projections.
            </li>
            <li>
              <strong className="text-slate-900">5. Evidence Builder:</strong> Packages verified numerical outputs, source columns, and formulas into immutable Evidence objects.
            </li>
            <li>
              <strong className="text-slate-900">6. AI Explanation Layer:</strong> Isolated Google Gemini 3.8 Flash service that translates trusted Evidence into concise English or Hinglish narratives.
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
            <li>· Historical values and predictive trend projections are strictly separated.</li>
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
