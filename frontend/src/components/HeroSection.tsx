import { Mic } from 'lucide-react';

const IMAGE_LEFT =
  'src/assets/hero_left.png'
const IMAGE_RIGHT =
  'src/assets/hero_right.png'
const IMAGE_CENTER =
  'src/assets/hero_center.png'
interface HeroSectionProps {
  onOpenFeasibility?: () => void;
}

export default function HeroSection({ onOpenFeasibility }: HeroSectionProps) {
  return (
    <section className="px-4 sm:px-8 lg:px-14 pt-4 sm:pt-6">
      <h1 className="font-crimson text-[60px] sm:text-[120px] md:text-[160px] lg:text-[200px] xl:text-[230px] leading-[0.9] tracking-[-0.0425em] text-center text-black">
        Udyog-Saarthi
      </h1>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-6 sm:mt-8">
        <button
          onClick={onOpenFeasibility}
          className="flex items-center justify-center bg-olive-800 text-white font-crimson text-xl sm:text-2xl md:text-[45px] leading-[0.9] tracking-[-0.0425em] rounded-5xl px-8 sm:px-12 py-4 sm:py-5 hover:bg-olive-800/90 transition-all cursor-pointer hover:shadow-lg active:scale-95"
        >
          Feasibility Checker
        </button>

        <div className="flex items-center gap-3 bg-olive-50 rounded-5xl px-8 sm:px-12 py-3 sm:py-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-olive-800 flex items-center justify-center flex-shrink-0">
            <Mic size={20} className="text-white" />
          </div>
          <span className="font-crimson text-xl sm:text-2xl md:text-[50px] leading-[0.9] tracking-[-0.0425em] text-black">
            Voice-Saarthi
          </span>
        </div>
      </div>

      <div className="relative mt-8 sm:mt-10 w-full">
        {/* Olive background */}
        <div className="rounded-4xl bg-olive-400 w-full aspect-[1305/491]" />
        {/* Images aligned on the olive background */}
        <div className="absolute inset-0">
          {/* Left person (409×623, portrait) */}
          <img
            src={IMAGE_LEFT}
            alt="Rural entrepreneur"
            className="absolute bottom-[-9%] left-[2%] sm:left-[-5%] h-[135%] w-auto max-w-none z-[5]"
          />
          {/* Center person (815×454, landscape) */}
          <img
            src={IMAGE_CENTER}
            alt="Elderly rural woman smiling"
            className="absolute bottom-[-1%] left-1/2 -translate-x-1/2 h-[95%] w-auto max-w-none z-10"
          />
          {/* Right person (941×685, landscape) */}
          <img
            src={IMAGE_RIGHT}
            alt="Young rural professional"
            className="absolute bottom-[-3%] right-[2%] sm:right-[10%] h-[120%] w-auto max-w-none z-[5]"
          />
        </div>
      </div>
    </section>
  );
}
