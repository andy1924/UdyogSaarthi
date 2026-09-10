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
        credit approval. Assessment inputs are sent only to the application API when needed to
        calculate feasibility, funding, or generate a DPR.
      </p>

      <h3 className={sectionTitle}>2. What we collect</h3>
      <p className={sectionBody}>
        We process the account, applicant name, business, location, and scheme information you
        provide. PAN and Aadhaar files selected in the identity step are stored locally in your
        browser&apos;s IndexedDB draft and are not uploaded by this release.
      </p>

      <h3 className={sectionTitle}>3. Sandbox integrations</h3>
      <p className={sectionBody}>
        DigiLocker is clearly labelled as an optional sandbox connection and does not establish
        real identity verification. Location and business-data requests use the configured
        application services and may contact their stated data providers.
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
        Assessment state persists for the browser session. Selected identity files remain in
        IndexedDB until site data is cleared or replaced. Clear this site&apos;s storage on a shared
        device after finishing your draft.
      </p>

      <h3 className={sectionTitle}>9. Contact</h3>
      <p className={sectionBody}>
        A production rollout must publish a designated Data Protection contact before accepting
        production identity documents.
      </p>
    </div>
  );
}
