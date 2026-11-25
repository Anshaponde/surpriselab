import { BookOpen, Compass, Sigma } from 'lucide-react';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';
import { MathFormula } from './MathFormula';

const SCALE_TIERS = [
  {
    range: 'PPL = 1',
    title: 'Total Certainty',
    desc: 'Every next token is predicted with probability 1.0 (0 bits of surprise).',
    accent: 'border-teal-400/50 bg-teal-500/12 text-teal-600 dark:text-teal-300',
  },
  {
    range: 'PPL 10 – 30',
    title: 'Fluent Natural Text',
    desc: 'Modern LLMs reading well-formed prose typically land in this zone.',
    accent: 'border-lime-400/50 bg-lime-500/12 text-lime-700 dark:text-lime-300',
  },
  {
    range: 'PPL 30 – 250',
    title: 'Surprising / Niche',
    desc: 'Rare jargon, poetry, or unexpected plot twists stretch the candidate pool.',
    accent: 'border-amber-400/50 bg-amber-500/12 text-amber-700 dark:text-amber-300',
  },
  {
    range: 'PPL 1000+',
    title: 'Static & Noise',
    desc: 'Scrambled tokens or out-of-distribution text leave the model guessing blindly.',
    accent: 'border-orange-500/50 bg-orange-500/14 text-orange-700 dark:text-orange-300',
  },
];

export function MathSection() {
  const { ref, isVisible } = useRevealOnScroll();

  return (
    <section
      id="mathematics"
      ref={ref}
      className={`reveal-block ${isVisible ? 'is-visible' : ''} scroll-mt-24 space-y-6`}
    >
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-300">
          Deep Dive
        </span>
        <h2 className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          The Mathematics of Perplexity
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Why exponentiating cross-entropy turns abstract log-likelihoods into an intuitive vocabulary-branching score.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Card 1: Geometric Mean of Inverse Probabilities */}
        <article className="aurora-card rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-300">
            <Sigma className="h-4 w-4" />
            <span>1. Geometric Mean View</span>
          </div>
          <h3 className="mt-2 font-display text-lg font-bold text-slate-900 dark:text-white">
            Inverse Probability Average
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            For a sequence of <MathFormula latex="N" /> tokens <MathFormula latex="W = (w_1, \dots, w_N)" />, perplexity takes the{' '}
            <MathFormula latex="N" />-th root of the product of inverse conditional probabilities:
          </p>
          <div className="my-4 rounded-xl border border-slate-200/80 bg-slate-50/85 px-3 py-3 text-center dark:border-slate-800 dark:bg-[#070c1c]">
            <MathFormula
              displayMode
              latex={String.raw`\mathrm{PPL}(W) = \left(\prod_{i=1}^{N} \frac{1}{P(w_i \mid w_{<i})}\right)^{\!\frac{1}{N}}`}
            />
          </div>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Because probabilities multiply across a sentence, a geometric mean—not an arithmetic mean—keeps sequence length from skewing the score.
          </p>
        </article>

        {/* Card 2: Cross-Entropy Connection */}
        <article className="aurora-card rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-600 dark:text-lime-300">
            <BookOpen className="h-4 w-4" />
            <span>2. Cross-Entropy Link</span>
          </div>
          <h3 className="mt-2 font-display text-lg font-bold text-slate-900 dark:text-white">
            From Nats &amp; Bits to PPL
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Taking logs turns the product into an average negative log-likelihood—known as cross-entropy <MathFormula latex="H(W)" />:
          </p>
          <div className="my-4 space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/85 px-3 py-3 text-center dark:border-slate-800 dark:bg-[#070c1c]">
            <MathFormula
              displayMode
              latex={String.raw`H(W) = -\frac{1}{N}\sum_{i=1}^{N} \ln P(w_i \mid w_{<i})`}
            />
            <MathFormula
              displayMode
              latex={String.raw`\mathrm{PPL}(W) = e^{H(W)} = 2^{H_{\mathrm{bits}}(W)}`}
            />
          </div>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Whether you measure surprise in base-<MathFormula latex="e" /> (nats) or base-2 (bits), matching the exponential base gives the exact same perplexity.
          </p>
        </article>

        {/* Card 3: Effective Vocabulary Intuition */}
        <article className="aurora-card rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300">
            <Compass className="h-4 w-4" />
            <span>3. Effective Vocabulary</span>
          </div>
          <h3 className="mt-2 font-display text-lg font-bold text-slate-900 dark:text-white">
            The Uniform-Choice Analogy
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Suppose a model assigns uniform probability <MathFormula latex="1/K" /> to <MathFormula latex="K" /> equally plausible next words at every step:
          </p>
          <div className="my-4 rounded-xl border border-slate-200/80 bg-slate-50/85 px-3 py-3 text-center dark:border-slate-800 dark:bg-[#070c1c]">
            <MathFormula
              displayMode
              latex={String.raw`P(w_i \mid w_{<i}) = \frac{1}{K} \implies \mathrm{PPL} = \left(K^N\right)^{\!\frac{1}{N}} = K`}
            />
          </div>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            A perplexity of 20 means the model is, on average, as uncertain as rolling a fair 20-sided die before seeing each token.
          </p>
        </article>
      </div>

      {/* Rough Perplexity Scale */}
      <div className="aurora-card aurora-card-glow rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Rough Perplexity Scale
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Lower perplexity = sharper predictions
          </span>
        </div>

        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-teal-400 via-lime-400 via-60% to-orange-500" />

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SCALE_TIERS.map((tier) => (
            <div
              key={tier.range}
              className="rounded-xl border border-slate-200/80 bg-white/70 p-3.5 dark:border-slate-800 dark:bg-[#070c1c]/80"
            >
              <span className={`inline-block rounded-lg border px-2.5 py-0.5 font-mono-num text-xs font-bold ${tier.accent}`}>
                {tier.range}
              </span>
              <h4 className="mt-2 font-display text-sm font-bold text-slate-900 dark:text-white">
                {tier.title}
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {tier.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
