interface StepCardProps {
  number: string;
  title: string;
  description: string;
}

const STEPS: StepCardProps[] = [
  {
    number: '01',
    title: 'Describe Your Business',
    description:
      'Tell us your enterprise idea, location, and investment capacity via voice or text in your local language.',
  },
  {
    number: '02',
    title: 'AI Feasibility Analysis',
    description:
      'We instantly verify district-level demand, raw material access and target buyer data in real time',
  },
  {
    number: '03',
    title: 'Get Your DPR',
    description:
      'Receive a comprehensive bank-ready Detailed Project Report with financials, scheme mapping and calculations',
  },
];

function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="bg-olive-50 rounded-4xl p-5 sm:p-6 flex flex-col h-full">
      <span className="font-crimson text-[31px] sm:text-[29px] lg:text-[46px] leading-[0.9] tracking-[-0.03em] text-black">
        {number}
      </span>

      <div className="w-full h-px bg-black/80 mt-4 mb-4" />

      <h3 className="font-crimson text-[14px] sm:text-[16px] lg:text-[20px] leading-[1.05] tracking-[-0.04em] text-black">
        {title}
      </h3>

      <div className="w-full h-px bg-black/80 mt-4 mb-4" />

      <p className="font-crimson text-base sm:text-lg lg:text-xl leading-[1] tracking-[-0.03em] text-black">
        {description}
      </p>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how-to" className="px-4 sm:px-8 lg:px-14 pt-7 sm:pt-9 lg:pt-11">
      <h2 className="font-crimson text-[19px] sm:text-[31px] md:text-[29px] lg:text-[46px] leading-[0.9] tracking-[-0.03em] text-black text-center sm:text-left mb-10 sm:mb-14">
        How does UdyogSaarthi Work?
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
        {STEPS.map((step) => (
          <StepCard key={step.number} {...step} />
        ))}
      </div>
    </section>
  );
}
