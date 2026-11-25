import { Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  clampProb,
  computeInitialProbs,
  createTokenId,
  tokenizeText,
  type InitMode,
  type TokenItem,
} from '../lib/perplexity';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: TokenItem[], sourceText: string) => void;
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [rawInput, setRawInput] = useState(
    'aurora 0.42\nglows 0.68\nabove 0.74\nfrozen 0.31\nmountains 0.82',
  );
  const [fallbackMode, setFallbackMode] = useState<InitMode>('gradient');

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApply = () => {
    const lines = rawInput
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

    // Check if lines follow "token prob" or "token,prob" format
    const paired: { text: string; prob: number }[] = [];
    let allPaired = lines.length > 0;

    for (const line of lines) {
      const match = line.match(/^(.+?)[,\t\s]+(0(?:\.\d+)?|1(?:\.0+)?|\d+(?:\.\d+)?%?)$/);
      if (match) {
        const text = match[1].trim();
        const rawNum = match[2].trim();
        const parsed = rawNum.endsWith('%')
          ? parseFloat(rawNum.slice(0, -1)) / 100
          : parseFloat(rawNum);
        if (text && Number.isFinite(parsed) && parsed > 0) {
          paired.push({ text, prob: clampProb(parsed > 1 ? parsed / 100 : parsed) });
          continue;
        }
      }
      allPaired = false;
      break;
    }

    if (allPaired && paired.length > 0) {
      const items = paired.map((p) => ({
        id: createTokenId(),
        text: p.text,
        prob: p.prob,
      }));
      onImport(items, paired.map((p) => p.text).join(' '));
      onClose();
      return;
    }

    const words = tokenizeText(rawInput);
    if (words.length === 0) return;
    const probs = computeInitialProbs(words, fallbackMode);
    const items: TokenItem[] = words.map((text, idx) => ({
      id: createTokenId(),
      text,
      prob: probs[idx] ?? 0.5,
    }));
    onImport(items, words.join(' '));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      onClick={onClose}
    >
      <div
        className="aurora-card aurora-card-glow w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#0b1224]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="import-modal-title" className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Import Words &amp; Probabilities
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Paste plain text, or use one <code className="font-mono-num">word probability</code> pair per line (decimals or percentages).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close import modal"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          rows={6}
          aria-label="Words or token probability pairs"
          className="mt-4 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 font-mono-num text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/30 dark:border-slate-700 dark:bg-[#070b18] dark:text-slate-100"
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="fallback-init" className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Plain text init:
            </label>
            <select
              id="fallback-init"
              value={fallbackMode}
              onChange={(e) => setFallbackMode(e.target.value as InitMode)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="gradient">Smart gradient</option>
              <option value="even">Even (0.5)</option>
              <option value="high">High (0.8)</option>
              <option value="uniform">Uniform (1/N)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-lime-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md transition hover:brightness-110"
            >
              <Upload className="h-3.5 w-3.5" />
              Import Tokens
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
