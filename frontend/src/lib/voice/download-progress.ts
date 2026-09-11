export type VoiceModelId = 'stt' | 'tts';

export interface RawProgressEvent {
  status?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}

export interface ModelProgressState {
  /** Furthest byte count seen for each file, so the aggregate can weigh them. */
  files: Record<string, { loaded: number; total: number }>;
  /** Aggregate 0-1, or null before any file reports a usable size. */
  value: number | null;
  done: boolean;
}

export const INITIAL_MODEL_PROGRESS: ModelProgressState = { files: {}, value: null, done: false };

/**
 * Bytes received over bytes expected, across every file seen so far.
 *
 * Taking the largest single percentage instead would let a 44-byte
 * `config.json` finishing first pin the bar to 100% for the whole download,
 * which is exactly what a stalled "voice model" looked like.
 */
function aggregate(files: ModelProgressState['files']): number | null {
  let loaded = 0;
  let total = 0;
  for (const file of Object.values(files)) {
    if (!file.total) continue;
    loaded += Math.min(file.loaded, file.total);
    total += file.total;
  }
  return total > 0 ? loaded / total : null;
}

export function reduceProgress(
  state: ModelProgressState,
  event: RawProgressEvent,
): ModelProgressState {
  if (event.status === 'ready' || event.status === 'done') {
    return { ...state, value: 1, done: true };
  }

  const total = typeof event.total === 'number' && event.total > 0 ? event.total : null;
  const loaded = typeof event.loaded === 'number' && Number.isFinite(event.loaded) ? event.loaded : null;

  if (event.file) {
    // A named file with no usable size cannot be weighed. Reporting unknown is
    // the honest answer: Hugging Face sends some bodies without a
    // Content-Length, and leaving the last number in place would freeze a
    // finished 44-byte config file on the bar for the rest of the download.
    if (total === null || loaded === null) return { ...state, value: null };
    const seen = state.files[event.file];
    const files = {
      ...state.files,
      [event.file]: { loaded: Math.max(seen?.loaded ?? 0, loaded), total },
    };
    return { ...state, files, value: aggregate(files) };
  }

  // Unnamed event: the provider percentage is all there is.
  if (typeof event.progress !== 'number' || !Number.isFinite(event.progress)) return state;
  const clamped = Math.min(1, Math.max(0, event.progress / 100));
  return { ...state, value: Math.max(state.value ?? 0, clamped) };
}

/**
 * The percentage to show for a model that has not reported itself ready.
 *
 * Null means nothing usable arrived, and the UI renders an indeterminate bar
 * rather than a stalled 0%. A complete-looking number is capped at 99, because
 * an unfinished download must never be able to claim it is finished.
 */
export function pendingPercent(value: number | null): number | null {
  if (value === null) return null;
  return Math.min(99, Math.max(0, Math.round(value * 100)));
}

export interface ProgressSnapshot {
  stt: number | null;
  tts: number | null;
}

export function createProgressTracker(emit: (snapshot: ProgressSnapshot) => void) {
  const states: Record<VoiceModelId, ModelProgressState> = {
    stt: { ...INITIAL_MODEL_PROGRESS },
    tts: { ...INITIAL_MODEL_PROGRESS },
  };
  const snapshot = (): ProgressSnapshot => ({
    stt: states.stt.done ? 1 : states.stt.value,
    tts: states.tts.done ? 1 : states.tts.value,
  });
  return {
    snapshot,
    callbackFor(model: VoiceModelId) {
      return (event: RawProgressEvent) => {
        states[model] = reduceProgress(states[model], event);
        emit(snapshot());
      };
    },
  };
}
