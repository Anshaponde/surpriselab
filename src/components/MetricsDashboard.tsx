import {
  Activity,
  AlertTriangle,
  Binary,
  Gauge,
  Hash,
  Layers,
} from 'lucide-react';
import {
  formatJointInverse,
  formatJointProb,
  formatSmallProbability,
  interpretPerplexity,
  type PerplexityMetrics,
} from '../lib/perplexity';
import { AnimatedNumber } from './AnimatedNumber';

interface MetricsDashboardProps {
  metrics: PerplexityMetrics;
}

function formatPpl(ppl: number): string {
  if (!Number.isFinite(ppl)) return '∞';
  if (ppl >= 10000) return Math.round(ppl).toLocaleString();
  if (ppl >= 100) return ppl.toFixed(1);
  return ppl.toFixed(2);
}

export function MetricsDashboard({ metrics }: MetricsDashboardProps) {
  const interpretation = interpretPerplexity(metrics.perplexity, metrics.tokenCount);

  return (
    <section aria-label="Live metrics dashboard" className="mb-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_10px_#14B8A6]" />
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Live Metrics Dashboard
          </h2>
        </div>
        <span className={`text-xs font-semibold ${interpretation.colorClass}`}>
          Status: {interpretation.badge}
        </span>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Perplexity */}
        <div className="aurora-card aurora-card-glow rounded-2xl p-4 sm:col-span-2 lg:col-span-1 xl:col-span-1">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Perplexity (PPL)</span>
            <Gauge className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-2 font-mono-num text-3xl font-bold tracking-tight text-teal-600 dark:text-teal-300">
            <AnimatedNumber value={metrics.perplexity} formatter={formatPpl} />
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Effective branching factor
          </p>
        </div>

        {/* Cross-entropy */}
        <div className="aurora-card rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Cross-Entropy</span>
            <Binary className="h-4 w-4 text-lime-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-num text-2xl font-bold text-slate-900 dark:text-white">
              <AnimatedNumber value={metrics.crossEntropyBits} formatter={(v) => v.toFixed(3)} />
            </span>
            <span className="text-xs font-medium text-lime-600 dark:text-lime-300">bits/tok</span>
          </div>
          <div className="mt-1 font-mono-num text-xs text-slate-500 dark:text-slate-400">
            <AnimatedNumber value={metrics.crossEntropyNats} formatter={(v) => v.toFixed(4)} /> nats/tok
          </div>
        </div>

        {/* Joint probability & inverse */}
        <div className="aurora-card rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Sequence Joint P</span>
            <Layers className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 font-mono-num text-lg font-bold text-slate-900 dark:text-white">
            {formatJointProb(metrics.jointProb, metrics.logJointProb)}
          </div>
          <div className="mt-1 font-mono-num text-xs text-slate-500 dark:text-slate-400">
            1 / P ≈ {formatJointInverse(metrics.invJointProb, metrics.logJointProb)}
          </div>
        </div>

        {/* Average confidence */}
        <div className="aurora-card rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Avg Confidence (1/PPL)</span>
            <Activity className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-white">
            <AnimatedNumber
              value={metrics.avgConfidence * 100}
              formatter={(v) => `${v >= 10 ? v.toFixed(1) : v.toFixed(2)}%`}
            />
          </div>
          <div className="mt-1 font-mono-num text-xs text-slate-500 dark:text-slate-400">
            <AnimatedNumber value={metrics.avgConfidence} formatter={(v) => v.toFixed(4)} /> geom. mean P
          </div>
        </div>

        {/* Token count */}
        <div className="aurora-card rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Token Count</span>
            <Hash className="h-4 w-4 text-lime-400" />
          </div>
          <div className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.tokenCount}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {metrics.tokenCount === 1 ? '1 active token' : `${metrics.tokenCount} active tokens`}
          </p>
        </div>

        {/* Most surprising token */}
        <div className="aurora-card rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Most Surprising</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          {metrics.mostSurprising ? (
            <>
              <div className="mt-2 flex items-center gap-2">
                <span className="max-w-[130px] truncate rounded-lg border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 font-mono-num text-sm font-semibold text-amber-700 dark:text-amber-300">
                  {metrics.mostSurprising.text}
                </span>
              </div>
              <div className="mt-1 font-mono-num text-xs text-slate-500 dark:text-slate-400">
                P = {formatSmallProbability(metrics.mostSurprising.prob)} ({metrics.mostSurprising.nllBits.toFixed(2)} bits)
              </div>
            </>
          ) : (
            <div className="mt-2 text-sm text-slate-400">—</div>
          )}
        </div>
      </div>
    </section>
  );
}
