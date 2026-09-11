import { normalizePeak } from './gain';
import { downsampleTo16k } from './resample';

export interface Recorder {
  /** Acquire the microphone. Resolves once the browser has granted access. */
  arm(): Promise<void>;
  /** Start capturing a turn. Only meaningful after `arm`. */
  begin(): Promise<void>;
  /**
   * Finish the turn and hand back its audio. The caller releases the microphone
   * straight afterwards, so it is not left open while the reply is spoken.
   */
  stop(): Promise<Float32Array>;
  /** Give the microphone back to the browser. */
  release(): void;
  onLevel(callback: (rms: number) => void): void;
}

export function createRecorder(): Recorder {
  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let context: AudioContext | null = null;
  let frame = 0;
  let levelCallback: (rms: number) => void = () => {};
  const chunks: Blob[] = [];

  const teardown = () => {
    // Release is called from several paths (turn end, error, close, unmount),
    // so it has to survive running twice.
    if (!stream && !recorder && !context) return;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    recorder?.stream.getTracks().forEach((track) => track.stop());
    stream?.getTracks().forEach((track) => track.stop());
    void context?.close();
    stream = null;
    recorder = null;
    context = null;
  };

  const arm = async () => {
    if (stream) return;
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    const buffer = new Float32Array(analyser.fftSize);

    const sample = () => {
      analyser.getFloatTimeDomainData(buffer);
      let sum = 0;
      for (const value of buffer) sum += value * value;
      levelCallback(Math.sqrt(sum / buffer.length));
      frame = requestAnimationFrame(sample);
    };
    sample();
  };

  const begin = async () => {
    await arm();
    const live = stream as MediaStream;
    chunks.length = 0;
    recorder = new MediaRecorder(live);
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.start();
  };

  return {
    onLevel(callback) { levelCallback = callback; },
    arm,
    begin,
    async stop() {
      const active = recorder;
      if (!active) return new Float32Array(0);
      const finished = new Promise<Blob>((resolve) => {
        active.onstop = () => resolve(new Blob(chunks, { type: active.mimeType }));
      });
      active.stop();
      const blob = await finished;
      recorder = null;
      // Decode on the recording context when there is one, so a long session
      // does not leak a fresh AudioContext per turn.
      const owned = context ?? new AudioContext();
      const decoded = await owned.decodeAudioData(await blob.arrayBuffer());
      const samples = downsampleTo16k(decoded.getChannelData(0), decoded.sampleRate);
      if (!context) void owned.close();
      return normalizePeak(samples);
    },
    release() { teardown(); },
  };
}
