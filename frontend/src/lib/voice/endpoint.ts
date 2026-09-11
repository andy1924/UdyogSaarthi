export interface EndpointerOptions {
  /** RMS level at or above which a frame counts as speech. */
  speechThreshold: number;
  /** Voiced time required before the turn is considered started. */
  minSpeechMs: number;
  /** Trailing silence that closes the turn. */
  silenceMs: number;
  /** Hard stop so a noisy room cannot hold the mic open forever. */
  maxTurnMs: number;
  /** Duration of one pushed frame. */
  frameMs: number;
}

export type EndpointerEvent = 'speech-start' | 'speech-end' | 'timeout' | null;

export const DEFAULT_ENDPOINTER: EndpointerOptions = {
  speechThreshold: 0.02,
  minSpeechMs: 200,
  silenceMs: 900,
  maxTurnMs: 20_000,
  frameMs: 20,
};

export class Endpointer {
  private speechMs = 0;
  private silenceMs = 0;
  private elapsedMs = 0;
  private started = false;
  private ended = false;

  constructor(private readonly options: EndpointerOptions = DEFAULT_ENDPOINTER) {}

  get isSpeaking(): boolean {
    return this.started && !this.ended;
  }

  reset(): void {
    this.speechMs = 0;
    this.silenceMs = 0;
    this.elapsedMs = 0;
    this.started = false;
    this.ended = false;
  }

  push(rms: number): EndpointerEvent {
    if (this.ended) return null;
    const { frameMs, speechThreshold, minSpeechMs, silenceMs, maxTurnMs } = this.options;
    const voiced = Number.isFinite(rms) && rms >= speechThreshold;

    this.elapsedMs += frameMs;
    if (voiced) {
      this.speechMs += frameMs;
      this.silenceMs = 0;
    } else if (this.started) {
      this.silenceMs += frameMs;
    }

    if (!this.started) {
      if (this.speechMs >= minSpeechMs) {
        this.started = true;
        return 'speech-start';
      }
      return null;
    }
    if (this.elapsedMs >= maxTurnMs) {
      this.ended = true;
      return 'timeout';
    }
    if (this.silenceMs >= silenceMs) {
      this.ended = true;
      return 'speech-end';
    }
    return null;
  }
}
