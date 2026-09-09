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
    <div className="bg-olive-50 rounded-4xl p-6 sm:p-8 flex flex-col h-full">
      <span className="font-crimson text-[64px] sm:text-[80px] lg:text-[96px] leading-[0.9] tracking-[-0.03em] text-black">
        {number}
      </span>

      <div className="w-full h-px bg-black/80 mt-4 mb-4" />

      <h3 className="font-crimson text-[28px] sm:text-[32px] lg:text-[40px] leading-[1.05] tracking-[-0.04em] text-black">
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
    <section id="how-to" className="px-4 sm:px-8 lg:px-14 pt-16 sm:pt-20 lg:pt-24">
      <h2 className="font-crimson text-[40px] sm:text-[64px] md:text-[80px] lg:text-[96px] leading-[0.9] tracking-[-0.03em] text-black text-center sm:text-left mb-10 sm:mb-14">
        How does UdyogSaarthi Work?
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {STEPS.map((step) => (
          <StepCard key={step.number} {...step} />
        ))}
      </div>
    </section>
  );
}
