export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200/70 py-8 text-center text-xs text-slate-500 dark:border-slate-800/70 dark:text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
        <p>
          <span className="font-display font-semibold text-slate-700 dark:text-slate-200">
            SurpriseLab
          </span>{' '}
          — Built for curious minds learning information theory &amp; language modeling.
        </p>
        <p>
          100% client-side · Zero servers · Powered by React, KaTeX, Recharts &amp; Transformers.js
        </p>
      </div>
    </footer>
  );
}
