import React, { useState } from 'react';
import {
  Bell,
  Database,
  Menu,
  Search,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react';
import { formatCurrencyValue } from '../services/api';
import { DatasetAnalysisBundle, DatasetListItem, NavSection } from '../types/analytics';

interface TopBarProps {
  bundle: DatasetAnalysisBundle | null;
  datasets: DatasetListItem[];
  onSwitchDataset: (datasetId: string) => void;
  onNavigate: (section: NavSection) => void;
  onTriggerSample: (sampleId?: string) => void;
  isLoading: boolean;
  onOpenMobileMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  bundle,
  datasets,
  onSwitchDataset,
  onNavigate,
  onTriggerSample,
  isLoading,
  onOpenMobileMenu,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const cur = bundle?.kpis.currencySymbol || '₹';

  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !bundle) return [];
    const results: Array<{
      type: string;
      title: string;
      detail: string;
      targetSection: NavSection;
    }> = [];

    for (const p of bundle.productAnalysis) {
      if (p.name.toLowerCase().includes(q)) {
        results.push({
          type: 'Product',
          title: p.name,
          detail: `Rank #${p.rank} · ${formatCurrencyValue(p.revenue, cur)} (${p.contributionPct}%)`,
          targetSection: 'analytics',
        });
      }
    }
    for (const c of bundle.categoryAnalysis) {
      if (c.name.toLowerCase().includes(q)) {
        results.push({
          type: 'Category',
          title: c.name,
          detail: `Rank #${c.rank} · ${formatCurrencyValue(c.revenue, cur)} (${c.contributionPct}%)`,
          targetSection: 'analytics',
        });
      }
    }
    for (const r of bundle.regionalAnalysis) {
      if (r.name.toLowerCase().includes(q)) {
        results.push({
          type: 'Region',
          title: r.name,
          detail: `Rank #${r.rank} · ${formatCurrencyValue(r.revenue, cur)} (${r.contributionPct}%)`,
          targetSection: 'analytics',
        });
      }
    }
    for (const ins of bundle.insights) {
      if (
        ins.title.toLowerCase().includes(q) ||
        ins.explanation.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Insight',
          title: ins.title,
          detail: ins.sourceMetric,
          targetSection: 'insights',
        });
      }
    }
    return results.slice(0, 6);
  }, [searchQuery, bundle, cur]);

  const notifications = React.useMemo(() => {
    if (!bundle) return [];
    const list: Array<{ title: string; detail: string; target: NavSection }> = [];
    if (bundle.anomalies.length > 0) {
      list.push({
        title: `${bundle.anomalies.length} Revenue Anomaly Detected`,
        detail: `${bundle.anomalies[0].date}: ${formatCurrencyValue(bundle.anomalies[0].revenue, cur)}`,
        target: 'insights',
      });
    }
    if (bundle.quality.capabilities.cost.status === 'Unavailable') {
      list.push({
        title: 'Profit Metric Unavailable',
        detail: 'Cost column is missing in current dataset.',
        target: 'quality',
      });
    }
    if (bundle.quality.cleaningActions.length > 0) {
      list.push({
        title: `${bundle.quality.cleaningActions.length} Automated Cleaning Steps Applied`,
        detail: `${bundle.quality.cleanedRowCount.toLocaleString()} clean rows verified.`,
        target: 'quality',
      });
    }
    return list;
  }, [bundle, cur]);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <Database className="h-4 w-4 text-indigo-600 shrink-0" />
          <span className="hidden text-slate-500 sm:inline">Dataset:</span>
          {datasets.length > 0 && bundle ? (
            <select
              value={bundle.datasetId}
              onChange={(e) => onSwitchDataset(e.target.value)}
              className="max-w-[200px] truncate rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none sm:max-w-[260px]"
            >
              {datasets.map((d) => (
                <option key={d.datasetId} value={d.datasetId}>
                  {d.filename} ({d.cleanedRowCount} rows)
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-medium text-slate-500">
              No dataset loaded
            </span>
          )}
        </div>
      </div>

      <div className="relative hidden md:block md:w-72 lg:w-96">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              bundle
                ? 'Search products, regions, categories, insights...'
                : 'Load a dataset to search metrics...'
            }
            disabled={!bundle}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none disabled:opacity-60"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {searchQuery.trim() !== '' && (
          <div className="absolute left-0 right-0 top-full mt-1.5 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            {searchResults.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-500">
                No matching items for "{searchQuery}"
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onNavigate(res.targetSection);
                      setSearchQuery('');
                    }}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        {res.title}
                      </p>
                      <p className="font-mono text-[11px] text-slate-500 tabular-nums">
                        {res.type} · {res.detail}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {!bundle && (
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onTriggerSample('sample-enterprise')}
            className="hidden items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 sm:flex whitespace-nowrap"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Try Sample Dataset</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onNavigate('datasets')}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Upload Dataset</span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-600" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-semibold text-slate-900">
                  Dataset Alerts & Audit
                </span>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Close
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-500">
                  Upload or select a dataset to view audit notifications.
                </p>
              ) : (
                <div className="mt-2 divide-y divide-slate-100">
                  {notifications.map((n, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        onNavigate(n.target);
                        setShowNotifications(false);
                      }}
                      className="block w-full py-2.5 text-left hover:bg-slate-50 px-2 rounded"
                    >
                      <p className="text-xs font-semibold text-slate-900">
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{n.detail}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-left transition-colors hover:bg-slate-50"
          title="Analyst Profile & Settings"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white">
            <User className="h-3.5 w-3.5" />
          </div>
          <span className="hidden text-xs font-medium text-slate-700 lg:inline whitespace-nowrap">
            BI Analyst
          </span>
        </button>
      </div>
    </header>
  );
};
