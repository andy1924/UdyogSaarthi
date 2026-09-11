import { offlineAnswer } from './answers';
import { buildSystemPrompt, buildUserContext, type StepContext } from './context';

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

export interface ReplyRequest {
  question: string;
  context: StepContext;
  lang: string;
  signal: AbortSignal;
  config?: ChatConfig;
}

export async function requestReply({
  question,
  context,
  lang,
  signal,
  config = readChatConfig(import.meta.env),
}: ReplyRequest): Promise<string> {
  if (!config.url) return offlineAnswer(question, context, lang);
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
        max_tokens: 200,
        messages: [
          { role: 'system', content: buildSystemPrompt(lang) },
          { role: 'user', content: buildUserContext(context, question) },
        ],
      }),
    });
    if (!response.ok) throw new Error(`chat ${response.status}`);
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || offlineAnswer(question, context, lang);
  } catch {
    return offlineAnswer(question, context, lang);
  }
}
