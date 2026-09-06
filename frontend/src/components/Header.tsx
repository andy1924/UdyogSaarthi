"use client";

import { useCallback, useEffect, useState } from "react";
import { SaarthiApi, getToken } from "../lib/api-client";

/**
 * C01 site header — 56px sticky, pine avatar, truncating title,
 * A+ text-size toggle (#sizeBtn), auth chip slot (#authChip),
 * API health dot slot (#apiDot).
 */
export default function Header() {
  const [large, setLarge] = useState(false);
  const [chip, setChip] = useState("Guest");
  const [health, setHealth] = useState<"ok" | "degraded" | "unknown">(
    "unknown",
  );

  const toggleSize = useCallback(() => {
    setLarge((prev) => {
      const next = !prev;
      document.documentElement.dataset.size = next ? "112" : "100";
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function refreshChip() {
      if (getToken() === null) {
        if (!cancelled) setChip("Guest");
        return;
      }
      try {
        const me = await SaarthiApi.me();
        if (!cancelled) setChip(me.email || me.username || "Account");
      } catch {
        if (!cancelled) setChip("Guest");
      }
    }
    refreshChip();
    window.addEventListener("storage", refreshChip);
    window.addEventListener("focus", refreshChip);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", refreshChip);
      window.removeEventListener("focus", refreshChip);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        await SaarthiApi.health();
        if (!cancelled) setHealth("ok");
      } catch {
        if (!cancelled) setHealth("degraded");
      }
    }
    check();
    const id = window.setInterval(check, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const dotLabel =
    health === "ok"
      ? "API status ok"
      : health === "degraded"
        ? "API status degraded"
        : "API status unknown";

  return (
    <header className="site-head" id="siteHead">
      <div className="site-head-inner">
        <span className="avatar" aria-hidden="true">
          Sa
        </span>
        <div className="head-title">
          <b>UdyogSaarthi</b>
          <span>Will it work in my block?</span>
        </div>
        <span
          className={`api-dot${health !== "unknown" ? ` ${health}` : ""}`}
          id="apiDot"
          role="status"
          aria-label={dotLabel}
          title={dotLabel}
        />
        <span id="authChip" aria-live="polite">
          {chip}
        </span>
        <button
          type="button"
          className="icon-btn"
          id="sizeBtn"
          onClick={toggleSize}
          aria-pressed={large}
          aria-label="Toggle larger text"
          title="Toggle larger text"
        >
          A+
        </button>
      </div>
    </header>
  );
}
