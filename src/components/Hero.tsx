import { ArrowDownRight, Sparkles } from 'lucide-react';
import { MathFormula } from './MathFormula';

export function Hero() {
  return (
    <section id="top" className="relative pt-10 pb-8 sm:pt-14 sm:pb-10">
      <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-teal-700 dark:text-teal-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Interactive Information-Theory Lab</span>
          </div>

          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl sm:leading-[1.12]">
            How{' '}
            <span className="bg-gradient-to-r from-teal-400 via-lime-400 to-amber-400 bg-clip-text text-transparent">
              surprised
            </span>{' '}
            is a language model by this text?
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
            Every time a language model reads a sentence, it guesses the next token from left to right.
            <strong className="font-semibold text-slate-900 dark:text-white"> Perplexity</strong> turns
            those token-by-token probabilities into one intuitive number: the effective number of equally
            likely words the model is hesitating between at each step.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="#playground"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-lime-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-teal-500/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              Launch Playground
              <ArrowDownRight className="h-4 w-4" />
            </a>
            <a
              href="#real-model"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-teal-400/60 hover:text-teal-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-teal-400/60 dark:hover:text-teal-300"
            >
              Run DistilGPT-2 in Browser
            </a>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 md:hidden">
            <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 text-[11px] font-medium text-teal-700 dark:text-teal-300">
              Probability Playground
            </span>
            <span className="rounded-full border border-lime-500/30 bg-lime-500/10 px-2.5 py-0.5 text-[11px] font-medium text-lime-700 dark:text-lime-300">
              Real AI Model
            </span>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="aurora-card aurora-card-glow rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-300">
                Core Definition
              </span>
              <span className="rounded-md bg-slate-200/70 px-2 py-0.5 font-mono-num text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Natural log (nats)
              </span>
            </div>

            <div className="my-4 rounded-xl border border-slate-200/80 bg-slate-50/90 px-4 py-4 text-center text-slate-900 dark:border-slate-800 dark:bg-[#070d1f]/90 dark:text-slate-100">
              <MathFormula
                displayMode
                latex={String.raw`\mathrm{PPL} = \exp\!\left(H\right) = \exp\!\left(-\frac{1}{N}\sum_{i=1}^{N}\ln P(w_i \mid w_{<i})\right)`}
                className="text-base sm:text-lg"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded-xl border border-teal-500/20 bg-teal-500/8 px-2.5 py-2">
                <div className="font-mono-num text-sm font-bold text-teal-600 dark:text-teal-300">PPL ≈ 1</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">Zero surprise</div>
              </div>
              <div className="rounded-xl border border-lime-500/20 bg-lime-500/8 px-2.5 py-2">
                <div className="font-mono-num text-sm font-bold text-lime-700 dark:text-lime-300">10 – 30</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">Fluent prose</div>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-2.5 py-2">
                <div className="font-mono-num text-sm font-bold text-amber-600 dark:text-amber-300">1000+</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">Near noise</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
