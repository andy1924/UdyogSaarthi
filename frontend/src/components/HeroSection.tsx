import { useLanguage } from '../lib/LanguageContext';
import IMAGE_LEFT from '../assets/hero_left.png';
import IMAGE_RIGHT from '../assets/hero_right.png';
import IMAGE_CENTER from '../assets/hero_center.png';

interface HeroSectionProps {
  onOpenFeasibility?: () => void;
}

export default function HeroSection({ onOpenFeasibility }: HeroSectionProps) {
  const { t } = useLanguage();

  const handleOpenFeasibility = () => {
    if (onOpenFeasibility) {
      onOpenFeasibility();
    } else {
      window.location.hash = 'feasibility-check';
    }
  };

  return (
    <section id="home" className="px-4 sm:px-8 lg:px-14 pt-6 sm:pt-10">
      <h1 className="font-crimson text-[29px] sm:text-[58px] md:text-[76px] lg:text-[96px] xl:text-[88px] leading-[0.9] tracking-[-0.0425em] text-center text-black">
        Udyog-Saarthi
      </h1>

      <div className="hero-actions relative z-20 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-6 sm:mt-8">
        <button
          type="button"
          onClick={handleOpenFeasibility}
          className="hero-primary relative z-20 flex min-h-14 items-center justify-center bg-olive-800 text-white font-dm text-base leading-relaxed rounded-5xl px-6 sm:px-9 py-3 sm:py-4 hover:bg-olive-800/90 transition-colors cursor-pointer hover:shadow-lg"
        >
          {t('heroGetStarted')}
        </button>

        <a href="#how-to" className="relative z-20 flex min-h-14 items-center justify-center rounded-5xl bg-olive-50 px-8 py-3 font-dm text-base font-semibold text-primary transition-colors hover:bg-olive-100 sm:px-10 sm:py-4">
          {t('navHowTo')}
        </a>
      </div>

      <div className="relative mt-6 sm:mt-8 w-full">
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
