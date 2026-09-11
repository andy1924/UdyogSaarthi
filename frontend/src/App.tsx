import { useCallback, useEffect, useState } from 'react';
import Shell from './components/Shell';
import AccountAccessModal from './components/AccountAccessModal';
import OverviewPage from './pages/OverviewPage';
import ApplyPage from './pages/ApplyPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import ReviewPage from './pages/ReviewPage';
import AuditPage from './pages/AuditPage';
import AccountPage from './pages/AccountPage';
import { api, AUTH_REQUIRED_EVENT, type SessionUser } from './lib/api';
import { navigateTo, parseHash, type ShellRoute, type ShellRouteName } from './lib/routes';
import { clearLegacyIdentityFiles } from './lib/identity-documents';
import { useVoice } from './lib/voice/VoiceContext';

/**
 * What each page is, in the words the assistant should use. The wizard sets its
 * own step context from the assessment; every other route only needs to say
 * where the user is, so a question like "what is this page?" has an answer.
 */
const PAGE_TITLES: Record<ShellRouteName, string> = {
  overview: 'Overview - the UdyogSaarthi home page, with the way in to a new business plan',
  apply: 'Apply - the business plan wizard',
  applications: 'My applications - the saved project reports for this applicant',
  'application-detail': 'Application detail - one saved project report',
  review: 'Review - the officer queue for submitted applications',
  audit: 'Audit - the audit console of decisions already taken',
  account: 'Account - the signed-in user profile',
};

function App() {
  const { setContext } = useVoice();
  const [route, setRoute] = useState<ShellRoute>(() =>
    typeof window === 'undefined' ? { name: 'overview' } : parseHash(window.location.hash),
  );
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  const refreshUser = useCallback(() => {
    if (!api.getToken()) {
      setUser(null);
      return;
    }
    api.getCurrentUser()
      .then((currentUser) => setUser(currentUser))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    void clearLegacyIdentityFiles();
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const handleHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const requestSignIn = () => {
      setUser(null);
      setAccountOpen(true);
    };
    window.addEventListener(AUTH_REQUIRED_EVENT, requestSignIn);
    return () => window.removeEventListener(AUTH_REQUIRED_EVENT, requestSignIn);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  // The wizard keeps its own step snapshot, so it is left alone here.
  useEffect(() => {
    if (route.name === 'apply') return;
    setContext({ step: 0, stepTitle: 'Not in the wizard', page: PAGE_TITLES[route.name] });
  }, [route.name, setContext]);

  // Reveal the page scrollbar only while the pointer is near the right edge.
  useEffect(() => {
    const root = document.documentElement;
    const edge = 48;
    const onPointerMove = (event: PointerEvent) => {
      root.classList.toggle('scrollbar-reveal', window.innerWidth - event.clientX <= edge);
    };
    const onPointerLeave = () => root.classList.remove('scrollbar-reveal');
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
      root.classList.remove('scrollbar-reveal');
    };
  }, []);

  const openSignIn = useCallback(() => setAccountOpen(true), []);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
    setAccountOpen(false);
    try {
      sessionStorage.removeItem('udyogsaarthi-assessment-draft-v1');
    } catch { /* Optional browser storage. */ }
    void clearLegacyIdentityFiles();
    navigateTo({ name: 'overview' });
  }, []);

  const accountSuccess = useCallback(() => {
    api.getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
        setAccountOpen(false);
      })
      .catch(() => {
        setUser(null);
        setAccountOpen(true);
      });
  }, []);

  const goOverview = useCallback(() => navigateTo({ name: 'overview' }), []);
  const goApply = useCallback(() => navigateTo({ name: 'apply' }), []);
  const goApplications = useCallback(() => navigateTo({ name: 'applications' }), []);
  const openDetail = useCallback((dprId: string) => navigateTo({ name: 'application-detail', dprId }), []);

  const activeNav = route.name === 'application-detail' ? 'applications' : route.name;
  const routeKey = route.name === 'application-detail' ? `application-detail:${route.dprId ?? ''}` : route.name;

  return (
    <>
      <Shell active={activeNav} user={user} onSignIn={openSignIn} onLogout={logout}>
        <div key={routeKey} className="animate-page-enter">
          {route.name === 'overview' && (
            <OverviewPage onApply={goApply} />
          )}
          {route.name === 'apply' && (
            <ApplyPage user={user} onSignIn={openSignIn} onBackToOverview={goOverview} />
          )}
          {route.name === 'applications' && (
            <ApplicationsPage user={user} onSignIn={openSignIn} onOpenDetail={openDetail} onApply={goApply} />
          )}
          {route.name === 'application-detail' && route.dprId && (
            <ApplicationDetailPage dprId={route.dprId} user={user} onSignIn={openSignIn} onBack={goApplications} />
          )}
          {route.name === 'review' && <ReviewPage user={user} onSignIn={openSignIn} />}
          {route.name === 'audit' && <AuditPage user={user} onSignIn={openSignIn} />}
          {route.name === 'account' && <AccountPage user={user} onSignIn={openSignIn} onLogout={logout} />}
        </div>
      </Shell>
      <AccountAccessModal open={accountOpen} onClose={() => setAccountOpen(false)} onSuccess={accountSuccess} />
    </>
  );
}

export default App;
