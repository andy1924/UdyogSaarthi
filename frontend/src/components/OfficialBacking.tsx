import { FileText, IndianRupee, MapPinned } from 'lucide-react';
import { Text } from '../lib/LanguageContext';
import BotanicalAccent from './BotanicalAccent';

const benefits = [
  { icon: MapPinned, title: 'Understand local demand', body: 'Compare your idea with mapped businesses and location data near you.' },
  { icon: IndianRupee, title: 'Plan funding clearly', body: 'See server-calculated contribution, loan, and repayment estimates.' },
  { icon: FileText, title: 'Prepare one project report', body: 'Turn your confirmed inputs into a downloadable DPR for discussion with a lender.' },
];

export default function OfficialBacking() {
  return (
    <section id="benefits" className="relative isolate overflow-hidden px-4 pb-16 sm:px-8 sm:pb-20 lg:px-10 lg:pb-24">
      <BotanicalAccent className="top-12" />
      <BotanicalAccent side="left" className="bottom-8 rotate-6 opacity-20" />
      <div className="relative mx-auto w-full max-w-[1320px] rounded-[2rem] bg-surface-container p-6 sm:p-10 lg:rounded-[2.5rem] lg:p-12">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary"><Text>Built for confident decisions</Text></p>
          <h2 className="mt-3 font-crimson text-4xl font-semibold leading-tight text-primary sm:text-5xl"><Text>Useful answers, without the paperwork maze</Text></h2>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {benefits.map(({ icon: Icon, title, body }) => <article key={title} className="rounded-3xl border border-outline-variant/60 bg-white p-6 shadow-[0_8px_28px_rgb(23_33_13_/_0.05)] sm:p-7">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-white"><Icon size={23} aria-hidden="true" /></span>
            <h3 className="mt-5 text-xl font-bold text-primary"><Text>{title}</Text></h3>
            <p className="mt-2 text-base leading-7 text-on-surface-variant"><Text>{body}</Text></p>
          </article>)}
        </div>
      </div>
    </section>
  );
}
