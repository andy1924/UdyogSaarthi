import { downsampleTo16k } from './resample';

export interface Recorder {
  start(): Promise<void>;
  stop(): Promise<Float32Array>;
  cancel(): void;
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
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    recorder?.stream.getTracks().forEach((track) => track.stop());
    stream?.getTracks().forEach((track) => track.stop());
    void context?.close();
    stream = null;
    recorder = null;
    context = null;
  };

  return {
    onLevel(callback) { levelCallback = callback; },
    async start() {
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

      chunks.length = 0;
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.start();
    },
    async stop() {
      const active = recorder;
      if (!active) return new Float32Array(0);
      const finished = new Promise<Blob>((resolve) => {
        active.onstop = () => resolve(new Blob(chunks, { type: active.mimeType }));
      });
      active.stop();
      const blob = await finished;
      // Decode on the recording context when there is one, so a long session
      // does not leak a fresh AudioContext per turn.
      const owned = context ?? new AudioContext();
      const decoded = await owned.decodeAudioData(await blob.arrayBuffer());
      const samples = downsampleTo16k(decoded.getChannelData(0), decoded.sampleRate);
      if (!context) void owned.close();
      teardown();
      return samples;
    },
    cancel() { teardown(); },
  };
}
