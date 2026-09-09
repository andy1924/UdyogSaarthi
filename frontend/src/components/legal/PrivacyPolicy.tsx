const sectionTitle = 'font-crimson text-xl leading-tight tracking-[-0.02em] text-black mt-6 first:mt-0';
const sectionBody = 'font-dm text-sm sm:text-[15px] leading-relaxed text-black/75 mt-2';

export default function PrivacyPolicy() {
  return (
    <div>
      <p className="font-dm text-sm sm:text-[15px] leading-relaxed text-black/75">
        UdyogSaarthi is a Digital Public Good demo for rural enterprise guidance. This policy
        explains what little data we handle, in line with the spirit of India&apos;s Digital
        Personal Data Protection Act, 2023 (DPDP Act).
      </p>

      <h3 className={sectionTitle}>1. Demo first, data minimal</h3>
      <p className={sectionBody}>
        The platform runs as a sandbox demonstration. We do not perform any real KYC, identity
        verification, or credit appraisal. Details you type into the viability checker stay in
        your browser unless you explicitly choose to share them.
      </p>

      <h3 className={sectionTitle}>2. What we collect</h3>
      <p className={sectionBody}>
        Only what you voluntarily enter — such as enterprise type, location text, and scheme
        preferences — plus your cookie-consent choice stored locally. We do not ask for Aadhaar,
        PAN, bank details, or passwords.
      </p>

      <h3 className={sectionTitle}>3. Mock integrations</h3>
      <p className={sectionBody}>
        DigiLocker access, OTP verification, and location lookup shown in this demo are mocked or
        served through a Nominatim fallback. No documents are fetched, no OTP is sent, and no
        identity is verified.
      </p>

      <h3 className={sectionTitle}>4. How we use inputs</h3>
      <p className={sectionBody}>
        Your inputs are used only to render estimates, scheme matches, and DPR drafts on your
        device. Indicative figures are computed from published scheme rules and are not stored on
        any server in this demo build.
      </p>

      <h3 className={sectionTitle}>5. Cookies and local storage</h3>
      <p className={sectionBody}>
        We use a single local-storage flag for cookie consent and a local registry of your saved
        DPR references. There is no third-party advertising or cross-site tracking. See the
        Cookie Policy for details.
      </p>

      <h3 className={sectionTitle}>6. Sharing and disclosure</h3>
      <p className={sectionBody}>
        We do not sell or share personal data. In a future production deployment, any sharing
        with government registries or lenders would require your explicit consent and a separate
        published notice.
      </p>

      <h3 className={sectionTitle}>7. Your rights under the DPDP Act, 2023</h3>
      <p className={sectionBody}>
        You have the right to access, correct, and erase your personal data, to withdraw consent,
        and to seek grievance redressal. Because this demo stores data only in your browser, you
        can exercise these rights instantly by clearing the relevant inputs or local storage.
      </p>

      <h3 className={sectionTitle}>8. Retention and security</h3>
      <p className={sectionBody}>
        Browser-side entries persist only until you clear them. We apply reasonable safeguards
        appropriate to a demo, but you should never enter sensitive personal or financial
        information into this sandbox.
      </p>

      <h3 className={sectionTitle}>9. Contact</h3>
      <p className={sectionBody}>
        For privacy questions about this demo, use the Contact section of the site. A production
        rollout would publish a designated Data Protection contact here.
      </p>
    </div>
  );
}
