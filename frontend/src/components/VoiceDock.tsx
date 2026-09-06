/**
 * C17 voice dock — mocked (`#micBtn #vTrans`).
 *
 * Mic button pinned bottom-right toggles a voice-note chip
 * ("Voice note saved (mock — no ASR yet)"). No network calls, no media
 * capture — Bhashini adapter is unplugged (design-system §11.1).
 */

"use client";

import { useState } from "react";

export default function VoiceDock() {
  const [saved, setSaved] = useState(false);

  return (
    <div className="voice-dock">
      {saved && (
        <p id="vTrans" className="voice-chip" aria-live="polite">
          Voice note saved (mock — no ASR yet)
        </p>
      )}
      <button
        type="button"
        id="micBtn"
        className="voice-mic"
        aria-pressed={saved}
        aria-label={saved ? "Discard mock voice note" : "Save mock voice note"}
        title="Voice note (demo — no speech recognition yet)"
        onClick={() => setSaved((prev) => !prev)}
      >
        Mic
      </button>
    </div>
  );
}
