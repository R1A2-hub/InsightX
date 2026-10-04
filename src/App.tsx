import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { EmptyState } from './components/EmptyState';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { AIInsightsPage } from './pages/AIInsightsPage';
import { AnalystChatPage } from './pages/AnalystChatPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DashboardPage } from './pages/DashboardPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { ForecastsPage } from './pages/ForecastsPage';
import { SettingsPage } from './pages/SettingsPage';
import { apiService } from './services/api';
import {
  DatasetAnalysisBundle,
  DatasetListItem,
  NavSection,
  SamplePresetMeta,
} from './types/analytics';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [bundle, setBundle] = useState<DatasetAnalysisBundle | null>(null);
  const [datasets, setDatasets] = useState<DatasetListItem[]>([]);
  const [samples, setSamples] = useState<SamplePresetMeta[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [initialChatQuestion, setInitialChatQuestion] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ id: Date.now(), message, type });
  }, []);

  // Dismiss toast after 4.5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Initial data loading
  useEffect(() => {
    let isMounted = true;

    async function initApp() {
      setIsLoading(true);
      setError(null);
      try {
        const meta = await apiService.getDatasetsList();
        if (!isMounted) return;
        setDatasets(meta.datasets);
        setSamples(meta.samples);

        if (meta.activeDatasetId) {
          const activeRes = await apiService.getActiveDataset();
          if (isMounted && activeRes.bundle) {
            setBundle(activeRes.bundle);
            setIsLoading(false);
            return;
          }
        }

        // If no datasets exist yet on server, auto-load the rich demo dataset
        if (meta.datasets.length === 0) {
          try {
            const sampleRes = await apiService.loadSampleDataset('sample-enterprise');
            if (isMounted) {
              setBundle(sampleRes.bundle);
              const refreshed = await apiService.getDatasetsList();
              setDatasets(refreshed.datasets);
            }
          } catch (sampleErr) {
            console.warn('Auto sample load fallback:', sampleErr);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to initialize app';
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initApp();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUploadFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    showToast(`Analyzing ${file.name} through deterministic pipeline...`, 'info');
    try {
      const res = await apiService.uploadDatasetFile(file);
      setBundle(res.bundle);
      const meta = await apiService.getDatasetsList();
      setDatasets(meta.datasets);
      setActiveSection('dashboard');
      showToast(`Successfully processed ${file.name} (${res.bundle.quality.cleanedRowCount} rows)`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Dataset upload failed';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = async (sampleId: string = 'sample-enterprise') => {
    setIsProcessing(true);
    setError(null);
    showToast('Loading pre-computed SMB sample dataset...', 'info');
    try {
      const res = await apiService.loadSampleDataset(sampleId);
      setBundle(res.bundle);
      const meta = await apiService.getDatasetsList();
      setDatasets(meta.datasets);
      setActiveSection('dashboard');
      showToast('Sample dataset loaded & analyzed successfully', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load sample';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwitchDataset = async (datasetId: string) => {
    setIsProcessing(true);
    try {
      const res = await apiService.activateDataset(datasetId);
      setBundle(res.bundle);
      const meta = await apiService.getDatasetsList();
      setDatasets(meta.datasets);
      showToast(`Switched active dataset to ${res.bundle.quality.filename}`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to switch dataset';
      showToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteDataset = async (datasetId: string) => {
    try {
      const res = await apiService.deleteDataset(datasetId);
      setBundle(res.bundle);
      setDatasets(res.datasets);
      showToast('Dataset removed', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete dataset';
      showToast(msg, 'error');
    }
  };

  const handleQuickAsk = (question: string) => {
    setInitialChatQuestion(question);
    setActiveSection('chat');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 antialiased">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 text-xs font-medium shadow-lg backdrop-blur-sm transition-all duration-200 ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50/95 text-emerald-900'
              : toast.type === 'error'
              ? 'border-rose-200 bg-rose-50/95 text-rose-900'
              : 'border-indigo-200 bg-indigo-50/95 text-indigo-900'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />}
          {toast.type === 'info' && <Loader2 className="h-4 w-4 text-indigo-600 animate-spin shrink-0" />}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label="Dismiss toast"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Global Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-[2px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col items-center max-w-sm text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent mb-4" />
            <h3 className="text-sm font-semibold text-slate-900">Deterministic Analytics Pipeline Running</h3>
            <p className="mt-1 text-xs text-slate-500">
              Validating columns, cleaning rows, deriving metrics, running IQR anomalies & OLS regression...
            </p>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={(section) => {
          setActiveSection(section);
          setMobileOpen(false);
        }}
        hasActiveDataset={Boolean(bundle)}
        anomalyCount={bundle?.anomalies.length || 0}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main App Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          bundle={bundle}
          datasets={datasets}
          onSwitchDataset={handleSwitchDataset}
          onNavigate={setActiveSection}
          onTriggerSample={handleLoadSample}
          isLoading={isProcessing || isLoading}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex h-96 flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <p className="text-xs text-slate-500 font-mono">Initializing InsightX Analytics Engine...</p>
            </div>
          ) : !bundle && activeSection !== 'datasets' ? (
            <EmptyState
              onUploadFile={handleUploadFile}
              onLoadSample={handleLoadSample}
              isLoading={isProcessing}
              error={error}
            />
          ) : (
            <>
              {activeSection === 'dashboard' && bundle && (
                <DashboardPage
                  bundle={bundle}
                  onNavigate={setActiveSection}
                  onQuickAsk={handleQuickAsk}
                />
              )}

              {activeSection === 'datasets' && (
                <DatasetsPage
                  bundle={bundle}
                  datasets={datasets}
                  samples={samples}
                  onUploadFile={handleUploadFile}
                  onLoadSample={handleLoadSample}
                  onActivateDataset={handleSwitchDataset}
                  onDeleteDataset={handleDeleteDataset}
                  onNavigate={setActiveSection}
                  isLoading={isProcessing}
                  error={error}
                />
              )}

              {activeSection === 'analytics' && bundle && (
                <AnalyticsPage bundle={bundle} />
              )}

              {activeSection === 'insights' && bundle && (
                <AIInsightsPage bundle={bundle} />
              )}

              {activeSection === 'chat' && bundle && (
                <AnalystChatPage
                  bundle={bundle}
                  initialQuestion={initialChatQuestion}
                  onClearInitialQuestion={() => setInitialChatQuestion(null)}
                />
              )}

              {activeSection === 'forecasts' && bundle && (
                <ForecastsPage bundle={bundle} />
              )}

              {activeSection === 'quality' && bundle && (
                <DataQualityPage bundle={bundle} />
              )}

              {activeSection === 'settings' && (
                <SettingsPage bundle={bundle} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
