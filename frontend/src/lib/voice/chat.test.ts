import { afterEach, describe, expect, it, vi } from 'vitest';
import { readChatConfig, requestPageSummary, requestReply } from './chat';

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

  it('leaves room for a full spoken explanation, not just a sentence', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: 'ok' } }],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await requestReply({
      question: 'what is this page about', context, lang: 'en',
      signal: new AbortController().signal,
      config: { url: 'https://x.test/chat', key: 'k', model: 'm' },
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.max_tokens).toBeGreaterThanOrEqual(500);
  });

  it('drops a reply that ignores the Hindi setting and uses the canned one', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: 'Sorry, please recharge your account to continue.' } }],
    }), { status: 200 })));
    const reply = await requestReply({
      question: 'hello', context, lang: 'hi', signal: new AbortController().signal,
      config: { url: 'https://x.test/chat', key: 'k', model: 'm' },
    });
    expect(reply).toMatch(/[\u0900-\u097F]/);
    expect(reply).not.toMatch(/recharge/i);
  });

  it('keeps a Devanagari reply untouched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: '  यह चरण ऋण और सब्सिडी के बारे में है।  ' } }],
    }), { status: 200 })));
    const reply = await requestReply({
      question: 'hello', context, lang: 'hi', signal: new AbortController().signal,
      config: { url: 'https://x.test/chat', key: 'k', model: 'm' },
    });
    expect(reply).toBe('यह चरण ऋण और सब्सिडी के बारे में है।');
  });
});

describe('requestPageSummary', () => {
  const configured = { url: 'https://x.test/chat', key: 'k', model: 'm' };

  it('returns null when there is no brain to ask', async () => {
    expect(await requestPageSummary({
      lang: 'en', pageText: 'A page.', signal: new AbortController().signal,
      config: { url: '', key: '', model: '' },
    })).toBeNull();
  });

  it('returns null without calling out when the page had nothing on it', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await requestPageSummary({
      lang: 'en', pageText: '   ', signal: new AbortController().signal, config: configured,
    })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks for an overview and sends the page text with it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: 'This page starts your business plan.' } }],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const summary = await requestPageSummary({
      lang: 'en',
      pageText: 'Start your plan. How it works.',
      signal: new AbortController().signal,
      config: configured,
    });
    expect(summary).toBe('This page starts your business plan.');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.messages[0].content).toMatch(/overview/i);
    expect(body.messages[1].content).toContain('Start your plan. How it works.');
  });

  it('returns null rather than a canned wizard answer when the call fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await requestPageSummary({
      lang: 'en', pageText: 'A page.', signal: new AbortController().signal, config: configured,
    })).toBeNull();
  });

  it('rejects an English overview for a Hindi listener', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: 'Sorry, please recharge your account to continue.' } }],
    }), { status: 200 })));
    expect(await requestPageSummary({
      lang: 'hi', pageText: 'शुरू करें।', signal: new AbortController().signal, config: configured,
    })).toBeNull();
  });
});
