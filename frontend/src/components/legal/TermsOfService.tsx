import { LegalIntro, LegalSection } from './LegalSection';

export default function TermsOfService() {
  return (
    <div>
      <LegalIntro>
        These terms govern your use of the UdyogSaarthi demonstration. By using the site, you
        agree to use it as an informational sandbox — not as a channel for credit, subsidy, or
        legal decisions.
      </LegalIntro>

      <LegalSection title="1. Nature of the service">
        UdyogSaarthi is a Digital Public Good demo that illustrates how viability assessment,
        scheme matching, and DPR drafting could work. Nothing on this site constitutes an offer,
        approval, or promise of credit or subsidy.
      </LegalSection>

      <LegalSection title="2. Indicative information only">
        Subsidy figures, eligibility hints, and DPR drafts are indicative and derived from
        published scheme rules (v2024-11). Always verify with the issuing department, District
        Industries Centre, or lender before acting.
      </LegalSection>

      <LegalSection title="3. Mock workflows">
        DigiLocker remains an explicitly labelled sandbox connection. Map and directory results
        come from configured application data services. No real KYC or official credit decision
        is performed by the sandbox workflow.
      </LegalSection>

      <LegalSection title="4. Fair and lawful use">
        You agree not to misuse the demo, attempt to breach its security, submit unlawful
        content, or represent demo outputs as official documents or approvals.
      </LegalSection>

      <LegalSection title="5. Intellectual property">
        The UdyogSaarthi interface, copy, and demo content are provided for public-good
        demonstration. Scheme names and official marks belong to their respective authorities.
      </LegalSection>

      <LegalSection title="6. Limitation of liability">
        To the fullest extent permitted by Indian law, the demo is provided &ldquo;as is&rdquo;
        without warranties. We are not liable for decisions taken on the basis of indicative
        demo outputs.
      </LegalSection>

      <LegalSection title="7. Grievance redressal">
        If you encounter inaccurate content or misuse of this demo, raise it through the Contact
        section with the subject &ldquo;Grievance — UdyogSaarthi demo&rdquo;. We aim to
        acknowledge demo-related grievances within 7 working days. This is a demo-level channel,
        not a statutory CPGRAMS appeal.
      </LegalSection>

      <LegalSection title="8. Changes to these terms">
        We may update these terms as the demo evolves. Continued use after an update constitutes
        acceptance of the revised terms.
      </LegalSection>

      <LegalSection title="9. Governing law">
        These terms are governed by the laws of India. A production deployment would specify
        jurisdiction and a nodal officer here.
      </LegalSection>
    </div>
  );
}
