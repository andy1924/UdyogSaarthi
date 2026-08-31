"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mockBhashini } from "@/lib/voice/bhashini";

export function VoiceBar() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  }, []);

  const startMockListening = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setListening(true);

    // Try real mic; fall back to mock instantly if denied/unavailable
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream);
        mediaRecorderRef.current = mr;
        const chunks: BlobPart[] = [];
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        mr.onstop = async () => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          stream.getTracks().forEach((t) => t.stop());
          try {
            const text = await mockBhashini.asrLive(blob);
            setTranscript(text);
          } catch {
            setTranscript("Hilsa block, Nalanda");
          } finally {
            setBusy(false);
            setListening(false);
          }
        };
        mr.start();
        // Auto-stop after 1.8s demo
        setTimeout(() => {
          if (mr.state !== "inactive") mr.stop();
        }, 1800);
        return;
      }
      throw new Error("no mediaDevices");
    } catch {
      // Mock path — no mic permission
      await new Promise<void>((r) => setTimeout(r, 900));
      try {
        const text = await mockBhashini.asrLive(new Blob(["mock"]));
        setTranscript(text);
      } catch {
        setTranscript("Hilsa block, Nalanda");
      } finally {
        setBusy(false);
        setListening(false);
      }
    }
  }, [busy]);

  const toggle = useCallback(() => {
    if (listening) {
      stopRecording();
      setListening(false);
      setBusy(false);
      return;
    }
    void startMockListening();
  }, [listening, startMockListening, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
    };
  }, []);

  const waveBars = [0, 1, 2, 3];

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[56px] z-20 flex justify-center px-3 pb-2 lg:bottom-0 lg:left-[240px] lg:right-0 lg:px-6 lg:pb-4"
      aria-label="Voice bar"
    >
      <div className="pointer-events-auto flex w-full max-w-3xl items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-white px-3 py-2 shadow-[var(--shadow-slip)] lg:px-4 lg:py-3">
        {/* Mic 44px */}
        <button
          type="button"
          onClick={toggle}
          aria-label={listening ? "Stop listening" : "Start voice input — बोलें"}
          aria-pressed={listening}
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-lg leading-none transition-colors",
            "min-h-[44px] min-w-[44px]",
            listening
              ? "border-[var(--color-vermilion)] bg-[var(--color-vermilion)] text-white"
              : "border-[var(--color-ledger)] bg-[var(--color-paper)] text-[var(--color-ink)] hover:bg-white",
          ].join(" ")}
        >
          <span aria-hidden>{listening ? "●" : "🎙"}</span>
        </button>

        {/* Wave + transcript */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-6 items-center gap-1" aria-hidden>
            {waveBars.map((i) => (
              <motion.span
                key={i}
                className="block w-1 rounded-full bg-[var(--color-vermilion)]"
                animate={
                  listening
                    ? { height: [8, 20, 10, 18, 8], opacity: 1 }
                    : { height: 8, opacity: 0.35 }
                }
                transition={
                  listening
                    ? { duration: 0.7, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }
                    : { duration: 0.2 }
                }
                style={{ height: 8 }}
              />
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <p
              aria-live="polite"
              aria-atomic="true"
              className="truncate font-mono text-xs leading-relaxed text-[var(--color-ink)] sm:text-sm"
            >
              {transcript ? transcript : listening ? "Listening — बोलें…" : "Tap mic — बोलें  •  Voice in your language"}
            </p>
            <p className="hidden font-mono text-xs text-[var(--color-muted)] sm:block">
              Transcript is editable — check before you proceed
            </p>
          </div>
        </div>

        <AnimatePresence>
          {transcript ? (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              type="button"
              onClick={() => setTranscript("")}
              className="shrink-0 rounded-full border border-[var(--color-ledger)] bg-white px-3 py-1.5 font-mono text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-paper)] min-h-[32px]"
            >
              Change
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
