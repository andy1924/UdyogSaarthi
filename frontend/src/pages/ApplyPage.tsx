import FeasibilityCheck from '../components/FeasibilityCheck';
import LockedSection from '../components/LockedSection';
import type { SessionUser } from '../lib/api';

interface ApplyPageProps {
  user: SessionUser | null;
  onSignIn: () => void;
  onBackToOverview: () => void;
}

export default function ApplyPage({ user, onSignIn, onBackToOverview }: ApplyPageProps) {
  if (!user) {
    return (
      <LockedSection
        title="Sign in to apply"
        message="Your assessment contains private business and location details. Sign in first — your progress is kept on this device."
        onSignIn={onSignIn}
      />
    );
  }
  return <FeasibilityCheck onBackToLanding={onBackToOverview} user={user} />;
}
