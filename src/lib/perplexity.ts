export type InitMode = 'even' | 'high' | 'uniform' | 'gradient';

export interface TokenItem {
  id: string;
  text: string;
  prob: number;
}

export interface TokenBreakdown {
  id: string;
  index: number;
  text: string;
  prob: number;
  invProb: number;
  nllNats: number;
  nllBits: number;
}

export interface PerplexityMetrics {
  tokenCount: number;
  perplexity: number;
  crossEntropyNats: number;
  crossEntropyBits: number;
  logJointProb: number;
  jointProb: number;
  invJointProb: number;
  avgConfidence: number;
  mostSurprising: TokenBreakdown | null;
  breakdown: TokenBreakdown[];
}

export interface PresetScenario {
  id: string;
  label: string;
  subtitle: string;
  sentence: string;
  probs: number[];
}

export interface SampleSentence {
  label: string;
  sentence: string;
  mode: InitMode;
}

export const MIN_PROB = 0.0001;
export const MAX_PROB = 1;

export function clampProb(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(MAX_PROB, Math.max(MIN_PROB, value));
}

export function createTokenId(): string {
  return `tok_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

/**
 * Splits user text into clean word/punctuation tokens for the simulator.
 */
export function tokenizeText(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const matches = trimmed.match(/[\w'’-]+|[.,!?;:()[\]"“”]/g);
  return matches && matches.length > 0 ? matches : trimmed.split(/\s+/);
}

export function computeInitialProbs(tokens: string[], mode: InitMode): number[] {
  const n = tokens.length;
  if (n === 0) return [];

  switch (mode) {
    case 'even':
      return tokens.map(() => 0.5);
    case 'high':
      return tokens.map(() => 0.8);
    case 'uniform': {
      const p = clampProb(Number((1 / n).toFixed(4)));
      return tokens.map(() => p);
    }
    case 'gradient':
      return tokens.map((tok, i) => {
        const progress = n === 1 ? 0.6 : i / (n - 1);
        const base = 0.24 + 0.58 * Math.pow(progress, 0.85);
        const isPunct = /^[.,!?;:]$/.test(tok);
        const adjusted = isPunct ? Math.min(0.92, base + 0.14) : base;
        return clampProb(Number(adjusted.toFixed(3)));
      });
  }
}

export function buildTokenItems(tokens: string[], mode: InitMode): TokenItem[] {
  const probs = computeInitialProbs(tokens, mode);
  return tokens.map((text, idx) => ({
    id: createTokenId(),
    text,
    prob: probs[idx] ?? 0.5,
  }));
}

export function computeMetrics(items: TokenItem[]): PerplexityMetrics {
  if (items.length === 0) {
    return {
      tokenCount: 0,
      perplexity: 1,
      crossEntropyNats: 0,
      crossEntropyBits: 0,
      logJointProb: 0,
      jointProb: 1,
      invJointProb: 1,
      avgConfidence: 1,
      mostSurprising: null,
      breakdown: [],
    };
  }

  const breakdown: TokenBreakdown[] = items.map((item, index) => {
    const p = clampProb(item.prob);
    return {
      id: item.id,
      index,
      text: item.text,
      prob: p,
      invProb: 1 / p,
      nllNats: -Math.log(p),
      nllBits: -Math.log2(p),
    };
  });

  const sumNats = breakdown.reduce((acc, t) => acc + t.nllNats, 0);
  const sumBits = breakdown.reduce((acc, t) => acc + t.nllBits, 0);
  const n = breakdown.length;

  const crossEntropyNats = sumNats / n;
  const crossEntropyBits = sumBits / n;
  const perplexity = Math.exp(crossEntropyNats);
  const logJointProb = -sumNats;
  const jointProb = Math.exp(logJointProb);
  const invJointProb = Math.exp(sumNats);
  const avgConfidence = 1 / perplexity;

  let mostSurprising = breakdown[0];
  for (const t of breakdown) {
    if (t.prob < mostSurprising.prob) {
      mostSurprising = t;
    }
  }

  return {
    tokenCount: n,
    perplexity,
    crossEntropyNats,
    crossEntropyBits,
    logJointProb,
    jointProb,
    invJointProb,
    avgConfidence,
    mostSurprising,
    breakdown,
  };
}

export interface SurpriseVisualStyle {
  tier: 'predictable' | 'moderate' | 'surprising' | 'shocking';
  hex: string;
  bgRgba: string;
  borderRgba: string;
  label: string;
}

export function getSurpriseStyle(prob: number): SurpriseVisualStyle {
  const p = clampProb(prob);
  if (p >= 0.65) {
    return {
      tier: 'predictable',
      hex: '#14B8A6',
      bgRgba: 'rgba(20, 184, 166, 0.16)',
      borderRgba: 'rgba(20, 184, 166, 0.48)',
      label: 'Predictable',
    };
  }
  if (p >= 0.35) {
    return {
      tier: 'moderate',
      hex: '#A3E635',
      bgRgba: 'rgba(163, 230, 53, 0.15)',
      borderRgba: 'rgba(163, 230, 53, 0.45)',
      label: 'Moderate',
    };
  }
  if (p >= 0.1) {
    return {
      tier: 'surprising',
      hex: '#FBBF24',
      bgRgba: 'rgba(251, 191, 36, 0.18)',
      borderRgba: 'rgba(251, 191, 36, 0.55)',
      label: 'Surprising',
    };
  }
  return {
    tier: 'shocking',
    hex: '#F97316',
    bgRgba: 'rgba(249, 115, 22, 0.22)',
    borderRgba: 'rgba(249, 115, 22, 0.65)',
    label: 'High Surprise',
  };
}

export function formatSmallProbability(p: number): string {
  if (p === 0) return '0';
  if (p >= 0.001) return p.toFixed(4);
  if (p >= 1e-6) return p.toExponential(2);
  return p.toExponential(2);
}

export function formatJointInverse(invJointProb: number, logJointProb: number): string {
  if (!Number.isFinite(invJointProb) || invJointProb > 1e15) {
    // 1 / exp(logJointProb) = exp(-logJointProb) = 10^( -logJointProb / ln(10) )
    const log10Val = -logJointProb / Math.LN10;
    const exp = Math.floor(log10Val);
    const mantissa = Math.pow(10, log10Val - exp);
    return `${mantissa.toFixed(2)} × 10^${exp}`;
  }
  if (invJointProb >= 1e6) return invJointProb.toExponential(2);
  if (invJointProb >= 100) return invJointProb.toLocaleString(undefined, { maximumFractionDigits: 1 });
  return invJointProb.toFixed(2);
}

export function formatJointProb(jointProb: number, logJointProb: number): string {
  if (jointProb === 0 || logJointProb < -35) {
    const log10Val = logJointProb / Math.LN10;
    const exp = Math.floor(log10Val);
    const mantissa = Math.pow(10, log10Val - exp);
    return `${mantissa.toFixed(2)} × 10^${exp}`;
  }
  if (jointProb < 0.0001) return jointProb.toExponential(2);
  return jointProb.toFixed(6);
}

export function interpretPerplexity(ppl: number, tokenCount: number): {
  badge: string;
  colorClass: string;
  headline: string;
  detail: string;
} {
  if (tokenCount === 0) {
    return {
      badge: 'Awaiting Input',
      colorClass: 'text-slate-400',
      headline: 'Enter a sentence or add tokens to begin measuring surprise.',
      detail: 'Perplexity averages how uncertain a model is across every token transition.',
    };
  }

  const roundedWords =
    ppl >= 100 ? Math.round(ppl).toLocaleString() : ppl >= 10 ? ppl.toFixed(1) : ppl.toFixed(2);

  if (ppl <= 1.25) {
    return {
      badge: 'Near Certainty',
      colorClass: 'text-teal-400',
      headline: `The model is nearly certain — as focused as choosing among ${roundedWords} equally likely words.`,
      detail: 'Almost zero uncertainty: every token closely matches what the model anticipated.',
    };
  }
  if (ppl <= 5) {
    return {
      badge: 'Highly Predictable',
      colorClass: 'text-teal-400',
      headline: `The model is as confused as choosing between ${roundedWords} equally likely words at each step.`,
      detail: 'Very strong context cues narrow the next word down to just a handful of candidates.',
    };
  }
  if (ppl <= 30) {
    return {
      badge: 'Fluent Natural Text',
      colorClass: 'text-lime-400',
      headline: `The model is as confused as choosing between ${roundedWords} equally likely words per token.`,
      detail: 'Typical for coherent everyday prose where grammar constrains choices while ideas stay expressive.',
    };
  }
  if (ppl <= 150) {
    return {
      badge: 'Unexpected / Creative',
      colorClass: 'text-amber-400',
      headline: `The model is as confused as choosing between ${roundedWords} equally likely words per token.`,
      detail: 'Unusual phrasing, rare names, or a surprise twist forces the model to spread probability thinly.',
    };
  }
  return {
    badge: 'High Chaos / Noise',
    colorClass: 'text-orange-400',
    headline: `The model is as confused as choosing between ${roundedWords} equally likely words at every step.`,
    detail: 'Extreme uncertainty: the sequence looks scrambled, out-of-distribution, or nearly random.',
  };
}

export const SAMPLE_SENTENCES: SampleSentence[] = [
  {
    label: 'Weather forecast',
    sentence: 'Heavy clouds gathered before the evening storm',
    mode: 'gradient',
  },
  {
    label: 'Code snippet',
    sentence: 'Return early when the cache misses',
    mode: 'high',
  },
  {
    label: 'Sci-fi twist',
    sentence: 'The observatory clock chimed thirteen in silence',
    mode: 'gradient',
  },
  {
    label: 'Uniform coin toss',
    sentence: 'North east south west',
    mode: 'uniform',
  },
];

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'near-certainty',
    label: 'Near Certainty',
    subtitle: 'Predictable cliché (~1.14 PPL)',
    sentence: 'Two plus two equals four',
    probs: [0.85, 0.92, 0.94, 0.88, 0.82],
  },
  {
    id: 'one-surprise',
    label: 'One Surprising Word',
    subtitle: 'Single shock spikes PPL',
    sentence: 'She stirred honey into her keyboard',
    probs: [0.72, 0.65, 0.7, 0.88, 0.84, 0.004],
  },
  {
    id: 'high-chaos',
    label: 'High Chaos',
    subtitle: 'Near-random tokens (>50 PPL)',
    sentence: 'Velvet arithmetic orbits pickled static',
    probs: [0.02, 0.015, 0.03, 0.008, 0.025],
  },
];
