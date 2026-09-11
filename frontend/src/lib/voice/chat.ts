import { offlineAnswer } from './answers';
import { buildSystemPrompt, buildUserContext, summaryInstruction, type StepContext } from './context';

export interface ChatConfig {
  url: string;
  key: string;
  model: string;
}

/** The three optional vars the voice brain reads; `import.meta.env` satisfies it. */
export interface VoiceChatEnv {
  VITE_VOICE_CHAT_URL?: string;
  VITE_VOICE_CHAT_KEY?: string;
  VITE_VOICE_CHAT_MODEL?: string;
}

export function readChatConfig(env: VoiceChatEnv): ChatConfig {
  return {
    url: env.VITE_VOICE_CHAT_URL?.trim() ?? '',
    key: env.VITE_VOICE_CHAT_KEY?.trim() ?? '',
    model: env.VITE_VOICE_CHAT_MODEL?.trim() || 'gpt-4o-mini',
  };
}

/**
 * A spoken answer is asked for in about two hundred and fifty words, which is
 * some 350 tokens of English but nearer 750 of Devanagari, where a word costs
 * roughly three tokens. 600 cut long Hindi answers off mid-sentence and the
 * voice then stopped dead at the truncation, so the cap sits where the longest
 * answer the prompt allows still fits. Measured: a 1275-character English reply
 * came back with finish_reason "stop" well inside this budget.
 */
const MAX_REPLY_TOKENS = 1200;

interface ModelRequest {
  config: ChatConfig;
  signal: AbortSignal;
  system: string;
  user: string;
}

/**
 * One call, one answer.
 *
 * Null covers every way a model can decline to answer - no body, a non-2xx, a
 * dropped connection, an aborted turn - because each caller has its own idea of
 * what to do next: a question falls back to the canned answer, a page summary
 * falls back to reading the page.
 */
async function askModel({ config, signal, system, user }: ModelRequest): Promise<string | null> {
  try {
    const response = await fetch(config.url, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...(config.key ? { Authorization: `Bearer ${config.key}` } : {}),
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.4,
        max_tokens: MAX_REPLY_TOKENS,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * A small local model, and a gateway that is out of credit, both answer in
 * English while the user selected Hindi - and HTTP 200 makes that look like a
 * good reply. MMS-TTS needs Devanagari, and an English answer to a Hindi
 * question is worse than the canned one, so a Hindi turn with no Devanagari in
 * it is treated as no reply at all.
 */
function answersInLanguage(text: string, lang: string): boolean {
  return lang !== 'hi' || /[\u0900-\u097F]/.test(text);
}

export interface ReplyRequest {
  question: string;
  context: StepContext;
  lang: string;
  signal: AbortSignal;
  config?: ChatConfig;
  /** Extra system text for this call, e.g. the read-aloud overview instruction. */
  instruction?: string;
}

export async function requestReply({
  question,
  context,
  lang,
  signal,
  config = readChatConfig(import.meta.env),
  instruction,
}: ReplyRequest): Promise<string> {
  if (!config.url) return offlineAnswer(question, context, lang);
  const text = await askModel({
    config,
    signal,
    system: buildSystemPrompt(lang, instruction),
    user: buildUserContext(context, question),
  });
  if (!text || !answersInLanguage(text, lang)) return offlineAnswer(question, context, lang);
  return text;
}

export interface SummaryRequest {
  lang: string;
  pageText: string;
  signal: AbortSignal;
  config?: ChatConfig;
}

/**
 * The spoken overview the read-aloud button plays.
 *
 * Null means "no overview available", and the button then reads the page
 * itself. That is why nothing falls back to `offlineAnswer` here: the canned
 * replies answer wizard questions, and one of them read out over an unrelated
 * page would be a confident answer to a question nobody asked.
 */
export async function requestPageSummary({
  lang,
  pageText,
  signal,
  config = readChatConfig(import.meta.env),
}: SummaryRequest): Promise<string | null> {
  const page = pageText.trim();
  if (!config.url || !page) return null;
  const text = await askModel({
    config,
    signal,
    system: buildSystemPrompt(lang, summaryInstruction()),
    user: ['PAGE TEXT:', page, '', 'Give the spoken overview of this page.'].join('\n'),
  });
  if (!text || !answersInLanguage(text, lang)) return null;
  return text;
}
