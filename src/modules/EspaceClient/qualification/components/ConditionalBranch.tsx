import { useEffect, useState, type ReactNode } from 'react';

interface ConditionalBranchProps {
  show: boolean;
  children: ReactNode;
  delayMs?: number;
}

// Wrapper fade-in/fade-out pour les branches conditionnelles. 150ms de
// délai par défaut (le temps de "respirer" après le clic), 300ms de
// transition opacity+translate.
export function ConditionalBranch({ show, children, delayMs = 150 }: ConditionalBranchProps) {
  const [mounted, setMounted] = useState(show);
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), delayMs);
      return () => clearTimeout(t);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 300);
    return () => clearTimeout(t);
  }, [show, delayMs]);

  if (!mounted) return null;
  return (
    <div
      aria-hidden={!visible}
      className={`transition-all duration-300 [transition-timing-function:var(--ps-ease)] ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
      }`}
    >
      {children}
    </div>
  );
}
