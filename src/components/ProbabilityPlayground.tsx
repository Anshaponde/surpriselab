import {
  ChevronDown,
  ChevronUp,
  Equal,
  MessageSquareText,
  Percent,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';
import {
  buildTokenItems,
  clampProb,
  computeInitialProbs,
  createTokenId,
  formatJointInverse,
  formatJointProb,
  formatSmallProbability,
  getSurpriseStyle,
  interpretPerplexity,
  PRESET_SCENARIOS,
  SAMPLE_SENTENCES,
  tokenizeText,
  type InitMode,
  type PerplexityMetrics,
  type TokenItem,
} from '../lib/perplexity';
import { ImportModal } from './ImportModal';

interface ProbabilityPlaygroundProps {
  sentence: string;
  tokens: TokenItem[];
  initMode: InitMode;
  metrics: PerplexityMetrics;
  isDark: boolean;
  onSentenceChange: (sentence: string, nextTokens: TokenItem[]) => void;
  onTokensChange: (nextTokens: TokenItem[]) => void;
  onInitModeChange: (mode: InitMode, nextTokens: TokenItem[]) => void;
}

const INIT_MODES: { id: InitMode; label: string; hint: string }[] = [
  { id: 'even', label: 'Even (0.5)', hint: 'All tokens at 50%' },
  { id: 'high', label: 'High (0.8)', hint: 'Confident predictions' },
  { id: 'uniform', label: 'Uniform (1/N)', hint: 'Equal 1/N chance' },
  { id: 'gradient', label: 'Smart Gradient', hint: 'Context builds left→right' },
];

export function ProbabilityPlayground({
  sentence,
  tokens,
  initMode,
  metrics,
  isDark,
  onSentenceChange,
  onTokensChange,
  onInitModeChange,
}: ProbabilityPlaygroundProps) {
  const [displayAsPercent, setDisplayAsPercent] = useState(false);
  const [newTokenInput, setNewTokenInput] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [arithmeticExpanded, setArithmeticExpanded] = useState(true);
  const [hoveredTokenId, setHoveredTokenId] = useState<string | null>(null);
  const { ref, isVisible } = useRevealOnScroll();

  const interpretation = useMemo(
    () => interpretPerplexity(metrics.perplexity, metrics.tokenCount),
    [metrics.perplexity, metrics.tokenCount],
  );

  const chartData = useMemo(
    () =>
      metrics.breakdown.map((b, i) => ({
        step: `${i + 1}: ${b.text}`,
        shortLabel: b.text.length > 10 ? `${b.text.slice(0, 9)}…` : b.text,
        probabilityPct: Number((b.prob * 100).toFixed(2)),
        surpriseBits: Number(b.nllBits.toFixed(3)),
        probRaw: b.prob,
      })),
    [metrics.breakdown],
  );

  const handleTextInput = (val: string) => {
    const words = tokenizeText(val);
    const nextTokens = buildTokenItems(words, initMode);
    onSentenceChange(val, nextTokens);
  };

  const handleModeSwitch = (mode: InitMode) => {
    const probs = computeInitialProbs(
      tokens.map((t) => t.text),
      mode,
    );
    const next = tokens.map((t, idx) => ({ ...t, prob: probs[idx] ?? 0.5 }));
    onInitModeChange(mode, next);
  };

  const handleUpdateTokenProb = (id: string, nextProb: number) => {
    const clamped = clampProb(nextProb);
    onTokensChange(tokens.map((t) => (t.id === id ? { ...t, prob: clamped } : t)));
  };

  const handleRemoveToken = (id: string) => {
    const next = tokens.filter((t) => t.id !== id);
    onSentenceChange(
      next.map((t) => t.text).join(' '),
      next,
    );
  };

  const handleAddToken = () => {
    const cleaned = newTokenInput.trim();
    if (!cleaned) return;
    const parts = tokenizeText(cleaned);
    const toAdd = parts.length > 0 ? parts : [cleaned];
    const additions: TokenItem[] = toAdd.map((text) => ({
      id: createTokenId(),
      text,
      prob: initMode === 'high' ? 0.8 : initMode === 'uniform' ? clampProb(1 / (tokens.length + toAdd.length)) : 0.5,
    }));
    const next = [...tokens, ...additions];
    onSentenceChange(next.map((t) => t.text).join(' '), next);
    setNewTokenInput('');
  };

  const handleSetAllHalf = () => {
    onTokensChange(tokens.map((t) => ({ ...t, prob: 0.5 })));
  };

  const applyPreset = (presetId: string) => {
    const preset = PRESET_SCENARIOS.find((p) => p.id === presetId);
    if (!preset) return;
    const words = tokenizeText(preset.sentence);
    const next: TokenItem[] = words.map((text, idx) => ({
      id: createTokenId(),
      text,
      prob: clampProb(preset.probs[idx] ?? 0.5),
    }));
    onSentenceChange(preset.sentence, next);
  };

  const applySample = (sampleSentence: string, mode: InitMode) => {
    const words = tokenizeText(sampleSentence);
    const next = buildTokenItems(words, mode);
    onInitModeChange(mode, next);
    onSentenceChange(sampleSentence, next);
  };

  const sumNats = metrics.breakdown.reduce((acc, b) => acc + b.nllNats, 0);
  const sumBits = metrics.breakdown.reduce((acc, b) => acc + b.nllBits, 0);

  return (
    <section
      id="playground"
      ref={ref}
      className={`reveal-block ${isVisible ? 'is-visible' : ''} scroll-mt-24 space-y-6`}
    >
      {/* Section Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-300">
            Interactive Simulator
          </span>
          <h2 className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            Probability Playground
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Type any sentence, sculpt conditional probabilities <span className="font-mono-num">P(token | previous)</span>, and watch perplexity respond instantaneously.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDisplayAsPercent((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-400/60 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
          >
            <Percent className="h-3.5 w-3.5 text-teal-400" />
            Display: {displayAsPercent ? 'Percentage (%)' : 'Probability (0–1)'}
          </button>
          <button
            type="button"
            onClick={handleSetAllHalf}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-lime-400/60 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
          >
            <Equal className="h-3.5 w-3.5 text-lime-400" />
            Set all to 0.5
          </button>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-500/20 dark:text-amber-300"
          >
            <Upload className="h-3.5 w-3.5" />
            Import words
          </button>
        </div>
      </div>

      {/* Controls Card: Sentence + Init Mode + Samples + Presets */}
      <div className="aurora-card rounded-2xl p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <label
              htmlFor="playground-sentence"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              Input Sequence (tokenized automatically)
            </label>
            <textarea
              id="playground-sentence"
              rows={2}
              value={sentence}
              onChange={(e) => handleTextInput(e.target.value)}
              placeholder="Type or paste a sentence to split into tokens..."
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white/90 px-4 py-3 text-base text-slate-900 shadow-inner transition focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/30 dark:border-slate-700/80 dark:bg-[#070c1c] dark:text-white"
            />

            {/* Sample Sentence Chips */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Samples:
              </span>
              {SAMPLE_SENTENCES.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => applySample(sample.sentence, sample.mode)}
                  className="rounded-full border border-slate-300/90 bg-slate-100/80 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-teal-400/60 hover:text-teal-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-teal-400/50 dark:hover:text-teal-300"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 lg:col-span-5">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Initial Probability Profile
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {INIT_MODES.map((m) => {
                  const active = initMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleModeSwitch(m.id)}
                      className={`rounded-xl border px-3 py-2 text-left transition ${
                        active
                          ? 'border-teal-400/70 bg-teal-500/15 text-teal-700 shadow-[0_0_16px_rgba(20,184,166,0.18)] dark:text-teal-200'
                          : 'border-slate-200 bg-white/60 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold">{m.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{m.hint}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Preset Scenarios
              </span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {PRESET_SCENARIOS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id)}
                    className="rounded-xl border border-slate-200 bg-white/70 px-2.5 py-2 text-left transition hover:border-lime-400/60 hover:bg-lime-500/10 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-lime-400/50"
                  >
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {preset.label}
                    </div>
                    <div className="mt-0.5 text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                      {preset.subtitle}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Token Heatmap + Plain-English Interpretation */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="aurora-card rounded-2xl p-5 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Token Surprise Heatmap
            </h3>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#14B8A6]" /> Predictable
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#A3E635]" /> Moderate
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FBBF24]" /> Surprising
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F97316]" /> Shocking
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {metrics.breakdown.length === 0 ? (
              <p className="text-sm text-slate-400">Add tokens to visualize the heatmap.</p>
            ) : (
              metrics.breakdown.map((tok) => {
                const style = getSurpriseStyle(tok.prob);
                const isHovered = hoveredTokenId === tok.id;
                return (
                  <div
                    key={tok.id}
                    onMouseEnter={() => setHoveredTokenId(tok.id)}
                    onMouseLeave={() => setHoveredTokenId(null)}
                    className="group relative"
                  >
                    <div
                      style={{
                        backgroundColor: style.bgRgba,
                        borderColor: style.borderRgba,
                      }}
                      className="cursor-default rounded-xl border px-3 py-1.5 transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {tok.text}
                      </span>
                      <span
                        style={{ color: style.hex }}
                        className="ml-2 font-mono-num text-[11px] font-semibold"
                      >
                        {displayAsPercent
                          ? `${(tok.prob * 100).toFixed(1)}%`
                          : tok.prob.toFixed(2)}
                      </span>
                    </div>

                    {isHovered && (
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-44 -translate-x-1/2 rounded-xl border border-slate-700/80 bg-slate-950/95 px-3 py-2 text-[11px] text-slate-100 shadow-xl">
                        <div className="font-semibold text-white">“{tok.text}”</div>
                        <div className="mt-1 space-y-0.5 font-mono-num text-slate-300">
                          <div>P = {formatSmallProbability(tok.prob)}</div>
                          <div>Surprise = {tok.nllBits.toFixed(2)} bits</div>
                          <div>1/P = {tok.invProb.toFixed(1)}×</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Plain-English Interpretation */}
        <div className="aurora-card aurora-card-glow flex flex-col justify-between rounded-2xl p-5 lg:col-span-5">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-teal-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Plain-English Interpretation
              </span>
            </div>
            <p className="mt-3 font-display text-base font-semibold leading-snug text-slate-900 dark:text-white sm:text-lg">
              {interpretation.headline}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {interpretation.detail}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 text-xs dark:border-slate-800 dark:bg-[#070c1c]/80">
            <span className="text-slate-500 dark:text-slate-400">Surprise regime</span>
            <span className={`font-semibold ${interpretation.colorClass}`}>
              {interpretation.badge}
            </span>
          </div>
        </div>
      </div>

      {/* Token Sliders + Line Chart */}
      <div className="grid gap-5 xl:grid-cols-12">
        {/* Token Probability Sliders */}
        <div className="aurora-card rounded-2xl p-5 xl:col-span-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Per-Token Conditional Probabilities
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adjust <span className="font-mono-num">P(wᵢ | w₁…wᵢ₋₁)</span> with sliders or direct inputs.
              </p>
            </div>
          </div>

          {/* Add token inline bar */}
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={newTokenInput}
              onChange={(e) => setNewTokenInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddToken();
                }
              }}
              placeholder="Add a token..."
              aria-label="New token text"
              className="flex-1 rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/30 dark:border-slate-700 dark:bg-[#070c1c] dark:text-white"
            />
            <button
              type="button"
              onClick={handleAddToken}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500/20 px-3.5 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-500/30 dark:text-teal-300"
            >
              <Plus className="h-4 w-4" />
              Add token
            </button>
          </div>

          {/* Token list */}
          <div className="mt-4 max-h-[430px] space-y-2.5 overflow-y-auto pr-1">
            {tokens.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 dark:border-slate-700">
                No tokens yet. Type a sentence above or add a token!
              </div>
            ) : (
              tokens.map((tok, index) => {
                const style = getSurpriseStyle(tok.prob);
                const bits = -Math.log2(clampProb(tok.prob));
                const sliderPercent = Math.round(tok.prob * 100);
                const numericDisplay = displayAsPercent
                  ? Number((tok.prob * 100).toFixed(2))
                  : Number(tok.prob.toFixed(4));

                return (
                  <div
                    key={tok.id}
                    className="rounded-xl border border-slate-200/80 bg-white/70 p-3 transition hover:border-teal-400/40 dark:border-slate-800/90 dark:bg-[#070d1e]/75"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num text-[11px] text-slate-400">
                          #{index + 1}
                        </span>
                        <span
                          style={{
                            backgroundColor: style.bgRgba,
                            borderColor: style.borderRgba,
                          }}
                          className="rounded-lg border px-2.5 py-0.5 font-mono-num text-sm font-semibold text-slate-900 dark:text-white"
                        >
                          {tok.text}
                        </span>
                        <span className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                          {bits.toFixed(2)} bits
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            aria-label={`Probability input for token ${tok.text}`}
                            min={displayAsPercent ? 0.01 : 0.0001}
                            max={displayAsPercent ? 100 : 1}
                            step={displayAsPercent ? 0.5 : 0.01}
                            value={numericDisplay}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!Number.isFinite(val)) return;
                              handleUpdateTokenProb(
                                tok.id,
                                displayAsPercent ? val / 100 : val,
                              );
                            }}
                            className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1 pr-6 text-right font-mono-num text-xs font-semibold text-slate-900 focus:border-teal-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          />
                          <span className="pointer-events-none absolute right-2 font-mono-num text-[11px] text-slate-400">
                            {displayAsPercent ? '%' : 'P'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveToken(tok.id)}
                          aria-label={`Remove token ${tok.text}`}
                          title={`Remove "${tok.text}"`}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-orange-500/15 hover:text-orange-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center gap-3">
                      <input
                        type="range"
                        aria-label={`Probability slider for token ${tok.text}`}
                        aria-valuetext={`${(tok.prob * 100).toFixed(1)} percent`}
                        min={0.001}
                        max={1}
                        step={0.001}
                        value={tok.prob}
                        onChange={(e) => handleUpdateTokenProb(tok.id, parseFloat(e.target.value))}
                        style={{
                          background: `linear-gradient(90deg, ${style.hex} ${sliderPercent}%, ${
                            isDark ? 'rgba(148,163,184,0.22)' : 'rgba(15,23,42,0.12)'
                          } ${sliderPercent}%)`,
                        }}
                        className="aurora-slider w-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recharts Line Chart: Probability vs Surprise (bits) */}
        <div className="aurora-card flex flex-col justify-between rounded-2xl p-5 xl:col-span-6">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Probability vs. Surprise (Bits)
              </h3>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Live trace
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              As probability drops toward zero, surprise (<span className="font-mono-num">-log₂ P</span>) spikes sharply.
            </p>
          </div>

          <div className="mt-4 h-[340px] w-full">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-400 dark:border-slate-700">
                Chart updates once tokens are present.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 12, right: 16, left: -8, bottom: 12 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.09)'}
                  />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fill: isDark ? '#94a3b8' : '#475569', fontSize: 11 }}
                    axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    domain={[0, 100]}
                    tick={{ fill: '#14B8A6', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 'auto']}
                    tick={{ fill: '#FBBF24', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    unit=" b"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? 'rgba(7, 11, 25, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                      borderColor: isDark ? 'rgba(20, 184, 166, 0.4)' : 'rgba(15, 23, 42, 0.14)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.step ?? ''
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="probabilityPct"
                    name="Probability (%)"
                    stroke="#14B8A6"
                    strokeWidth={2.6}
                    dot={{ r: 4, fill: '#14B8A6', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#A3E635' }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="surpriseBits"
                    name="Surprise (bits)"
                    stroke="#FBBF24"
                    strokeWidth={2.6}
                    dot={{ r: 4, fill: '#FBBF24', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#F97316' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Step-by-step Arithmetic Panel */}
      <div className="aurora-card rounded-2xl p-5 sm:p-6">
        <button
          type="button"
          onClick={() => setArithmeticExpanded((v) => !v)}
          className="flex w-full items-center justify-between text-left focus:outline-none"
        >
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Step-by-Step Arithmetic Walkthrough
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Live trace from individual token probabilities to final perplexity.
            </p>
          </div>
          <span className="rounded-lg border border-slate-200 p-1.5 text-slate-500 dark:border-slate-700 dark:text-slate-300">
            {arithmeticExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>

        {arithmeticExpanded && (
          <div className="mt-4 space-y-4">
            {metrics.breakdown.length === 0 ? (
              <p className="text-sm text-slate-400">No tokens to calculate.</p>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-[#070c1c]/80">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-300">
                      1. Sum Negative Log-Probs
                    </div>
                    <div className="mt-2 font-mono-num text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      ∑(-ln pᵢ) = {sumNats.toFixed(4)} nats
                      <br />
                      ∑(-log₂ pᵢ) = {sumBits.toFixed(4)} bits
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-[#070c1c]/80">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-lime-600 dark:text-lime-300">
                      2. Mean Cross-Entropy (H)
                    </div>
                    <div className="mt-2 font-mono-num text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      H = {sumNats.toFixed(4)} / {metrics.tokenCount} ={' '}
                      <strong className="text-slate-900 dark:text-white">
                        {metrics.crossEntropyNats.toFixed(4)} nats
                      </strong>
                      <br />
                      H₂ = {sumBits.toFixed(4)} / {metrics.tokenCount} ={' '}
                      <strong className="text-slate-900 dark:text-white">
                        {metrics.crossEntropyBits.toFixed(4)} bits
                      </strong>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-[#070c1c]/80">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300">
                      3. Exponentiate Cross-Entropy
                    </div>
                    <div className="mt-2 font-mono-num text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      PPL = exp({metrics.crossEntropyNats.toFixed(4)}) ={' '}
                      <strong className="text-teal-600 dark:text-teal-300">
                        {metrics.perplexity.toFixed(4)}
                      </strong>
                      <br />
                      = 2^({metrics.crossEntropyBits.toFixed(4)})
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-[#070c1c]/80">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      4. Joint Sequence Probability
                    </div>
                    <div className="mt-2 font-mono-num text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      ∏ pᵢ = {formatJointProb(metrics.jointProb, metrics.logJointProb)}
                      <br />1 / ∏ pᵢ = {formatJointInverse(metrics.invJointProb, metrics.logJointProb)}
                    </div>
                  </div>
                </div>

                {/* Compact per-token arithmetic strip */}
                <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <table className="w-full text-left font-mono-num text-xs">
                    <thead className="bg-slate-100/80 text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                      <tr>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Token</th>
                        <th className="px-3 py-2">P(wᵢ | w&lt;ᵢ)</th>
                        <th className="px-3 py-2">1 / P</th>
                        <th className="px-3 py-2">-ln P (nats)</th>
                        <th className="px-3 py-2">-log₂ P (bits)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                      {metrics.breakdown.map((b) => (
                        <tr key={b.id} className="hover:bg-teal-500/5">
                          <td className="px-3 py-1.5 text-slate-400">{b.index + 1}</td>
                          <td className="px-3 py-1.5 font-semibold text-slate-900 dark:text-slate-100">
                            {b.text}
                          </td>
                          <td className="px-3 py-1.5 text-teal-600 dark:text-teal-300">
                            {formatSmallProbability(b.prob)}
                          </td>
                          <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300">
                            {b.invProb.toFixed(2)}
                          </td>
                          <td className="px-3 py-1.5 text-lime-700 dark:text-lime-300">
                            {b.nllNats.toFixed(4)}
                          </td>
                          <td className="px-3 py-1.5 text-amber-600 dark:text-amber-300">
                            {b.nllBits.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={(importedItems, importedSentence) => {
          onSentenceChange(importedSentence, importedItems);
        }}
      />
    </section>
  );
}
