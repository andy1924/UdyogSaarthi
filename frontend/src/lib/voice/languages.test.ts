import { describe, expect, it } from 'vitest';
import { resolveVoiceLanguage } from './languages';

describe('resolveVoiceLanguage', () => {
  it('maps English to the Kokoro English voice', () => {
    expect(resolveVoiceLanguage('en')).toMatchObject({
      lang: 'en', stt: 'en', voice: 'af_heart', exact: true,
    });
  });

  it('maps Hindi to the Kokoro Hindi voice', () => {
    expect(resolveVoiceLanguage('hi')).toMatchObject({
      lang: 'hi', stt: 'hi', engine: 'mms', exact: true,
    });
  });

  it('falls back to English for a language we do not voice yet', () => {
    expect(resolveVoiceLanguage('ta')).toMatchObject({ lang: 'en', exact: false });
  });

  it('normalises regional codes such as en-IN', () => {
    expect(resolveVoiceLanguage('en-IN')).toMatchObject({ lang: 'en', exact: true });
  });

  it('handles an empty language string', () => {
    expect(resolveVoiceLanguage('')).toMatchObject({ lang: 'en', exact: false });
  });
});
