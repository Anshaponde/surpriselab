import {
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  DownloadCloud,
  Loader2,
  Play,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';
import {
  clampProb,
  createTokenId,
  formatSmallProbability,
  getSurpriseStyle,
  type TokenItem,
} from '../lib/perplexity';
import type {
  LoadProgressState,
  ModelEvaluationResult,
} from '../model/distilgpt2Engine';

interface RealModelSectionProps {
  onSendToPlayground: (sentence: string, tokens: TokenItem[]) => void;
}

const QUICK_TESTS: { label: string; text: string; tag: string }[] = [
  {
    label: 'The capital of France is Paris',
    text: 'The capital of France is Paris',
    tag: 'Factual & predictable',
  },
  {
    label: 'Colorless green ideas sleep furiously',
    text: 'Colorless green ideas sleep furiously',
    tag: 'Grammatical nonsense',
  },
  {
    label: 'The quick brown fox jumps over the lazy dog',
    text: 'The quick brown fox jumps over the lazy dog',
    tag: 'Classic pangram',
  },
  {
    label: 'Quantum pancakes orbit noisy calculators',
    text: 'Quantum pancakes orbit noisy calculators',
    tag: 'Surreal surprise',
  },
];

function formatMb(bytes: number): string {
  if (!bytes || bytes <= 0) return '0.0 MB';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function RealModelSection({ onSendToPlayground }: RealModelSectionProps) {
  const [inputText, setInputText] = useState('The capital of France is Paris');
  const [progress, setProgress] = useState<LoadProgressState>({
    status: 'idle',
    percent: 0,
    loadedBytes: 0,
    totalBytes: 0,
    currentFile: '',
    message: 'Click "Score with DistilGPT-2" to download & run the quantized ONNX model (~30 MB, cached locally).',
  });
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ModelEvaluationResult | null>(null);
  const { ref, isVisible } = useRevealOnScroll();

  const runEvaluation = async (overrideText?: string) => {
    const target = (overrideText ?? inputText).trim();
    if (!target) {
      setErrorMsg('Please enter a sentence first.');
      return;
    }
    if (overrideText !== undefined) {
      setInputText(overrideText);
    }

    setErrorMsg(null);
    setIsRunning(true);

    try {
      const { evaluateTextWithDistilGpt2 } = await import('../model/distilgpt2Engine');
      const evalResult = await evaluateTextWithDistilGpt2(target, (state) => {
        setProgress(state);
      });
      setResult(evalResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to run DistilGPT-2 in browser.';
      setErrorMsg(msg);
      setProgress((prev) => ({
        ...prev,
        status: 'error',
        message: 'Could not load or run the model.',
      }));
    } finally {
      setIsRunning(false);
    }
  };

  const handleLoadIntoPlayground = () => {
    if (!result) return;
    const mappedTokens: TokenItem[] = result.tokens.map((t) => ({
      id: createTokenId(),
      text: t.token.trim() || t.displayToken,
      prob: clampProb(t.prob),
    }));
    onSendToPlayground(result.text, mappedTokens);
  };

  return (
    <section
      id="real-model"
      ref={ref}
      className={`reveal-block ${isVisible ? 'is-visible' : ''} scroll-mt-24 space-y-6`}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-lime-600 dark:text-lime-300">
            <Cpu className="h-3.5 w-3.5" />
            <span>In-Browser Neural Inference (ONNX + WebAssembly)</span>
          </div>
          <h2 className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            Real AI Model: DistilGPT-2
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Run a real 82M-parameter transformer directly in your browser tab via{' '}
            <code className="font-mono-num text-xs">@huggingface/transformers</code>. No server, no API key — weights (~30 MB quantized) are cached after first download.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-lime-500/30 bg-lime-500/10 px-3 py-1 text-xs font-medium text-lime-700 dark:text-lime-300">
          {progress.status === 'ready' ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Model cached &amp; ready
            </>
          ) : (
            <>
              <DownloadCloud className="h-3.5 w-3.5" />
              On-demand ~30 MB download
            </>
          )}
        </div>
      </div>

      {/* Input + Progress Card */}
      <div className="aurora-card aurora-card-glow rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void runEvaluation();
              }
            }}
            placeholder="Enter a sentence to score with DistilGPT-2..."
            aria-label="Sentence for DistilGPT-2 perplexity evaluation"
            className="flex-1 rounded-xl border border-slate-300 bg-white/90 px-4 py-3 text-sm text-slate-900 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/30 dark:border-slate-700 dark:bg-[#070c1c] dark:text-white sm:text-base"
          />
          <button
            type="button"
            disabled={isRunning}
            onClick={() => void runEvaluation()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lime-400 to-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-lime-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {progress.status === 'loading' ? 'Loading Model…' : 'Scoring…'}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                Score with DistilGPT-2
              </>
            )}
          </button>
        </div>

        {/* Quick-test chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Quick tests:
          </span>
          {QUICK_TESTS.map((qt) => (
            <button
              key={qt.label}
              type="button"
              disabled={isRunning}
              onClick={() => void runEvaluation(qt.text)}
              className="group inline-flex items-center gap-1.5 rounded-full border border-slate-300/90 bg-slate-100/80 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-lime-400/60 hover:text-lime-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-lime-400/50 dark:hover:text-lime-300"
            >
              <span>“{qt.label}”</span>
              <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {qt.tag}
              </span>
            </button>
          ))}
        </div>

        {/* Model Download / Status Progress Bar */}
        <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/75 p-3.5 dark:border-slate-800 dark:bg-[#070c1c]/80">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {progress.message}
            </span>
            <span className="font-mono-num text-slate-500 dark:text-slate-400">
              {progress.status === 'loading' && progress.totalBytes > 0
                ? `${formatMb(progress.loadedBytes)} / ${formatMb(progress.totalBytes)} (${progress.percent.toFixed(0)}%)`
                : progress.status === 'ready'
                  ? '100% cached'
                  : 'Idle'}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 via-lime-400 to-amber-400 transition-all duration-300"
              style={{
                width: `${progress.status === 'ready' ? 100 : progress.percent}%`,
              }}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-2.5 text-xs font-medium text-orange-700 dark:text-orange-300">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Results Area */}
      {result && (
        <div className="space-y-5">
          {/* Summary strip + Load into Playground CTA */}
          <div className="aurora-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  DistilGPT-2 Perplexity
                </div>
                <div className="font-mono-num text-3xl font-bold text-lime-600 dark:text-lime-300">
                  {result.perplexity >= 100
                    ? result.perplexity.toFixed(1)
                    : result.perplexity.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Cross-Entropy
                </div>
                <div className="font-mono-num text-lg font-semibold text-slate-900 dark:text-white">
                  {result.crossEntropyBits.toFixed(3)} bits{' '}
                  <span className="text-xs font-normal text-slate-400">
                    ({result.crossEntropyNats.toFixed(3)} nats)
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  BPE Tokens / Latency
                </div>
                <div className="font-mono-num text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {result.tokens.length} tokens · {result.elapsedMs} ms
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLoadIntoPlayground}
              className="inline-flex items-center gap-2 rounded-xl border border-teal-400/60 bg-teal-500/15 px-4 py-2.5 text-xs font-semibold text-teal-700 shadow-sm transition hover:bg-teal-500/25 dark:text-teal-200"
            >
              <Sparkles className="h-4 w-4 text-teal-400" />
              Load into Playground
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-12">
            {/* Token Table */}
            <div className="aurora-card overflow-hidden rounded-2xl p-5 lg:col-span-7">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Token-by-Token Probabilities
                </h3>
                <span className="text-[11px] text-slate-400">
                  Conditioned from <code className="font-mono-num">&lt;|endoftext|&gt;</code>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono-num text-xs">
                  <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="py-2 pr-3">Token</th>
                      <th className="px-3 py-2">Probability</th>
                      <th className="px-3 py-2">1/P</th>
                      <th className="py-2 pl-3">NLL (nats / bits)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                    {result.tokens.map((tok) => {
                      const style = getSurpriseStyle(tok.prob);
                      return (
                        <tr key={`${tok.index}_${tok.tokenId}`} className="hover:bg-teal-500/5">
                          <td className="py-2 pr-3">
                            <span
                              style={{
                                backgroundColor: style.bgRgba,
                                borderColor: style.borderRgba,
                              }}
                              className="inline-block rounded-md border px-2 py-0.5 font-semibold text-slate-900 dark:text-white"
                            >
                              {tok.displayToken}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-teal-600 dark:text-teal-300">
                            {formatSmallProbability(tok.prob)}
                          </td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                            {tok.invProb >= 1000
                              ? tok.invProb.toExponential(1)
                              : tok.invProb.toFixed(2)}
                          </td>
                          <td className="py-2 pl-3 text-amber-600 dark:text-amber-300">
                            {tok.nllNats.toFixed(3)}{' '}
                            <span className="text-slate-400">/ {tok.nllBits.toFixed(2)} b</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top 8 Next-Token Predictions */}
            <div className="aurora-card rounded-2xl p-5 lg:col-span-5">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Top 8 Next-Token Predictions
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Softmax distribution for what DistilGPT-2 expects right after your sentence.
              </p>

              <div className="mt-4 space-y-2.5">
                {result.nextTokenPredictions.map((pred, idx) => {
                  const pct = pred.prob * 100;
                  const topProb = result.nextTokenPredictions[0]?.prob || 1;
                  const barWidth = Math.max(4, (pred.prob / topProb) * 100);
                  return (
                    <div key={`${pred.tokenId}_${idx}`} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono-num font-semibold text-slate-800 dark:text-slate-100">
                          <span className="mr-1.5 text-slate-400">#{idx + 1}</span>
                          {pred.displayToken || '␣'}
                        </span>
                        <span className="font-mono-num text-teal-600 dark:text-teal-300">
                          {pct >= 0.1 ? `${pct.toFixed(2)}%` : `${pct.toExponential(1)}%`}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-400 via-lime-400 to-amber-400 transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default RealModelSection;
