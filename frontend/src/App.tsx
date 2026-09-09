import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import HowItWorks from './components/HowItWorks';
import PhoneGuidance from './components/PhoneGuidance';
import OfficialBacking from './components/OfficialBacking';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <PhoneGuidance />
      <OfficialBacking />
      <Footer />
    </div>
  );
}

export default App;
