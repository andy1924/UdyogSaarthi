"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { mockBhashini } from "@/lib/voice/bhashini";
import { resolveLGD, suggestLGD, type LGDCode } from "@/lib/feasibility/lgd";

export interface LocationPickerProps {
  value: string;
  onChange: (v: string) => void;
  lgd: LGDCode | null;
  onResolved: (lgd: LGDCode) => void;
  onVoiceTranscript?: (t: string) => void;
}

export function LocationPicker({ value, onChange, lgd, onResolved, onVoiceTranscript }: LocationPickerProps) {
  const [resolving, setResolving] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const suggestions = React.useMemo(() => suggestLGD(value, 4), [value]);

  const handleResolve = React.useCallback(async () => {
    if (!value.trim()) {
      setError("Enter your block / GP");
      return;
    }
    setError(undefined);
    setResolving(true);
    try {
      const r = await resolveLGD(value);
      onResolved(r);
      onChange(r.block);
    } catch {
      setError("Could not resolve LGD — try Hilsa");
    } finally {
      setResolving(false);
    }
  }, [value, onChange, onResolved]);

  const handleVoice = React.useCallback(async () => {
    if (listening) return;
    setListening(true);
    try {
      // Integrate VoiceBar mock: use Bhashini mock transcript
      const transcript = await mockBhashini.asrLive(new Blob(["voice"]));
      onChange(transcript);
      onVoiceTranscript?.(transcript);
      const r = await resolveLGD(transcript);
      onResolved(r);
    } catch {
      // ignore
    } finally {
      setListening(false);
    }
  }, [listening, onChange, onResolved, onVoiceTranscript]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="feas-location" className="text-sm font-semibold text-[var(--color-ink)]">
          Your block / GP <span className="font-normal text-[var(--color-muted)]">— LGD</span>
        </label>
        <p className="font-mono text-xs leading-relaxed text-[var(--color-muted)]">
          Type or tap mic. We resolve to LGD (district → block → GP) — the partition key for the 5km query.
        </p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <input
            id="feas-location"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleResolve();
              }
            }}
            placeholder="e.g. Hilsa, Nalanda"
            aria-label="Block or GP"
            className={[
              "min-h-[44px] w-full rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-white px-3 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-vermilion)]/30 focus:border-[var(--color-vermilion)]",
            ].join(" ")}
          />
        </div>

        <button
          type="button"
          onClick={handleVoice}
          aria-label={listening ? "Listening…" : "Use voice — बोलें"}
          aria-pressed={listening}
          className={[
            "flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border text-base leading-none transition-colors",
            listening
              ? "border-[var(--color-vermilion)] bg-[var(--color-vermilion)] text-white animate-pulse"
              : "border-[var(--color-ledger)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-paper)]",
          ].join(" ")}
        >
          <span aria-hidden>{listening ? "●" : "🎙"}</span>
        </button>

        <Button onClick={handleResolve} disabled={resolving} className="shrink-0">
          {resolving ? "Resolving…" : "Locate"}
        </Button>
      </div>

      {error && (
        <p role="alert" className="font-mono text-xs text-[var(--color-vermilion)]">
          {error}
        </p>
      )}

      {lgd && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="ledger" className="gap-1.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" aria-hidden />
            LGD: {lgd.state} › {lgd.district} › {lgd.block} › {lgd.gp}
          </Badge>
          <span className="font-mono text-xs text-[var(--color-muted)]">code {lgd.code}</span>
          <span className="font-mono text-xs text-[var(--color-muted)]">· partition key: {lgd.block}</span>
        </div>
      )}

      {!lgd && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s.code}
              type="button"
              onClick={async () => {
                onChange(s.block);
                const r = await resolveLGD(s.block);
                onResolved(r);
              }}
              className="rounded-full border border-[var(--color-ledger)] bg-white px-3 py-1.5 font-mono text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper)] min-h-[32px]"
            >
              {s.block} · {s.district}
            </button>
          ))}
        </div>
      )}

      <p className="font-mono text-xs text-[var(--color-muted)]">
        Demo: try “Hilsa” → Bihar › Nalanda › Hilsa (mock). Voice uses the same Bhashini mock as the bottom bar.
      </p>
    </div>
  );
}
