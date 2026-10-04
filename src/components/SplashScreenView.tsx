import React from 'react';
import { Activity, ShieldCheck, Sparkles } from 'lucide-react';

interface SplashScreenViewProps {
  statusText?: string;
  isExiting?: boolean;
}

export const SplashScreenView: React.FC<SplashScreenViewProps> = ({
  statusText = 'Initializing InsightX Analytics Engine...',
  isExiting = false,
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 px-6 text-white transition-opacity duration-500 ${
        isExiting ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center text-center">
        {/* Brand Icon */}
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 shadow-2xl shadow-indigo-500/30">
          <Activity className="h-10 w-10 text-white" />
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 border-2 border-slate-950">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          </div>
        </div>

        {/* Brand Title */}
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Insight<span className="text-indigo-400">X</span>
        </h1>
        <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-indigo-300">
          AI Data Analyst
        </p>

        {/* Guiding Principle */}
        <div className="mt-6 flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3.5 py-1 text-xs text-slate-300">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Compute first. Explain second.</span>
        </div>

        {/* Loading Spinner & Status */}
        <div className="mt-12 flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="font-mono text-xs text-slate-400">{statusText}</p>
        </div>
      </div>

      <div className="absolute bottom-6 text-center text-[11px] text-slate-600">
        Enterprise-grade deterministic business intelligence for SMBs
      </div>
    </div>
  );
};
