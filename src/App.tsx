import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/auth/LoginPage';

const ClientPortalPage = lazy(() =>
  import('./modules/ClientPortal/ClientPortalPage').then(m => ({ default: m.ClientPortalPage }))
);

// TEMPORARY (Task A3): preview-only route for the new Propul'Space PortalLayout.
// Remove or replace at Task A5 when real client pages + routing land.
const PortalLayoutPreview = lazy(() =>
  import('./modules/EspaceClient/shared/layouts/PortalLayout.preview').then(m => ({ default: m.PortalLayoutPreview }))
);

const ClientBriefPage = lazy(() =>
  import('./modules/ClientBrief/ClientBriefPage').then(m => ({ default: m.ClientBriefPage }))
);

const ClientBriefInvitePage = lazy(() =>
  import('./modules/ClientBrief/ClientBriefInvitePage').then(m => ({ default: m.ClientBriefInvitePage }))
);

// Alphabet du shortCode (src/lib/shortCode.ts) : sans 0/1/I/L/O pour éviter l'ambiguïté
const SHORT_CODE_RE = /^[A-HJKMNP-Z2-9]{8}$/;

function PortalPageRoute() {
  const { token = '' } = useParams<{ token: string }>();
  if (!SHORT_CODE_RE.test(token)) return null;
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Chargement...</div>}>
        <ClientPortalPage token={token} />
      </Suspense>
    </ErrorBoundary>
  );
}

function BriefPageRoute() {
  const { token = '' } = useParams<{ token: string }>();
  if (!SHORT_CODE_RE.test(token)) return null;
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-slate-400">Chargement...</div>}>
        <ClientBriefPage token={token} />
      </Suspense>
    </ErrorBoundary>
  );
}

function BriefInvitePageRoute() {
  const { token = '' } = useParams<{ token: string }>();
  if (!SHORT_CODE_RE.test(token)) return null;
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-slate-400">Chargement...</div>}>
        <ClientBriefInvitePage token={token} />
      </Suspense>
    </ErrorBoundary>
  );
}

function AuthenticatedApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0814] flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <LoginPage />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-surface-1">
        <Layout />
        <Toaster position="top-right" />
      </div>
    </ErrorBoundary>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/espace-client/__preview"
          element={
            <ErrorBoundary>
              <Suspense fallback={<div className="min-h-screen bg-white" />}>
                <PortalLayoutPreview />
              </Suspense>
            </ErrorBoundary>
          }
        />
        <Route path="/portal/:token" element={<PortalPageRoute />} />
        <Route path="/brief/:token" element={<BriefPageRoute />} />
        <Route path="/brief-invite/:token" element={<BriefInvitePageRoute />} />
        <Route path="*" element={<AuthenticatedApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
