import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { MathSection } from './components/MathSection';
import { MetricsDashboard } from './components/MetricsDashboard';
import { ProbabilityPlayground } from './components/ProbabilityPlayground';
import {
  buildTokenItems,
  computeMetrics,
  tokenizeText,
  type InitMode,
  type TokenItem,
} from './lib/perplexity';

const RealModelSection = lazy(() => import('./components/RealModelSection'));

const DEFAULT_SENTENCE = 'Heavy clouds gathered before the evening storm';

export function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = window.localStorage.getItem('surpriselab-theme');
    return saved ? saved === 'dark' : true;
  });

  const [sentence, setSentence] = useState<string>(DEFAULT_SENTENCE);
  const [initMode, setInitMode] = useState<InitMode>('gradient');
  const [tokens, setTokens] = useState<TokenItem[]>(() =>
    buildTokenItems(tokenizeText(DEFAULT_SENTENCE), 'gradient'),
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    window.localStorage.setItem('surpriselab-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const metrics = useMemo(() => computeMetrics(tokens), [tokens]);

  const handleSendFromModelToPlayground = (
    modelSentence: string,
    modelTokens: TokenItem[],
  ) => {
    setSentence(modelSentence);
    setTokens(modelTokens);
    const el = document.getElementById('playground');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative min-h-screen">
      <div className="aurora-backdrop" aria-hidden="true" />
      <div className="aurora-grid" aria-hidden="true" />

      <Header isDark={isDark} onToggleTheme={() => setIsDark((d) => !d)} />

      <main className="mx-auto max-w-7xl space-y-14 px-4 pb-12 sm:px-6 lg:px-8">
        <Hero />

        <div>
          <MetricsDashboard metrics={metrics} />
          <ProbabilityPlayground
            sentence={sentence}
            tokens={tokens}
            initMode={initMode}
            metrics={metrics}
            isDark={isDark}
            onSentenceChange={(nextSentence, nextTokens) => {
              setSentence(nextSentence);
              setTokens(nextTokens);
            }}
            onTokensChange={setTokens}
            onInitModeChange={(mode, nextTokens) => {
              setInitMode(mode);
              setTokens(nextTokens);
            }}
          />
        </div>

        <Suspense
          fallback={
            <section
              id="real-model"
              className="aurora-card rounded-2xl p-8 text-center text-sm text-slate-500 dark:text-slate-400"
            >
              Preparing Real AI Model module…
            </section>
          }
        >
          <RealModelSection onSendToPlayground={handleSendFromModelToPlayground} />
        </Suspense>

        <MathSection />
      </main>

      <Footer />
    </div>
  );
}

export default App;
