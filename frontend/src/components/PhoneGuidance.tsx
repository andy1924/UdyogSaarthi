import { Phone } from 'lucide-react';

export default function PhoneGuidance() {
  return (
    <section className="mt-16 sm:mt-20 lg:mt-24 mx-4 sm:mx-0">
      <div className="bg-olive-400 rounded-4xl sm:rounded-none w-full py-14 sm:py-16 lg:py-20 px-4 sm:px-8 lg:px-14">
        <h2 className="font-crimson text-[32px] sm:text-[48px] md:text-[60px] lg:text-[75px] leading-[0.9] tracking-[-0.03em] text-white text-center mb-8 sm:mb-10">
          Need Phone Guidance in your language?
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-center max-w-3xl mx-auto">
          <div className="bg-olive-50 rounded-4xl flex flex-col sm:flex-row items-center w-full sm:w-auto">
            <div className="flex items-center gap-4 px-8 sm:px-10 py-6 sm:py-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center flex-shrink-0">
                <Phone size={32} className="text-black" />
              </div>
              <span className="font-crimson text-[28px] sm:text-[32px] lg:text-[40px] leading-[1.05] tracking-[-0.04em] text-black whitespace-nowrap">
                +91 89831 72377
              </span>
            </div>

            <div className="w-full h-px sm:w-px sm:h-24 bg-black/20 mx-0 sm:mx-0" />

            <div className="flex flex-col items-center sm:items-start px-8 sm:px-10 py-6 sm:py-5">
              <span className="font-crimson text-[28px] sm:text-[32px] lg:text-[40px] leading-[1.05] tracking-[-0.04em] text-black">
                Monday-Saturday
              </span>
              <span className="font-crimson text-[28px] sm:text-[32px] lg:text-[40px] leading-[1.05] tracking-[-0.04em] text-black">
                0900-1900 hrs
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
