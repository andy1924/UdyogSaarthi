import { describe, expect, it } from 'vitest';
import * as providers from './providers';

// There is no remote-speech config left to test: recognition and synthesis are
// local only, so the only speech setting is the browser Whisper backend.

describe('speech configuration', () => {
  it('exposes no way to point speech at a server', () => {
    // The hard rule: with no remote config reader in the bundle, no environment
    // variable can turn the applicant's recording into network traffic.
    const surface = providers as Record<string, unknown>;
    expect(surface.readSttConfig).toBeUndefined();
    expect(surface.readTtsConfig).toBeUndefined();
    expect(surface.authHeaders).toBeUndefined();
  });
});

describe('readSttDevice', () => {
  it('defaults to the CPU', () => {
    expect(providers.readSttDevice({})).toBe('wasm');
    expect(providers.readSttDevice({ VITE_VOICE_STT_DEVICE: 'wasm' })).toBe('wasm');
    expect(providers.readSttDevice({ VITE_VOICE_STT_DEVICE: 'nonsense' })).toBe('wasm');
  });

  it('accepts webgpu in any case', () => {
    expect(providers.readSttDevice({ VITE_VOICE_STT_DEVICE: ' WebGPU ' })).toBe('webgpu');
  });
});
