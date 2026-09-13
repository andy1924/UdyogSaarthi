import type { ReactNode } from 'react';

const sectionTitleClass =
  'font-crimson text-xl leading-tight tracking-[-0.02em] text-black mt-6 first:mt-0';
const sectionBodyClass = 'font-dm text-sm sm:text-[15px] leading-relaxed text-black/75 mt-2';
const introClass = 'font-dm text-sm sm:text-[15px] leading-relaxed text-black/75';
const codeClass = 'font-roboto-mono text-[13px] bg-olive-50 px-1.5 py-0.5 rounded';

export function LegalIntro({ children }: { children: ReactNode }) {
  return <p className={introClass}>{children}</p>;
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <h3 className={sectionTitleClass}>{title}</h3>
      <p className={sectionBodyClass}>{children}</p>
    </>
  );
}

export function LegalCode({ children }: { children: ReactNode }) {
  return <code className={codeClass}>{children}</code>;
}
