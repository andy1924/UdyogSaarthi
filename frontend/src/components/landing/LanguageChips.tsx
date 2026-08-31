"use client";

const chips = [
  { code: "hi", label: "हिंदी", active: true },
  { code: "ta", label: "தமிழ்", active: false },
  { code: "bn", label: "বাংলা", active: false },
  { code: "en", label: "English", active: false },
] as const;

export function LanguageChips() {
  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="group"
      aria-label="Language selection"
    >
      {chips.map((c) => (
        <span
          key={c.code}
          lang={c.code === "en" ? "en" : c.code}
          className={[
            "inline-flex min-h-[28px] items-center rounded-full border px-2.5 py-1 text-xs font-medium leading-none",
            c.active
              ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
              : "border-[var(--color-ledger)] bg-white text-[var(--color-muted)]",
          ].join(" ")}
        >
          {c.label}
        </span>
      ))}
      <span className="sr-only">Static preview — language switching in Task 3</span>
    </div>
  );
}
