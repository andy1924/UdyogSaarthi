export type VoiceModelId = 'stt' | 'tts';

export interface RawProgressEvent {
  status?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}

export interface ModelProgressState {
  /** Aggregate 0-1, or null before anything is known. */
  value: number | null;
  done: boolean;
}

export const INITIAL_MODEL_PROGRESS: ModelProgressState = { value: null, done: false };

export function reduceProgress(
  state: ModelProgressState,
  event: RawProgressEvent,
): ModelProgressState {
  if (event.status === 'ready' || event.status === 'done') return { value: 1, done: true };
  if (typeof event.progress !== 'number' || !Number.isFinite(event.progress)) return state;
  const clamped = Math.min(1, Math.max(0, event.progress / 100));
  return { value: Math.max(state.value ?? 0, clamped), done: state.done };
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
