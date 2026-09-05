"use client";

/**
 * Officer workflow — append-only DPR history timeline.
 *
 * Renders `DprHistoryOut["history"]` entries (`{from, to, trigger,
 * by_user_id, timestamp, note}`) oldest-first as an ordered list.
 * Entries are shaped as `Record<string, unknown>` by the API client,
 * so every field is read defensively and missing values fall back
 * to an em dash.
 */

export interface HistoryTimelineProps {
  entries: Array<Record<string, unknown>>;
}

function text(value: unknown): string {
  return typeof value === "string" && value.trim() !== "" ? value : "—";
}

function formatTimestamp(value: unknown): { label: string; dateTime?: string } {
  if (typeof value !== "string" || value.trim() === "") {
    return { label: "—" };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { label: value };
  }
  return { label: date.toLocaleString(), dateTime: value };
}

export default function HistoryTimeline({ entries }: HistoryTimelineProps) {
  if (entries.length === 0) {
    return (
      <p className="muted" style={{ margin: 0 }}>
        No workflow history yet — transitions will appear here.
      </p>
    );
  }

  return (
    <ol
      aria-label="DPR workflow history"
      style={{ listStyle: "none", margin: 0, padding: 0 }}
    >
      {entries.map((entry, index) => {
        const ts = formatTimestamp(entry["timestamp"]);
        return (
          <li
            key={index}
            style={{
              borderLeft: "2px solid var(--accent)",
              padding: "0 0 16px 16px",
              marginLeft: "6px",
              position: "relative",
            }}
          >
            <p style={{ margin: "0 0 4px", fontWeight: 600 }}>
              <span className="num">{text(entry["from"])}</span>
              {" → "}
              <span className="num">{text(entry["to"])}</span>
            </p>
            <p style={{ margin: "0 0 4px" }}>
              <span
                className="num"
                style={{
                  display: "inline-block",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--accent-ink)",
                  border: "1px solid var(--border)",
                  borderRadius: "999px",
                  padding: "2px 10px",
                }}
              >
                {text(entry["trigger"])}
              </span>
            </p>
            <p
              className="muted"
              style={{ margin: "0 0 4px", fontSize: "0.875rem" }}
            >
              by <span className="num">{text(entry["by_user_id"])}</span>
              {" · "}
              {ts.dateTime ? (
                <time dateTime={ts.dateTime}>{ts.label}</time>
              ) : (
                ts.label
              )}
            </p>
            {typeof entry["note"] === "string" && entry["note"].trim() !== "" && (
              <p style={{ margin: 0 }}>{entry["note"]}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
