"use client";

/**
 * C05 Location + GPS step.
 *
 * - `#locInput`: text input, placeholder "Block, District, State"
 *   (font-size 16px prevents iOS zoom). Validates on blur → `aria-invalid`
 *   + `#locErr` (role=alert).
 * - `#gpsBtn`: "Use GPS" outline button (navigator.geolocation);
 *   permission/position failures write copy into `#gpsNote`.
 *
 * Export contract: `LocationStep({ locationText, onLocationText, lat, lon, onCoords })`.
 */

import { useState } from "react";

export interface LocationStepProps {
  locationText: string;
  onLocationText: (v: string) => void;
  lat: number | null;
  lon: number | null;
  onCoords: (lat: number | null, lon: number | null) => void;
}

export default function LocationStep({
  locationText,
  onLocationText,
  lat,
  lon,
  onCoords,
}: LocationStepProps) {
  const [touched, setTouched] = useState(false);
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const invalid = touched && locationText.trim() === "";

  function handleGps() {
    if (!("geolocation" in navigator)) {
      setNote("GPS is not available on this device. Type your block instead.");
      return;
    }
    setLocating(true);
    setNote("Locating…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onCoords(pos.coords.latitude, pos.coords.longitude);
        setNote(
          `GPS locked: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}. You can still edit the block name.`,
        );
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setNote(
            "GPS permission was denied. Allow location access or type your block instead.",
          );
        } else if (err.code === err.TIMEOUT) {
          setNote("GPS timed out. Try again or type your block instead.");
        } else {
          setNote(
            "Could not get your location. Check signal and try again, or type your block instead.",
          );
        }
      },
      { timeout: 15000 },
    );
  }

  return (
    <div>
      <style>{`
        .loc-row { display: flex; gap: 12px; }
        .loc-row > input { flex: 1 1 auto; }
        @media (max-width: 420px) { .loc-row { flex-direction: column; } }
      `}</style>
      <div className="loc-row">
        <input
          id="locInput"
          type="text"
          value={locationText}
          onChange={(e) => onLocationText(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="Block, District, State"
          aria-invalid={invalid}
          aria-describedby={invalid ? "locErr" : "gpsNote"}
          autoComplete="address-level2"
          style={{
            minHeight: "44px",
            minWidth: 0,
            padding: "10px 12px",
            fontSize: "16px",
            fontFamily: "var(--font-body)",
            color: "var(--fg)",
            background: "var(--surface)",
            border: invalid
              ? "2px solid var(--danger)"
              : "1px solid var(--border)",
            borderRadius: "8px",
          }}
        />
        <button
          id="gpsBtn"
          type="button"
          onClick={handleGps}
          disabled={locating}
          style={{
            minHeight: "44px",
            minWidth: "44px",
            flex: "0 0 auto",
            padding: "10px 16px",
            borderRadius: "8px",
            border: "1px solid var(--accent)",
            background: "transparent",
            color: "var(--accent)",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            cursor: locating ? "wait" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {locating ? "Locating…" : "Use GPS"}
        </button>
      </div>
      <p
        id="gpsNote"
        role="status"
        style={{
          fontSize: "0.875rem",
          color: "var(--muted)",
          margin: "8px 0 0",
        }}
      >
        {note ??
          (lat !== null && lon !== null
            ? `GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`
            : "GPS is optional — the block name is the reliable anchor.")}
      </p>
      {invalid && (
        <p
          id="locErr"
          role="alert"
          style={{ fontSize: "0.875rem", color: "var(--danger)", margin: "8px 0 0" }}
        >
          Enter your block, district and state (e.g. “Rampur, Sitapur, UP”).
        </p>
      )}
    </div>
  );
}
