import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import HowItWorks from './components/HowItWorks';
import PhoneGuidance from './components/PhoneGuidance';
import OfficialBacking from './components/OfficialBacking';
import Footer from './components/Footer';
import FeasibilityCheck from './components/FeasibilityCheck';

type ViewMode = 'landing' | 'feasibility';

function App() {
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#feasibility' || hash === '#feasibility-check') {
        return 'feasibility';
      }
    }
    return 'landing';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#feasibility' || hash === '#feasibility-check') {
        setView('feasibility');
      } else if (hash === '#home' || hash === '') {
        setView('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const openFeasibility = () => {
    setView('feasibility');
    window.location.hash = 'feasibility-check';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToLanding = () => {
    setView('landing');
    window.location.hash = 'home';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (view === 'feasibility') {
    return <FeasibilityCheck onBackToLanding={backToLanding} />;
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main-content">
      <HeroSection onOpenFeasibility={openFeasibility} />
      <HowItWorks />
      <PhoneGuidance />
      <OfficialBacking />
      </main>
      <Footer />
    </div>
  );
}

export default App;
