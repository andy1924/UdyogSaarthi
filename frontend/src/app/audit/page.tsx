"use client";

import { useCallback, useEffect, useState } from "react";
import HealthDot from "@/components/HealthDot";
import { ApiError, SaarthiApi, type AuditLogEntry } from "@/lib/api-client";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

function clampPageSize(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(n)));
}

function snapshotText(entry: AuditLogEntry): string {
  if (entry.payload_snapshot === null || entry.payload_snapshot === undefined)
    return "—";
  try {
    return JSON.stringify(entry.payload_snapshot);
  } catch {
    return "—";
  }
}

/**
 * Audit trail (staff only). Read-only view over:
 * - GET /api/audit/logs?page&page_size (≤200)
 * - GET /api/audit/logs/dpr/{dpr_id}
 * - GET /api/audit/logs/user/{user_id}
 * Applicants get 403 (officer-only copy below).
 */
export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [dprInput, setDprInput] = useState("");
  const [userInput, setUserInput] = useState("");
  const [dprFilter, setDprFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(
    async (p: number, ps: number, dpr: string, user: string) => {
      setLoading(true);
      setError(null);
      setForbidden(false);
      try {
        if (dpr !== "") {
          const res = await SaarthiApi.auditLogsByDpr(dpr);
          setLogs(res.logs);
        } else if (user !== "") {
          const res = await SaarthiApi.auditLogsByUser(user, p, ps);
          setLogs(res.logs);
        } else {
          const res = await SaarthiApi.auditLogs(p, ps);
          setLogs(res.logs);
        }
      } catch (err) {
        setLogs([]);
        if (err instanceof ApiError && err.status === 403) {
          setForbidden(true);
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to load audit logs.",
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchLogs(page, pageSize, dprFilter, userFilter);
  }, [fetchLogs, page, pageSize, dprFilter, userFilter]);

  function applyFilters() {
    const dpr = dprInput.trim();
    const user = userInput.trim();
    setPage(1);
    // DPR scope takes precedence when both are set (dpr endpoint is unpaged).
    setDprFilter(dpr);
    setUserFilter(dpr === "" ? user : "");
  }

  function clearFilters() {
    setDprInput("");
    setUserInput("");
    setDprFilter("");
    setUserFilter("");
    setPage(1);
  }

  const scoped = dprFilter !== "" || userFilter !== "";

  return (
    <main className="shell">
      <section className="card" aria-label="Audit trail">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ margin: 0 }}>Audit trail</h2>
          <HealthDot />
          <span className="muted" style={{ marginLeft: "auto" }}>
            Officer view · read-only
          </span>
        </div>
        <p className="muted">
          Mutating /api/* requests may produce more than one entry per
          operation (middleware + route-level events).
        </p>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            alignItems: "end",
          }}
        >
          <label>
            DPR id
            <input
              className="auth-input"
              type="text"
              value={dprInput}
              onChange={(e) => setDprInput(e.target.value)}
              placeholder="Filter by DPR id"
              aria-label="Filter by DPR id"
            />
          </label>
          <label>
            User UUID
            <input
              className="auth-input"
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Filter by user UUID"
              aria-label="Filter by user UUID"
            />
          </label>
          <button type="button" onClick={applyFilters}>
            Apply
          </button>
          <button type="button" onClick={clearFilters} disabled={!scoped}>
            Clear
          </button>
        </div>

        {dprFilter !== "" && (
          <p className="muted">Showing events for DPR “{dprFilter}”.</p>
        )}
        {dprFilter === "" && userFilter !== "" && (
          <p className="muted">Showing events for user “{userFilter}”.</p>
        )}

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            alignItems: "end",
          }}
        >
          <label>
            Page
            <input
              className="auth-input"
              type="number"
              min={1}
              value={page}
              disabled={dprFilter !== ""}
              onChange={(e) => setPage(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
              aria-label="Page"
            />
          </label>
          <label>
            Page size (max 200)
            <input
              className="auth-input"
              type="number"
              min={1}
              max={MAX_PAGE_SIZE}
              value={pageSize}
              onChange={(e) => setPageSize(clampPageSize(Number(e.target.value)))}
              aria-label="Page size"
            />
          </label>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={loading || dprFilter !== ""}
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || page <= 1 || dprFilter !== ""}
          >
            Prev
          </button>
        </div>

        {loading && (
          <p className="muted" aria-live="polite">
            Loading audit logs…
          </p>
        )}

        {forbidden && (
          <p role="alert">
            Audit logs are officer only — sign in as a DIC officer or SCA
            auditor to view this trail.
          </p>
        )}

        {error !== null && !forbidden && <p role="alert">{error}</p>}

        {!loading && !forbidden && error === null && logs.length === 0 && (
          <p className="muted">No audit entries found.</p>
        )}

        {!forbidden && logs.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Action</th>
                  <th scope="col">Endpoint</th>
                  <th scope="col">User</th>
                  <th scope="col">IP</th>
                  <th scope="col">Timestamp</th>
                  <th scope="col">Payload snapshot</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((entry) => {
                  const snap = snapshotText(entry);
                  return (
                    <tr key={entry.id}>
                      <td>{entry.action}</td>
                      <td>{entry.endpoint}</td>
                      <td>{entry.user_id ?? "—"}</td>
                      <td>{entry.ip_address ?? "—"}</td>
                      <td>{entry.timestamp ?? "—"}</td>
                      <td title={snap}>
                        {snap.length > 120 ? `${snap.slice(0, 120)}…` : snap}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
