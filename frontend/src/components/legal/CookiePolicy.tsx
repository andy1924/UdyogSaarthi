import { LegalCode, LegalIntro, LegalSection } from './LegalSection';

export default function CookiePolicy() {
  return (
    <div>
      <LegalIntro>
        This demo uses minimal browser storage — no advertising cookies and no third-party
        trackers. This policy explains the one choice we remember: your cookie consent.
      </LegalIntro>

      <LegalSection title="1. What we store">
        A single local-storage key, <LegalCode>saarthi-cookie-consent</LegalCode>,
        records whether you accepted or declined optional storage. Your saved DPR references
        (registry keys) are also kept locally in your browser.
      </LegalSection>

      <LegalSection title="2. Strictly necessary storage">
        Consent memory and on-device draft state are necessary for the workflow to survive a
        refresh. Identity files selected for the draft are stored in IndexedDB; no analytics
        provider receives them.
      </LegalSection>

      <LegalSection title="3. No third-party tracking">
        We do not embed advertising, social-media, or analytics beacons in this build. Fonts are
        loaded from a CDN; configured map and translation services follow their own provider
        policies when you use those features.
      </LegalSection>

      <LegalSection title="4. Your consent choice">
        Accepting the banner lets the demo remember your preference and keep lightweight local
        conveniences. Declining is equally valid — the demo keeps working, and we simply ask
        again on your next visit.
      </LegalSection>

      <LegalSection title="5. Managing or withdrawing consent">
        Clear the <LegalCode>saarthi-cookie-consent</LegalCode> key
        (or all site data) in your browser settings to reset your choice; the banner will
        reappear. You can also block storage per-site without breaking core content.
      </LegalSection>

      <LegalSection title="6. Changes to this policy">
        If a production release introduces analytics or authentication cookies, this policy will
        be updated first with a fresh consent prompt.
      </LegalSection>
    </div>
  );
}
