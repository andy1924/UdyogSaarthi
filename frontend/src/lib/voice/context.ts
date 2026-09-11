import { VOICE_LANGUAGES } from './languages';

export interface StepContext {
  step: number;
  stepTitle: string;
  /**
   * What the page is, for the routes that are not the wizard. The assistant
   * answers about whatever is on screen, and "My applications" is a real answer
   * where "step 1 - Location" would be a lie.
   */
  page?: string;
  /** The page's own words, clipped. Set at ask time from the live DOM. */
  pageText?: string;
  locationText?: string;
  enterprise?: string;
  feasibilityVerdict?: string;
  marginPercent?: number;
  /** Everything the demand step puts on screen, so the assistant can explain it. */
  radiusMeters?: number;
  nearbyUnits?: number;
  competitionScore?: number;
  feasibilityScore?: number;
  district?: string;
  swot?: {
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    threats?: string[];
  };
  opportunities?: Array<{ title: string; reason: string }>;
  identityVerified?: boolean;
  reportReady?: boolean;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
};

/**
 * How much of the page goes to the brain: roughly a thousand tokens. A DPR page
 * can run to tens of thousands of characters, and the tail of a long report
 * costs more than it explains.
 */
export const PAGE_SNAPSHOT_CHARS = 4000;

/**
 * The chrome that sits inside `main` but is not the page: the shell's own
 * footer, the demo cookie banner, and anything decorative or hidden.
 */
const PAGE_CHROME = 'footer, nav, script, style, [role="dialog"], [aria-hidden="true"], .cookie-notice';

/**
 * The page's own words. `main` is the shell's content landmark, so the header,
 * the nav and the orb's panel are outside it already; the chrome that lives
 * inside it is hidden for the length of one synchronous read.
 *
 * `innerText` rather than `textContent`, because only `innerText` keeps the
 * page's own line breaks - a detached clone has no layout, so it would hand
 * back "UdyogSaarthiStart your plan" as one word. Nothing paints between the
 * hide and the restore, and the previous inline `display` is put back exactly.
 *
 * Values in form fields are not text nodes, so they are not here; the wizard
 * snapshot carries those separately.
 */
export function pageText(root: ParentNode = document): string {
  const main = root.querySelector('main');
  if (!main) return '';
  const hidden: Array<[HTMLElement, string]> = [];
  for (const node of main.querySelectorAll(PAGE_CHROME)) {
    const element = node as HTMLElement;
    hidden.push([element, element.style.display]);
    element.style.display = 'none';
  }
  try {
    return (main as HTMLElement).innerText.replace(/\s+/g, ' ').trim();
  } finally {
    for (const [element, display] of hidden) element.style.display = display;
  }
}

/** `pageText`, cut to what the brain is given. Says so when it was cut. */
export function clipPage(text: string, maxChars = PAGE_SNAPSHOT_CHARS): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, maxChars).trimEnd()} [page continues]`;
}

/**
 * The read-aloud instruction.
 *
 * Reading a page aloud is an overview, not a performance. The applicant pressed
 * a button to hear what is on the page, so they want the shape of it - what it
 * is for, the main controls, the numbers that matter - rather than a
 * word-for-word recital of a page that was written for the eye.
 */
export function summaryInstruction(): string {
  return [
    'The applicant pressed "read this page aloud" and is listening rather than looking at the screen.',
    'Give a short spoken overview of this page: what it is for, and then the main things on it -',
    'the buttons they can press, the fields they can fill, and the headings or numbers that matter.',
    'Name the controls by the words that are actually on them, say what the main one does, and finish with the single best next action.',
    'Do not read the page out word for word and do not list everything: pick what somebody seeing this page for the first time needs.',
  ].join(' ');
}

export function buildSystemPrompt(lang: string, extra?: string): string {
  const language = LANGUAGE_NAMES[lang] ?? LANGUAGE_NAMES.en;
  const lines = [
    'You are UdyogSaarthi, a calm helper inside a rural business-plan wizard in India.',
    `Always reply in ${language}.`,
    'Answer with four to six short spoken sentences. Explain the topic fully so the applicant actually understands it, instead of giving one thin line.',
    'Keep the whole reply under about two hundred and fifty words: it is spoken aloud, and a reply longer than that takes minutes to hear.',
    'Every answer must cover three things in order: what the thing on screen is, what it means for this applicant in plain words, and the single next action to take.',
    'When asked what the page or step is about, describe the purpose of this step in the wizard, what the applicant has to enter or decide here, what the cards and numbers on screen show, and what the next step will be.',
    'If you use a term like feasibility score, competition score, radius or own contribution, explain it in plain words in the same sentence.',
    'Write for the ear: plain sentences only, no markdown, no bullet points, no headings and no emoji, because your reply is read aloud.',
    'Answer from the SITE SNAPSHOT in the user message: the named values it lists and the page text under it, which is what the applicant can see right now.',
    'When the snapshot carries page text, use it: quote the words and numbers that are actually on the page, and say plainly what they mean instead of telling the applicant to go and look.',
    'When the snapshot names a current page instead of a step, the user is somewhere else in the app: answer about that page, its purpose and what can be done on it, not about the wizard.',
    'Never answer with "check the screen" or "see the page" on its own. Name the on-screen values that matter, say what they mean in plain words, and finish with the one action to take next.',
    'For a score question, explain that the feasibility score is 100 minus the competition score, and use the nearby-unit count and the demand verdict from the snapshot. Never invent a number that is not in the snapshot.',
    'You never calculate, compute or invent money figures such as TPC, loan amount, EQI or subsidy.',
    'If asked about money, tell the user the exact figure is already shown on screen and refer to Scheme rules v2024-11.',
    'You are not a government officer and you do not promise approval.',
  ];
  if (extra) lines.push(extra);
  // The language pin stays last: a small model drifts back to English when the
  // final thing it read was an instruction in English.
  lines.push(`Remember: every sentence is in ${language}. Never answer in English unless ${language} is English, and never mix two languages in one reply.`);
  return lines.join(' ');
}

export function buildUserContext(context: StepContext, question: string): string {
  const lines = [context.page
    ? `Current page: ${context.page}`
    : `Current step: ${context.step} - ${context.stepTitle}`];
  if (context.enterprise) lines.push(`Business: ${context.enterprise}`);
  if (context.locationText) lines.push(`Location: ${context.locationText}`);
  if (context.district) lines.push(`District: ${context.district}`);
  if (typeof context.radiusMeters === 'number') {
    lines.push(`Local market radius: ${Math.round(context.radiusMeters / 1000)} km`);
  }
  if (context.feasibilityVerdict) lines.push(`Demand verdict: ${context.feasibilityVerdict}`);
  if (typeof context.feasibilityScore === 'number') {
    lines.push(`Feasibility score on screen: ${context.feasibilityScore} out of 100 (100 minus the competition score)`);
  }
  if (typeof context.competitionScore === 'number') {
    lines.push(`Competition score on screen: ${context.competitionScore} out of 100`);
  }
  if (typeof context.nearbyUnits === 'number') {
    lines.push(`Registered units nearby: ${context.nearbyUnits}`);
  }
  if (typeof context.marginPercent === 'number') lines.push(`Own contribution: ${context.marginPercent} percent`);
  const swot: Array<[string, string[] | undefined]> = [
    ['Strengths', context.swot?.strengths],
    ['Weaknesses', context.swot?.weaknesses],
    ['Opportunities', context.swot?.opportunities],
    ['Threats', context.swot?.threats],
  ];
  for (const [label, values] of swot) {
    if (values?.length) lines.push(`${label}: ${values.join(' ')}`);
  }
  if (context.opportunities?.length) {
    lines.push(`Related opportunities: ${context.opportunities
      .map((item) => `${item.title} - ${item.reason}`)
      .join('; ')}`);
  }
  if (typeof context.identityVerified === 'boolean') {
    lines.push(`Identity verified: ${context.identityVerified ? 'yes' : 'not yet'}`);
  }
  if (typeof context.reportReady === 'boolean') {
    lines.push(`Project report generated: ${context.reportReady ? 'yes' : 'no'}`);
  }
  if (context.pageText) {
    lines.push('SITE SNAPSHOT:');
    lines.push(context.pageText);
  }
  lines.push(`User question: ${question}`);
  return lines.join('\n');
}

/** Display names for the languages the voice layer can speak. */
export const VOICE_LANGUAGE_NAMES = LANGUAGE_NAMES;
export const VOICE_LANGUAGE_CODES = Object.keys(VOICE_LANGUAGES);
