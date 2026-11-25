import { Cpu, Moon, SlidersHorizontal, Sun } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export function Header({ isDark, onToggleTheme }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl transition-colors dark:border-slate-800/70 dark:bg-[#050814]/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <a href="#top" className="group flex items-center gap-3 focus:outline-none">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/30 bg-slate-900 shadow-lg shadow-teal-500/10 transition-transform duration-200 group-hover:scale-105 dark:bg-[#091126]">
            <svg viewBox="0 0 36 36" className="h-6 w-6" fill="none" aria-hidden="true">
              <defs>
                <linearGradient id="hdrAurora" x1="4" y1="8" x2="32" y2="28" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#14B8A6" />
                  <stop offset="55%" stopColor="#A3E635" />
                  <stop offset="100%" stopColor="#FBBF24" />
                </linearGradient>
              </defs>
              <path
                d="M4 23C8 23 10 9 14.5 9C19 9 20.5 27 25 27C29 27 30 15 32 15"
                stroke="url(#hdrAurora)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="14.5" cy="9" r="2.2" fill="#14B8A6" />
              <circle cx="25" cy="27" r="2.2" fill="#FBBF24" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                Surprise<span className="bg-gradient-to-r from-teal-400 via-lime-400 to-amber-400 bg-clip-text text-transparent">Lab</span>
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
              Interactive Language-Model Perplexity Explorer
            </p>
          </div>
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="hidden items-center gap-2 md:flex" aria-label="Sections">
            <a
              href="#playground"
              className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-700 transition hover:border-teal-400/60 hover:bg-teal-500/20 dark:text-teal-300"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Probability Playground
            </a>
            <a
              href="#real-model"
              className="inline-flex items-center gap-1.5 rounded-full border border-lime-500/30 bg-lime-500/10 px-3 py-1 text-xs font-medium text-lime-700 transition hover:border-lime-400/60 hover:bg-lime-500/20 dark:text-lime-300"
            >
              <Cpu className="h-3.5 w-3.5" />
              Real AI Model
            </a>
            <a
              href="#mathematics"
              className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 transition hover:border-amber-400/60 hover:bg-amber-500/20 dark:text-amber-300"
            >
              Math Guide
            </a>
          </nav>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark aurora mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark aurora mode'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition hover:border-teal-400/50 hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-teal-400/50 dark:hover:text-teal-300"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-teal-600" />}
          </button>
        </div>
      </div>
    </header>
  );
}
