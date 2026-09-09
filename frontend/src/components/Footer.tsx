const FOOTER_LINKS = [
  'Viability Assessment',
  'Interest & Subvention Matrix',
  'Project Report Dossier',
  'Interest & Subvention Matrix',
  'Project Report Dossier',
  'Apex Desk Directory',
  'Interest & Subvention Matrix',
];

const POLICY_LINKS = ['Data Privacy Charter', 'Advisory Terms', 'Grievance Redressal'];

export default function Footer() {
  return (
    <footer className="px-4 sm:px-8 lg:px-14 pt-16 sm:pt-20 lg:pt-24 pb-6 sm:pb-8">
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-20">
        <div className="flex-1">
          <h3 className="font-crimson text-[40px] sm:text-[50px] lg:text-[60px] leading-[0.9] tracking-[-0.03em] text-black">
            UdyogSaarthi
          </h3>
          <p className="font-crimson text-[28px] sm:text-[32px] lg:text-[40px] leading-[0.9] tracking-[-0.03em] text-black/75 mt-3">
            Independent Rural Enterprise Advisory Platform
          </p>
          <p className="font-crimson text-base sm:text-lg lg:text-xl leading-[1] tracking-[-0.03em] text-black/95 mt-6 max-w-[694px]">
            A digital public utility built to remove friction from institutional credit and state subsidy adoption for rural innovators, self-help clusters, and micro-enterprises
          </p>
        </div>

        <div className="flex flex-col gap-1 lg:pt-2">
          {FOOTER_LINKS.map((link, index) => (
            <a
              key={`${link}-${index}`}
              href="#"
              className="font-dm font-bold text-lg lg:text-xl leading-[1.4] tracking-[-0.025em] text-black/75 hover:text-olive-800 transition-colors"
            >
              {link}
            </a>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-12 sm:mt-16 pt-6 border-t border-black/10 gap-4">
        <p className="font-roboto text-lg sm:text-xl lg:text-2xl leading-[1.33] text-neutral-750">
          &copy; 2026 UdyogSaarthi Rural Enterprise Advisory.
        </p>

        <div className="flex items-center gap-4 sm:gap-6">
          {POLICY_LINKS.map((link) => (
            <a
              key={link}
              href="#"
              className="font-roboto-mono text-xs leading-[1.4] tracking-[-0.01em] text-olive-800 hover:underline transition-colors"
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
