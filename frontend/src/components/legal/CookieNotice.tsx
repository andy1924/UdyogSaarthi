import { useEffect, useState } from 'react';

export const COOKIE_CONSENT_KEY = 'saarthi-cookie-consent';

type CookieNoticeProps = {
  onOpenCookiePolicy: () => void;
};

function readConsent(): string | null {
  try {
    return window.localStorage.getItem(COOKIE_CONSENT_KEY);
  } catch {
    return 'unavailable';
  }
}

export default function CookieNotice({ onOpenCookiePolicy }: CookieNoticeProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readConsent() === null) setVisible(true);
  }, []);

  const persist = (value: 'accepted' | 'declined') => {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
    } catch {
      // Storage unavailable (private mode): just dismiss for this session.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed bottom-4 inset-x-4 sm:inset-x-6 lg:inset-x-auto lg:right-8 lg:max-w-md z-40 bg-white rounded-4xl shadow-2xl border border-black/10 p-5 sm:p-6"
    >
      <p className="font-crimson text-xl leading-tight tracking-[-0.02em] text-black">
        A quick note on cookies
      </p>
      <p className="font-dm text-sm leading-relaxed text-black/70 mt-2">
        This demo remembers only your consent choice in your browser — no trackers, no ads.
      </p>
      <div className="flex flex-wrap items-center gap-2.5 mt-4">
        <button
          type="button"
          onClick={() => persist('accepted')}
          className="bg-olive-800 text-white font-dm font-bold text-sm px-5 py-2.5 rounded-full hover:bg-olive-800/90 transition-colors"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => persist('declined')}
          className="bg-olive-50 text-black font-dm font-bold text-sm px-5 py-2.5 rounded-full hover:bg-olive-50/70 transition-colors"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={onOpenCookiePolicy}
          className="font-roboto-mono text-xs text-olive-800 hover:underline transition-colors ml-auto"
        >
          Cookie Policy
        </button>
      </div>
    </div>
  );
}
