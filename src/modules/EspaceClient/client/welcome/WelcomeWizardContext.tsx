import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useWelcomeWizard, type UseWelcomeWizardResult } from './useWelcomeWizard';

// Palier 10 — context qui partage UNE SEULE instance de useWelcomeWizard entre
// WelcomeBanner et WelcomeWizard. Résout la dette technique HIGH #2 (deux
// instances distinctes qui pouvaient se désynchroniser sur welcome_dismissed_count
// et welcome_completed_at). L'auto-open au login est piloté ici.

interface WelcomeWizardContextValue {
  wizard: UseWelcomeWizardResult;
  isOpen: boolean;
  openWizard: () => void;
  closeWizard: () => void;
}

const WelcomeWizardContext = createContext<WelcomeWizardContextValue | null>(null);

interface WelcomeWizardProviderProps {
  projectId: string;
  children: ReactNode;
}

export function WelcomeWizardProvider({ projectId, children }: WelcomeWizardProviderProps) {
  const wizard = useWelcomeWizard(projectId);
  const [isOpen, setIsOpen] = useState(false);
  const autoOpenedRef = useRef(false);

  // Auto-open au premier passage post-load si le wizard doit s'ouvrir
  // automatiquement (pas complété + dismissals < seuil). On flag via ref
  // pour ne déclencher qu'une fois par session — sinon refermer manuellement
  // rouvrirait en boucle.
  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (wizard.loading) return;
    if (wizard.shouldOpenAutomatically) {
      autoOpenedRef.current = true;
      setIsOpen(true);
    } else {
      autoOpenedRef.current = true;
    }
  }, [wizard.loading, wizard.shouldOpenAutomatically]);

  return (
    <WelcomeWizardContext.Provider
      value={{
        wizard,
        isOpen,
        openWizard: () => setIsOpen(true),
        closeWizard: () => setIsOpen(false),
      }}
    >
      {children}
    </WelcomeWizardContext.Provider>
  );
}

export function useWelcomeWizardCtx(): WelcomeWizardContextValue {
  const ctx = useContext(WelcomeWizardContext);
  if (!ctx) throw new Error('useWelcomeWizardCtx must be used within WelcomeWizardProvider');
  return ctx;
}
