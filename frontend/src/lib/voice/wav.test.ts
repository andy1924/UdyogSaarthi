import { describe, expect, it } from 'vitest';
import { encodeWav } from './wav';

const ascii = (view: DataView, offset: number, length: number) =>
  Array.from({ length }, (_, index) => String.fromCharCode(view.getUint8(offset + index))).join('');

const viewOf = async (blob: Blob) => new DataView(await blob.arrayBuffer());

describe('encodeWav', () => {
  it('writes a mono 16-bit PCM header at the requested rate', async () => {
    const view = await viewOf(encodeWav(new Float32Array(8), 16_000));
    expect(ascii(view, 0, 4)).toBe('RIFF');
    expect(ascii(view, 8, 4)).toBe('WAVE');
    expect(ascii(view, 12, 4)).toBe('fmt ');
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(16_000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(ascii(view, 36, 4)).toBe('data');
  });

  it('sizes the container from the sample count', async () => {
    const blob = encodeWav(new Float32Array(100), 16_000);
    expect(blob.type).toBe('audio/wav');
    expect(blob.size).toBe(44 + 200);
    const view = await viewOf(blob);
    expect(view.getUint32(4, true)).toBe(36 + 200);
    expect(view.getUint32(40, true)).toBe(200);
  });

  it('clips out-of-range samples instead of wrapping them', async () => {
    const view = await viewOf(encodeWav(new Float32Array([2, -2]), 16_000));
    expect(view.getInt16(44, true)).toBe(0x7fff);
    expect(view.getInt16(46, true)).toBe(-0x8000);
  });
});
