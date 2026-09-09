const sectionTitle = 'font-crimson text-xl leading-tight tracking-[-0.02em] text-black mt-6 first:mt-0';
const sectionBody = 'font-dm text-sm sm:text-[15px] leading-relaxed text-black/75 mt-2';

export default function CookiePolicy() {
  return (
    <div>
      <p className="font-dm text-sm sm:text-[15px] leading-relaxed text-black/75">
        This demo uses minimal browser storage — no advertising cookies and no third-party
        trackers. This policy explains the one choice we remember: your cookie consent.
      </p>

      <h3 className={sectionTitle}>1. What we store</h3>
      <p className={sectionBody}>
        A single local-storage key, <code className="font-roboto-mono text-[13px] bg-olive-50 px-1.5 py-0.5 rounded">saarthi-cookie-consent</code>,
        records whether you accepted or declined optional storage. Your saved DPR references
        (registry keys) are also kept locally in your browser.
      </p>

      <h3 className={sectionTitle}>2. Strictly necessary storage</h3>
      <p className={sectionBody}>
        Consent memory and on-device draft inputs are strictly necessary for the demo to
        function. They never leave your device and are not transmitted to any analytics
        provider.
      </p>

      <h3 className={sectionTitle}>3. No third-party tracking</h3>
      <p className={sectionBody}>
        We do not embed advertising, social-media, or analytics beacons in this build. Fonts are
        loaded from a CDN; map tiles and Nominatim fallback lookups follow their own
        provider policies when you use those features.
      </p>

      <h3 className={sectionTitle}>4. Your consent choice</h3>
      <p className={sectionBody}>
        Accepting the banner lets the demo remember your preference and keep lightweight local
        conveniences. Declining is equally valid — the demo keeps working, and we simply ask
        again on your next visit.
      </p>

      <h3 className={sectionTitle}>5. Managing or withdrawing consent</h3>
      <p className={sectionBody}>
        Clear the <code className="font-roboto-mono text-[13px] bg-olive-50 px-1.5 py-0.5 rounded">saarthi-cookie-consent</code> key
        (or all site data) in your browser settings to reset your choice; the banner will
        reappear. You can also block storage per-site without breaking core content.
      </p>

      <h3 className={sectionTitle}>6. Changes to this policy</h3>
      <p className={sectionBody}>
        If a production release introduces analytics or authentication cookies, this policy will
        be updated first with a fresh consent prompt.
      </p>

      <h3 className={sectionTitle}>7. Contact</h3>
      <p className={sectionBody}>
        Questions about storage in this demo can be sent via the Contact section of the site.
      </p>
    </div>
  );
}
