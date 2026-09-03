"use client";

import { useCallback, useState } from "react";

/**
 * C01 site header — 56px sticky, pine avatar, truncating title,
 * A+ text-size toggle (#sizeBtn), auth chip slot (#authChip),
 * API health dot slot (#apiDot).
 */
export default function Header() {
  const [large, setLarge] = useState(false);

  const toggleSize = useCallback(() => {
    setLarge((prev) => {
      const next = !prev;
      document.documentElement.style.fontSize = next ? "112%" : "100%";
      return next;
    });
  }, []);

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
          className="api-dot"
          id="apiDot"
          role="status"
          aria-label="API status unknown"
          title="API status unknown"
        />
        <span id="authChip" aria-live="polite" />
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
