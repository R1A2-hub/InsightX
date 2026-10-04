import React, { useEffect, useState } from 'react';
import { Code2, MessageSquare, Send } from 'lucide-react';
import { apiService, formatCurrencyValue } from '../services/api';
import { ChatResponsePayload, DatasetAnalysisBundle } from '../types/analytics';

interface AnalystChatPageProps {
  bundle: DatasetAnalysisBundle;
  initialQuestion?: string | null;
  onClearInitialQuestion?: () => void;
}

const ENGLISH_EXAMPLES = [
  'Which product generated the most revenue?',
  'What was our total profit?',
  'Why did revenue decrease?',
  'Which region performed best?',
  'How much revenue can we expect next month?',
  'North vs South revenue?',
  'Compare Laptop and Mouse.',
  'Which category had higher profit?',
];

const HINGLISH_EXAMPLES = [
  'which product sabse zyada revenue laaya?',
  'profit kitna hua bhai?',
  'north ya south me se konsa better perform krha h?',
  'next month sales kitni ho skti h?',
];

export const AnalystChatPage: React.FC<AnalystChatPageProps> = ({
  bundle,
  initialQuestion,
  onClearInitialQuestion,
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatResponsePayload[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openEvidenceIndex, setOpenEvidenceIndex] = useState<number | null>(null);

  const cur = bundle.kpis.currencySymbol || '₹';

  const handleAsk = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isAsking) return;
    setIsAsking(true);
    setError(null);
    setInput('');

    try {
      const res = await apiService.askAnalystQuestion(trimmed, bundle.datasetId);
      setHistory((prev) => [...prev, res]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process question.');
    } finally {
      setIsAsking(false);
    }
  };

  useEffect(() => {
    if (initialQuestion) {
      handleAsk(initialQuestion);
      if (onClearInitialQuestion) onClearInitialQuestion();
    }
  }, [initialQuestion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(input);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Conversational AI Analyst
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Ask business questions in English, Hinglish, or casual language. Metrics are calculated deterministically first, then explained from structured Evidence.
          </p>
        </div>
        <div className="text-xs text-slate-500">
          Dataset: <strong className="text-slate-800">{bundle.quality.filename}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-900">
            English Questions
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {ENGLISH_EXAMPLES.map((q) => (
              <button
                key={q}
                type="button"
                disabled={isAsking}
                onClick={() => handleAsk(q)}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-xs text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-900">
            Hinglish & Casual Questions
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {HINGLISH_EXAMPLES.map((q) => (
              <button
                key={q}
                type="button"
                disabled={isAsking}
                onClick={() => handleAsk(q)}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-xs text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        {history.length === 0 && !isAsking ? (
          <div className="py-12 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
            <h2 className="mt-3 text-sm font-semibold text-slate-900">
              Ask a question about {bundle.quality.filename}
            </h2>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
              Select any example question above or type your own question below. Every answer includes deterministic calculations, intent parsing, and verifiable Evidence objects.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((turn, idx) => (
              <div
                key={idx}
                className="space-y-3 border-b border-slate-100 pb-6 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-medium text-white">
                    {turn.question}
                  </div>
                  <div className="text-right font-mono text-[11px] text-slate-500">
                    intent: <strong className="text-slate-800">{turn.parsedIntent.intent}</strong> · metric:{' '}
                    <strong className="text-slate-800">{turn.parsedIntent.metric}</strong>
                    {turn.parsedIntent.dimension && (
                      <>
                        {' '}
                        · dim: <strong className="text-slate-800">{turn.parsedIntent.dimension}</strong>
                      </>
                    )}{' '}
                    · capability: <strong className="text-indigo-600">{turn.capabilityStatus}</strong>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-sm leading-relaxed text-slate-900">
                    {turn.aiExplanation}
                  </p>

                  {turn.comparison && (
                    <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-4">
                      <div>
                        <p className="text-[11px] text-slate-500">
                          {turn.comparison.itemA.name}
                        </p>
                        <p className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                          {turn.comparison.metric === 'quantity'
                            ? turn.comparison.itemA.value.toLocaleString()
                            : formatCurrencyValue(turn.comparison.itemA.value, cur)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">
                          {turn.comparison.itemB.name}
                        </p>
                        <p className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                          {turn.comparison.metric === 'quantity'
                            ? turn.comparison.itemB.value.toLocaleString()
                            : formatCurrencyValue(turn.comparison.itemB.value, cur)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">Difference</p>
                        <p className="font-mono text-sm font-bold text-indigo-700 tabular-nums">
                          {turn.comparison.metric === 'quantity'
                            ? turn.comparison.difference.toLocaleString()
                            : formatCurrencyValue(turn.comparison.difference, cur)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">Winner</p>
                        <p className="text-sm font-bold text-emerald-700">
                          {turn.comparison.winner}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-2.5 text-xs text-slate-500">
                    <span className="font-mono text-[11px]">
                      Engine Output: {turn.deterministicAnswer}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenEvidenceIndex(openEvidenceIndex === idx ? null : idx)
                      }
                      className="flex items-center gap-1 font-semibold text-indigo-600 hover:underline whitespace-nowrap"
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      <span>
                        {openEvidenceIndex === idx
                          ? 'Hide Evidence Object'
                          : `View Evidence (${turn.evidence.length})`}
                      </span>
                    </button>
                  </div>

                  {openEvidenceIndex === idx && (
                    <pre className="mt-2.5 overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-slate-100">
                      {JSON.stringify(
                        {
                          parsed_intent: turn.parsedIntent,
                          evidence: turn.evidence,
                        },
                        null,
                        2
                      )}
                    </pre>
                  )}
                </div>

                {turn.suggestedFollowUps.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Follow-up:</span>
                    {turn.suggestedFollowUps.map((f) => (
                      <button
                        key={f}
                        type="button"
                        disabled={isAsking}
                        onClick={() => handleAsk(f)}
                        className="rounded border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isAsking && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                Computing deterministic metrics → Building Evidence object → Generating explanation...
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex items-center gap-3 border-t border-slate-200 pt-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isAsking}
            placeholder="Ask in English or Hinglish (e.g., 'North vs South revenue?' or 'profit kitna hua bhai?')..."
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isAsking || !input.trim()}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Ask Analyst</span>
          </button>
        </form>
      </div>
    </div>
  );
};
