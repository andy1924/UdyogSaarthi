"use client";

/**
 * C04 Business grid — 2-col mobile / 3-col desktop single-select.
 *
 * Values: `dairy|retail|food|electronics|agro|tailoring` (UI values;
 * WizardForm maps `agro` → `agro-processing` for the API).
 * Icon = inline SVG (no emoji). Targets ≥44px. `aria-pressed` single-select.
 *
 * Export contract: `BusinessGrid({ value, onChange })`.
 */

export type BizValue =
  | "dairy"
  | "retail"
  | "food"
  | "electronics"
  | "agro"
  | "tailoring";

export interface BusinessGridProps {
  value: BizValue | null;
  onChange: (v: BizValue) => void;
}

const OPTIONS: Array<{
  value: BizValue;
  label: string;
  hint: string;
  path: string;
}> = [
  {
    value: "dairy",
    label: "Dairy",
    hint: "Milk, paneer, ghee",
    path: "M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z",
  },
  {
    value: "retail",
    label: "Retail",
    hint: "Kirana, general store",
    path: "M4 9l1-5h14l1 5M4 9v11h16V9M4 9h16M9 20v-6h6v6",
  },
  {
    value: "food",
    label: "Food",
    hint: "Snacks, tiffin, bakery",
    path: "M5 12h14a7 7 0 0 1-14 0zM12 5c0-1 1-1 1-2M9 5c0-1 1-1 1-2M15 5c0-1 1-1 1-2",
  },
  {
    value: "electronics",
    label: "Electronics",
    hint: "Repair, accessories",
    path: "M13 2L5 13h6l-1 9 8-11h-6l1-9z",
  },
  {
    value: "agro",
    label: "Agro",
    hint: "Processing, milling",
    path: "M12 21V9M12 9C12 5 9 3 5 3c0 4 3 6 7 6zM12 13c0-4 3-6 7-6 0 4-3 6-7 6z",
  },
  {
    value: "tailoring",
    label: "Tailoring",
    hint: "Stitching, boutique",
    path: "M4 20l7-7M6 4l9 9M15 4l-3 3M9 14l-2 2M18 13l3 3M21 13l-3 3",
  },
];

export default function BusinessGrid({ value, onChange }: BusinessGridProps) {
  return (
    <div>
      <style>{`
        .biz-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        @media (min-width: 960px) { .biz-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
      `}</style>
      <div className="biz-grid" role="group" aria-label="Business type">
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              data-biz={opt.value}
              aria-pressed={selected}
              onClick={() => onChange(opt.value)}
              style={{
                minHeight: "44px",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "4px",
                padding: "12px",
                borderRadius: "12px",
                border: selected
                  ? "2px solid var(--accent)"
                  : "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--fg)",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                textAlign: "left",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={opt.path} />
              </svg>
              <b style={{ fontSize: "1rem", lineHeight: 1.3 }}>{opt.label}</b>
              <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                {opt.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
