"use client";

/**
 * C20 Config footer (`#apiBaseInput` + `#footNote`).
 *
 * Editable backend base URL. Defaults to `getApiBase()` and persists to
 * `localStorage` (`saarthi-api-base`) on every change.
 *
 * Styling: semantic class names + `var(--…)` tokens owned by Agent 1's
 * tokens.css. No color hexes here.
 */

import { useState } from "react";
import { getApiBase, setApiBase } from "../lib/api-base";

export default function ApiBaseField() {
  const [value, setValue] = useState<string>(() => {
    try {
      return getApiBase();
    } catch {
      return "http://localhost:8080";
    }
  });
  const [saved, setSaved] = useState(false);

  function handleChange(next: string) {
    setValue(next);
    setSaved(false);
    try {
      setApiBase(next);
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  return (
    <footer className="api-base-footer">
      <label htmlFor="apiBaseInput" style={{ color: "var(--muted)" }}>
        API base
      </label>
      <input
        id="apiBaseInput"
        className="api-base-input"
        type="url"
        inputMode="url"
        spellCheck={false}
        autoComplete="off"
        placeholder="http://localhost:8080"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        aria-describedby="footNote"
        style={{ borderColor: "var(--border)", color: "var(--fg)" }}
      />
      {saved && (
        <p role="status" className="api-base-saved" style={{ color: "var(--muted)" }}>
          Saved — API calls now use this server.
        </p>
      )}
      <p id="footNote" className="api-base-note" style={{ color: "var(--muted)" }}>
        Base {value || "http://localhost:8080"} · math from server only · queue on
        this phone · voice demo
      </p>
    </footer>
  );
}
