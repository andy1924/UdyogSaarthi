import { LegalIntro, LegalSection } from './LegalSection';

export default function PrivacyPolicy() {
  return (
    <div>
      <LegalIntro>
        UdyogSaarthi is a Digital Public Good demo for rural enterprise guidance. This policy
        explains what little data we handle, in line with the spirit of India&apos;s Digital
        Personal Data Protection Act, 2023 (DPDP Act).
      </LegalIntro>

      <LegalSection title="1. Demo first, data minimal">
        The platform runs as a sandbox demonstration. We do not perform any real KYC, identity, or
        credit approval. Assessment inputs are sent only to the application API when needed to
        calculate feasibility, funding, or generate a DPR.
      </LegalSection>

      <LegalSection title="2. What we collect">
        We process the account, applicant name, business, location, and scheme information you
        provide. The product does not request separate PAN or Aadhaar file uploads; DigiLocker
        Sandbox is the only document-verification route shown in the workflow.
      </LegalSection>

      <LegalSection title="3. Sandbox integrations">
        DigiLocker is clearly labelled as an optional sandbox connection and does not establish
        real identity verification. Location and business-data requests use the configured
        application services and may contact their stated data providers.
      </LegalSection>

      <LegalSection title="4. How we use inputs">
        Your inputs are used to render estimates, scheme matches, and DPR drafts. A generated DPR,
        its workflow status, and security audit events are stored by the application backend so an
        authenticated applicant can retrieve the report.
      </LegalSection>

      <LegalSection title="5. Cookies and local storage">
        We use a single local-storage flag for cookie consent and a local registry of your saved
        DPR references. There is no third-party advertising or cross-site tracking. See the
        Cookie Policy for details.
      </LegalSection>

      <LegalSection title="6. Sharing and disclosure">
        We do not sell or share personal data. In a future production deployment, any sharing
        with government registries or lenders would require your explicit consent and a separate
        published notice.
      </LegalSection>

      <LegalSection title="7. Your rights under the DPDP Act, 2023">
        You have the right to access, correct, and erase your personal data, to withdraw consent,
        and to seek grievance redressal. Because this demo stores data only in your browser, you
        can exercise these rights instantly by clearing the relevant inputs or local storage.
      </LegalSection>

      <LegalSection title="8. Retention and security">
        Assessment state persists for the browser session. Access tokens and report references use
        browser storage; sign out and clear this site&apos;s storage after using a shared device.
      </LegalSection>

      <LegalSection title="9. Contact">
        A production rollout must publish a designated Data Protection contact before accepting
        production identity documents.
      </LegalSection>
    </div>
  );
}
