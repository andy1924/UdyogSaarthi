const sectionTitle = 'font-crimson text-xl leading-tight tracking-[-0.02em] text-black mt-6 first:mt-0';
const sectionBody = 'font-dm text-sm sm:text-[15px] leading-relaxed text-black/75 mt-2';

export default function TermsOfService() {
  return (
    <div>
      <p className="font-dm text-sm sm:text-[15px] leading-relaxed text-black/75">
        These terms govern your use of the UdyogSaarthi demonstration. By using the site, you
        agree to use it as an informational sandbox — not as a channel for credit, subsidy, or
        legal decisions.
      </p>

      <h3 className={sectionTitle}>1. Nature of the service</h3>
      <p className={sectionBody}>
        UdyogSaarthi is a Digital Public Good demo that illustrates how viability assessment,
        scheme matching, and DPR drafting could work. Nothing on this site constitutes an offer,
        approval, or promise of credit or subsidy.
      </p>

      <h3 className={sectionTitle}>2. Indicative information only</h3>
      <p className={sectionBody}>
        Subsidy figures, eligibility hints, and DPR drafts are indicative and derived from
        published scheme rules (v2024-11). Always verify with the issuing department, District
        Industries Centre, or lender before acting.
      </p>

      <h3 className={sectionTitle}>3. Mock workflows</h3>
      <p className={sectionBody}>
        DigiLocker pulls, OTP logins, and map-based directory results are simulated or served via
        a Nominatim fallback for demonstration. No real KYC is performed and no official record
        is created or modified.
      </p>

      <h3 className={sectionTitle}>4. Fair and lawful use</h3>
      <p className={sectionBody}>
        You agree not to misuse the demo, attempt to breach its security, submit unlawful
        content, or represent demo outputs as official documents or approvals.
      </p>

      <h3 className={sectionTitle}>5. Intellectual property</h3>
      <p className={sectionBody}>
        The UdyogSaarthi interface, copy, and demo content are provided for public-good
        demonstration. Scheme names and official marks belong to their respective authorities.
      </p>

      <h3 className={sectionTitle}>6. Limitation of liability</h3>
      <p className={sectionBody}>
        To the fullest extent permitted by Indian law, the demo is provided &ldquo;as is&rdquo;
        without warranties. We are not liable for decisions taken on the basis of indicative
        demo outputs.
      </p>

      <h3 className={sectionTitle}>7. Grievance redressal</h3>
      <p className={sectionBody}>
        If you encounter inaccurate content or misuse of this demo, raise it through the Contact
        section with the subject &ldquo;Grievance — UdyogSaarthi demo&rdquo;. We aim to
        acknowledge demo-related grievances within 7 working days. This is a demo-level channel,
        not a statutory CPGRAMS appeal.
      </p>

      <h3 className={sectionTitle}>8. Changes to these terms</h3>
      <p className={sectionBody}>
        We may update these terms as the demo evolves. Continued use after an update constitutes
        acceptance of the revised terms.
      </p>

      <h3 className={sectionTitle}>9. Governing law</h3>
      <p className={sectionBody}>
        These terms are governed by the laws of India. A production deployment would specify
        jurisdiction and a nodal officer here.
      </p>
    </div>
  );
}
