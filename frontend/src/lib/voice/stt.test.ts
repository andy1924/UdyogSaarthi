import { describe, expect, it } from 'vitest';
import { WHISPER_MODEL, pickSttOptions } from './stt';

describe('pickSttOptions', () => {
  it('runs Whisper on the CPU, never on the GPU', () => {
    expect(pickSttOptions()).toEqual({
      device: 'wasm',
      dtype: { encoder_model: 'q8', decoder_model_merged: 'q8' },
    });
  });

  it('pins a multilingual checkpoint that can write Hindi', () => {
    expect(WHISPER_MODEL).toBe('onnx-community/whisper-small');
  });

  it('can be pushed to the GPU, where it must stay unquantized', () => {
    expect(pickSttOptions('webgpu')).toEqual({
      device: 'webgpu',
      dtype: { encoder_model: 'fp32', decoder_model_merged: 'fp32' },
    });
  });
});
