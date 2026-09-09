import { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';

const NAV_ITEMS = ['Benefits', 'Specifications', 'How-to', 'Contact Us'];

const LOGO_URL =
  'https://s3-alpha-sig.figma.com/img/9e6e/ce29/563027c2088c16dc05bbc1071b0d25ff?Expires=1789344000&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=c8mL~9GPabDeNL9aIb6l46yrs6pRkcHFdoTcozn17jji-P~7chdA9T7wp5OKZZ~OSGXBrmCWUwRad3bKOH93BecR5xWiY~IdQZgTGQPZdWr5K~XbsLzK329LeT1j7-g5S3Ea46ds4ipLTJoOadv8wwkEWhRF2oM56ttZbGtxqaxz9ADmpzsE8ZI12SjkYk64ymGOR4hgI32tciYcpv2cYex96fL3Z9P5y0KZFl-W7ai1xHL-tCv-H-7fyI1rNd2q~ysjDO1W4xnIgeKZai1kA8Hv9MHirqbhKSkak29cKYjQ-Lr~VkCQO7q6QRrs86hWXzTIGK6c1aded5pm37Ygrw__';

interface NavbarProps {
  onOpenFeasibility?: () => void;
}

export default function Navbar({ onOpenFeasibility }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="w-full px-4 sm:px-8 lg:px-14 pt-4 pb-0">
      <nav className="flex items-center justify-between py-4 lg:py-5 border-b border-black/10">
        <div className="flex-shrink-0">
          <img
            src={LOGO_URL}
            alt="UdyogSaarthi Logo"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
          />
        </div>

        <div className="hidden md:flex items-center gap-4 lg:gap-6 bg-white/40 backdrop-blur-[30px] rounded-full px-6 py-2.5">
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="font-dm font-bold text-sm lg:text-base text-black tracking-tight hover:text-olive-800 transition-colors"
            >
              {item}
            </a>
          ))}
          {onOpenFeasibility && (
            <button
              onClick={onOpenFeasibility}
              className="font-dm font-bold text-xs lg:text-sm bg-olive-800 text-white rounded-full px-4 py-1.5 hover:bg-olive-800/90 transition-colors cursor-pointer"
            >
              Feasibility Check
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button className="hidden md:flex items-center gap-1 bg-olive-50 rounded-full px-4 lg:px-5 py-2.5 font-dm font-bold text-sm text-black tracking-tight hover:bg-olive-50/80 transition-colors">
            EN/हिं
            <ChevronDown size={16} />
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-black"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-black/10 py-4 space-y-3">
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setMobileOpen(false)}
              className="block font-dm font-bold text-base text-black tracking-tight px-2 py-2 hover:text-olive-800 transition-colors"
            >
              {item}
            </a>
          ))}
          {onOpenFeasibility && (
            <button
              onClick={() => {
                setMobileOpen(false);
                onOpenFeasibility();
              }}
              className="w-full text-left font-dm font-bold text-base text-olive-800 tracking-tight px-2 py-2 hover:bg-olive-50 rounded transition-colors"
            >
              Feasibility Check →
            </button>
          )}
          <button className="flex items-center gap-1 bg-olive-50 rounded-full px-5 py-2.5 font-dm font-bold text-sm text-black tracking-tight mx-2">
            EN/हिं
            <ChevronDown size={16} />
          </button>
        </div>
      )}
    </header>
  );
}
