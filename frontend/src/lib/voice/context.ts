import { VOICE_LANGUAGES } from './languages';

export interface StepContext {
  step: number;
  stepTitle: string;
  locationText?: string;
  enterprise?: string;
  feasibilityVerdict?: string;
  marginPercent?: number;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
};

export function buildSystemPrompt(lang: string): string {
  const language = LANGUAGE_NAMES[lang] ?? LANGUAGE_NAMES.en;
  return [
    'You are UdyogSaarthi, a calm helper inside a rural business-plan wizard in India.',
    `Always reply in ${language}.`,
    'Keep replies short: two or three spoken sentences at most, plain words, no markdown or lists.',
    'Only explain the current step and what the user should do next.',
    'You never calculate, compute, restate or invent money figures such as TPC, loan amount, EQI or subsidy.',
    'If asked about money, tell the user the exact figure is already shown on screen and refer to Scheme rules v2024-11.',
    'You are not a government officer and you do not promise approval.',
  ].join(' ');
}

export function buildUserContext(context: StepContext, question: string): string {
  const lines = [`Current step: ${context.step} - ${context.stepTitle}`];
  if (context.enterprise) lines.push(`Business: ${context.enterprise}`);
  if (context.locationText) lines.push(`Location: ${context.locationText}`);
  if (context.feasibilityVerdict) lines.push(`Demand verdict: ${context.feasibilityVerdict}`);
  if (typeof context.marginPercent === 'number') lines.push(`Own contribution: ${context.marginPercent} percent`);
  lines.push(`User question: ${question}`);
  return lines.join('\n');
}

/** Display names for the languages the voice layer can speak. */
export const VOICE_LANGUAGE_NAMES = LANGUAGE_NAMES;
export const VOICE_LANGUAGE_CODES = Object.keys(VOICE_LANGUAGES);
