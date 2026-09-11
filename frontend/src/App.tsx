import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import HowItWorks from './components/HowItWorks';
import OfficialBacking from './components/OfficialBacking';
import Footer from './components/Footer';
import FeasibilityCheck from './components/FeasibilityCheck';
import AccountAccessModal from './components/AccountAccessModal';
import { api, AUTH_REQUIRED_EVENT, type SessionUser } from './lib/api';
import { clearLegacyIdentityFiles } from './lib/identity-documents';

type ViewMode = 'landing' | 'feasibility';

function App() {
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#feasibility' || hash === '#feasibility-check') {
        return api.getToken() ? 'feasibility' : 'landing';
      }
    }
    return 'landing';
  });
  const [accountOpen, setAccountOpen] = useState(() => {
    if (typeof window === 'undefined' || api.getToken()) return false;
    return ['#feasibility', '#feasibility-check'].includes(window.location.hash.toLowerCase());
  });
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let active = true;
    void clearLegacyIdentityFiles();
    if (!api.getToken()) return;
    api.getCurrentUser()
      .then((currentUser) => { if (active) setUser(currentUser); })
      .catch(() => { if (active) setUser(null); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#feasibility' || hash === '#feasibility-check') {
        if (api.getToken()) setView('feasibility');
        else { setView('landing'); setAccountOpen(true); }
      } else if (hash === '#home' || hash === '') {
        setView('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const requestSignIn = () => { setUser(null); setAccountOpen(true); };
    window.addEventListener(AUTH_REQUIRED_EVENT, requestSignIn);
    return () => window.removeEventListener(AUTH_REQUIRED_EVENT, requestSignIn);
  }, []);

  const openFeasibility = () => {
    if (!api.getToken()) {
      setAccountOpen(true);
      return;
    }
    setView('feasibility');
    window.location.hash = 'feasibility-check';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToLanding = () => {
    setView('landing');
    window.location.hash = 'home';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setAccountOpen(false);
    try { sessionStorage.removeItem('udyogsaarthi-assessment-draft-v1'); } catch { /* Optional browser storage. */ }
    void clearLegacyIdentityFiles();
    backToLanding();
  };

  const accountSuccess = async () => {
    try {
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
      setAccountOpen(false);
      setView('feasibility');
      window.location.hash = 'feasibility-check';
    } catch {
      setUser(null);
      setAccountOpen(true);
    }
  };

  return (
    <>
      {view === 'feasibility' ? (
        <FeasibilityCheck onBackToLanding={backToLanding} onLogout={logout} user={user} />
      ) : (
        <div className="min-h-screen bg-white overflow-x-hidden">
          <a href="#main-content" className="skip-link">Skip to content</a>
          <Navbar onStart={openFeasibility} onSignIn={() => setAccountOpen(true)} onLogout={logout} user={user} />
          <main id="main-content">
            <HeroSection onOpenFeasibility={openFeasibility} />
            <HowItWorks />
            <OfficialBacking />
          </main>
          <Footer />
        </div>
      )}
      <AccountAccessModal open={accountOpen} onClose={() => setAccountOpen(false)} onSuccess={() => { void accountSuccess(); }} />
    </>
  );
}

export default App;
