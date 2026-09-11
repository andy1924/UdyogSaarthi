import { afterEach, describe, expect, it, vi } from 'vitest';
import { readChatConfig, requestReply } from './chat';

const context = { step: 4, stepTitle: 'Credit & subsidy' };

afterEach(() => vi.unstubAllGlobals());

describe('readChatConfig', () => {
  it('treats a missing URL as unconfigured', () => {
    expect(readChatConfig({}).url).toBe('');
  });

  it('reads the three env values', () => {
    const config = readChatConfig({
      VITE_VOICE_CHAT_URL: 'https://x.test/chat',
      VITE_VOICE_CHAT_KEY: 'secret',
      VITE_VOICE_CHAT_MODEL: 'fast',
    });
    expect(config).toMatchObject({ url: 'https://x.test/chat', key: 'secret', model: 'fast' });
  });
});

describe('requestReply', () => {
  it('falls back to a canned answer when unconfigured', async () => {
    const reply = await requestReply({
      question: 'hello', context, lang: 'en', signal: new AbortController().signal,
      // Explicit, so a developer's .env.local (e.g. a local llama.cpp brain)
      // cannot turn this into a network call.
      config: { url: '', key: '', model: '' },
    });
    expect(reply).toContain('Credit & subsidy');
  });

  it('returns trimmed model text when configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: '  Add your location first.  ' } }],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const reply = await requestReply({
      question: 'help', context, lang: 'en', signal: new AbortController().signal,
      config: { url: 'https://x.test/chat', key: 'k', model: 'm' },
    });
    expect(reply).toBe('Add your location first.');
  });

  it('falls back instead of throwing when the endpoint fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const reply = await requestReply({
      question: 'hello', context, lang: 'en', signal: new AbortController().signal,
      config: { url: 'https://x.test/chat', key: 'k', model: 'm' },
    });
    expect(reply).toContain('Credit & subsidy');
  });
});
