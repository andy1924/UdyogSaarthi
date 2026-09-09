import { useEffect, useRef, type ReactNode } from 'react';

type LegalModalProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
};

export default function LegalModal({ open, title, subtitle, onClose, children }: LegalModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      aria-hidden={false}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-2xl max-h-[82vh] flex flex-col bg-white rounded-4xl overflow-hidden shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 pb-4 border-b border-black/10">
          <div>
            <h2 className="font-crimson text-2xl sm:text-3xl leading-none tracking-[-0.03em] text-black">
              {title}
            </h2>
            {subtitle ? (
              <p className="font-dm text-sm text-black/60 mt-2">{subtitle}</p>
            ) : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex-shrink-0 w-9 h-9 rounded-full bg-olive-50 text-black font-dm font-bold hover:bg-olive-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="px-6 sm:px-8 py-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
