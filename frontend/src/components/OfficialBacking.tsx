interface StatCardProps {
  value: string;
  label: string;
}

const STATS: StatCardProps[] = [
  { value: '5% per annum', label: 'Concessional Credit Line' },
  { value: 'Up to Rs.50L', label: 'Direct Apex Coverage' },
  { value: '100% DBT', label: 'Zero Intermediary Leakage' },
  { value: '3 Mins', label: 'Instant AI DPR Generation' },
];

function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="border-[3px] sm:border-[5px] border-olive-800 bg-olive-100 rounded-4xl px-5 sm:px-6 py-5 sm:py-6 flex flex-col justify-center">
      <span className="font-crimson text-[28px] sm:text-[32px] lg:text-[40px] leading-[1.05] tracking-[-0.04em] text-black">
        {value}
      </span>
      <span className="font-crimson text-base sm:text-lg lg:text-xl leading-[1] tracking-[-0.03em] text-black mt-1">
        {label}
      </span>
    </div>
  );
}

export default function OfficialBacking() {
  return (
    <section id="benefits" className="px-4 sm:px-8 lg:px-14 pt-16 sm:pt-20 lg:pt-24">
      <div className="text-center">
        <p className="font-crimson text-base sm:text-lg lg:text-xl leading-[1] tracking-[-0.03em] text-black mb-3">
          EMPOWERING GRASSROOTS INNOVATION
        </p>
        <h2 className="font-crimson text-[36px] sm:text-[48px] lg:text-[64px] leading-[0.9] tracking-[-0.03em] text-black mb-4">
          Official Backing &amp; Concessional Credit
        </h2>
        <p className="font-crimson text-base sm:text-lg lg:text-[19px] leading-[1] tracking-[-0.03em] text-black max-w-3xl mx-auto">
          Integrated with apex financial corporations to unlock capital directly into beneficiary accounts without intermediaries
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mt-10 sm:mt-14">
        {STATS.map((stat) => (
          <StatCard key={stat.value} {...stat} />
        ))}
      </div>
    </section>
  );
}
