import { describe, expect, it } from 'vitest';
import { authHeaders, readSttConfig, readSttDevice, readTtsConfig } from './providers';

describe('readSttConfig', () => {
  it('returns null when no endpoint is configured, so the browser transcribes', () => {
    expect(readSttConfig({})).toBeNull();
    expect(readSttConfig({ VITE_VOICE_STT_URL: '   ' })).toBeNull();
  });

  it('keeps the key optional and defaults the model', () => {
    expect(readSttConfig({ VITE_VOICE_STT_URL: 'https://gpu.example/v1/audio/transcriptions' })).toEqual({
      url: 'https://gpu.example/v1/audio/transcriptions',
      key: '',
      model: 'whisper-1',
    });
  });

  it('trims what it reads', () => {
    expect(readSttConfig({
      VITE_VOICE_STT_URL: ' https://gpu.example ',
      VITE_VOICE_STT_KEY: ' secret ',
      VITE_VOICE_STT_MODEL: ' large-v3 ',
    })).toEqual({ url: 'https://gpu.example', key: 'secret', model: 'large-v3' });
  });
});

describe('readTtsConfig', () => {
  it('returns null when no endpoint is configured, so the browser speaks', () => {
    expect(readTtsConfig({})).toBeNull();
  });

  it('carries an optional voice id and defaults the model', () => {
    expect(readTtsConfig({ VITE_VOICE_TTS_URL: 'https://gpu.example/v1/audio/speech' })).toEqual({
      url: 'https://gpu.example/v1/audio/speech',
      key: '',
      model: 'tts-1',
      voice: '',
    });
    expect(readTtsConfig({ VITE_VOICE_TTS_URL: 'https://gpu.example', VITE_VOICE_TTS_VOICE: 'af_heart' })?.voice)
      .toBe('af_heart');
  });
});

describe('readSttDevice', () => {
  it('defaults to the CPU', () => {
    expect(readSttDevice({})).toBe('wasm');
    expect(readSttDevice({ VITE_VOICE_STT_DEVICE: 'wasm' })).toBe('wasm');
    expect(readSttDevice({ VITE_VOICE_STT_DEVICE: 'nonsense' })).toBe('wasm');
  });

  it('accepts webgpu in any case', () => {
    expect(readSttDevice({ VITE_VOICE_STT_DEVICE: ' WebGPU ' })).toBe('webgpu');
  });
});

describe('authHeaders', () => {
  it('omits the header when there is no key, so a local server needs none', () => {
    expect(authHeaders('')).toEqual({});
  });

  it('sends a bearer token when there is one', () => {
    expect(authHeaders('secret')).toEqual({ Authorization: 'Bearer secret' });
  });
});
