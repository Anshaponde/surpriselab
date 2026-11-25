import katex from 'katex';
import { useMemo } from 'react';

interface MathFormulaProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export function MathFormula({ latex, displayMode = false, className = '' }: MathFormulaProps) {
  const html = useMemo(() => {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
    });
  }, [latex, displayMode]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
