import HeroSection from '../components/HeroSection';
import HowItWorks from '../components/HowItWorks';
import OfficialBacking from '../components/OfficialBacking';
import Footer from '../components/Footer';
import WelcomeWalkthrough from '../components/WelcomeWalkthrough';

interface OverviewPageProps {
  onApply: () => void;
}

export default function OverviewPage({ onApply }: OverviewPageProps) {
  return (
    <div className="space-y-0">
      <WelcomeWalkthrough onStart={onApply} />
      <HeroSection onOpenFeasibility={onApply} />
      <HowItWorks />
      <OfficialBacking />
      <Footer />
    </div>
  );
}
