import LOGO from '../assets/Logo.png';

interface Props {
  compact?: boolean;
  mobileCompact?: boolean;
  className?: string;
}

export default function BrandLogo({ compact = false, mobileCompact = false, className = '' }: Props) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-olive-50 p-1 ring-1 ring-olive-800/15">
        <img src={LOGO} alt="" className="h-full w-full object-contain" aria-hidden="true" />
      </span>
      {!compact && <span className={`${mobileCompact ? 'hidden sm:inline' : ''} truncate text-base font-bold tracking-[-0.02em] text-primary sm:text-lg`}>UdyogSaarthi</span>}
    </span>
  );
}
