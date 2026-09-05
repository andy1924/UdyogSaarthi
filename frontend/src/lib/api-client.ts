/**
 * UdyogSaarthi API client (WAVE 1, Agent 2).
 *
 * Contract: docs/apiDocs.md + docs/frontend/DESIGN.md §4.
 * Base `http://localhost:8000` (see `./api-base`).
 *
 * Rules enforced here:
 * - 15 s timeout on EVERY request (AbortController).
 * - GET requests retry with backoff 2 s / 4 s, max 3 attempts.
 *   POST requests NEVER auto-retry.
 * - `POST /auth/token` sends an OAuth2 FORM-ENCODED body
 *   (`username=<email>&password=…`, content-type
 *   `application/x-www-form-urlencoded`) — never JSON.
 * - NEVER compute TPC / loan / EQI client-side. Server values from
 *   `schemeCalculate` are rendered as-is; this module only types them.
 */

import { getApiBase } from "./api-base";

// ── Typed error ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  /** HTTP status (0 = network failure / timeout, no response). */
  status: number;
  /** Server `detail` message or fallback text. */
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

// ── JWT helpers (`saarthi-jwt`) ─────────────────────────────────────────────

export const JWT_KEY = "saarthi-jwt";

function storage(): Storage | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    void window.localStorage.length;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return storage()?.getItem(JWT_KEY) ?? null;
}

export function setToken(token: string): void {
  try {
    storage()?.setItem(JWT_KEY, token);
  } catch {
    // Private-mode storage must never break login UX.
  }
}

export function clearToken(): void {
  try {
    storage()?.removeItem(JWT_KEY);
  } catch {
    // Ignore.
  }
}

// ── Server-shaped types (mirror backend/app/schemas/*) ─────────────────────

export interface UserOut {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  role: string;
  is_active: boolean;
}

export interface TokenOut {
  access_token: string;
  token_type: string;
}

export interface RegisterIn {
  email: string;
  password: string;
  full_name?: string;
  username?: string;
}

export interface SchemeRule {
  tier: "micro" | "term";
  cap: number;
  rate: number;
  tenure_years: number;
  moratorium_months: number;
  effective_from: string;
  version: string;
}

export interface SchemeCalculateIn {
  margin: number;
  business_category?: string;
}

export interface QuarterlyObligation {
  quarter: number;
  principal: number;
  interest: number;
  emi: number;
  balance: number;
  due_label: string;
}

/** Server-computed finance. Render only — never derive client-side. */
export interface SchemeCalculateOut {
  margin: number;
  tpc: number;
  max_loan_raw: number;
  max_loan_capped: number;
  tier: "micro" | "term";
  rules: SchemeRule;
  working_capital_buffer: number;
  eqi_schedule: QuarterlyObligation[];
  eqi_amount: number | null;
}

export interface FeasibilityIn {
  location_text?: string;
  lat?: number;
  lon?: number;
  business_category: string;
  radius_m?: number;
  population?: number;
}

export interface LgdCode {
  state: string;
  district: string;
  block: string;
  gp?: string | null;
  code: string;
  lat: number;
  lon: number;
}

export interface FeasibilityOut {
  lgd: LgdCode;
  business_category: string;
  poi_count: number;
  density_score: number;
  verdict: "saturated" | "viable" | "niche-gap";
  swot: Record<string, unknown>;
  opportunities: Array<Record<string, unknown>>;
  overpass_ql: string;
}

export interface ComplianceLicense {
  id: string;
  label: string;
  desc: string;
  required: boolean;
}

export interface ComplianceOut {
  business_category: string;
  state: string;
  district: string;
  licenses: ComplianceLicense[];
  sources: string[];
  ai_generated: boolean;
  confidence: number;
}

export interface DirectoryProfile {
  id: string;
  name: string;
  category: string;
  distance_m: number;
  lat: number;
  lon: number;
}

export interface DirectoryOut {
  query: Record<string, unknown>;
  count: number;
  profiles: DirectoryProfile[];
  sql: string;
}

export interface DprRenderIn {
  feasibility: FeasibilityOut;
  scheme: SchemeCalculateOut;
  capex_opex?: Record<string, unknown>;
  verified?: "self-reported" | "aa-verified";
  applicant_name: string;
  business_name?: string;
}

export interface DprRenderOut {
  dpr_id: string;
  pdf_url: string;
  status: "queued" | "pdf_failed";
  data: Record<string, unknown>;
  verified: string;
}

export type DprTransitionAction =
  | "submit_for_review"
  | "approve_sca"
  | "reject"
  | "send_to_bank"
  | "finalize"
  | "force_reject";

export interface DprTransitionOut {
  dpr_id: string;
  previous_state: string;
  current_state: string;
  triggered_by: string;
  history: Array<Record<string, unknown>>;
}

export interface DprHistoryOut {
  dpr_id: string;
  current_state: string;
  allowed_triggers: string[];
  history: Array<Record<string, unknown>>;
}

export interface HealthOut {
  status: "ok" | "degraded";
  database: string;
  redis: string;
}

// ── Audit trail (read-only, dic_officer / sca_auditor; applicant gets 403) ──
// Shapes mirror backend/app/routers/audit.py. Note: the dpr- and user-scoped
// endpoints omit `payload_snapshot` (and user scope omits `user_id`), so
// those fields are optional here.

export interface AuditLogEntry {
  id: string;
  user_id?: string | null;
  action: string;
  endpoint: string;
  ip_address?: string | null;
  timestamp?: string | null;
  payload_snapshot?: Record<string, unknown> | null;
}

export interface AuditLogsOut {
  page: number;
  page_size: number;
  count: number;
  logs: AuditLogEntry[];
}

export interface AuditLogsByDprOut {
  dpr_id: string;
  count: number;
  logs: AuditLogEntry[];
}

export interface AuditLogsByUserOut {
  user_id: string;
  page: number;
  page_size: number;
  count: number;
  logs: AuditLogEntry[];
}

// ── Transport core ──────────────────────────────────────────────────────────

const TIMEOUT_MS = 15_000;
const GET_RETRY_DELAYS_MS = [2_000, 4_000]; // attempts 2 and 3 wait 2s / 4s
const MAX_ATTEMPTS = 3;

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function extractDetail(res: Response): Promise<string> {
  const ct = res.headers.get("content-type") ?? "";
  try {
    if (ct.includes("json")) {
      const body: unknown = await res.json();
      if (typeof body === "string") return body;
      if (body !== null && typeof body === "object") {
        const d = (body as Record<string, unknown>).detail;
        if (typeof d === "string") return d;
        if (Array.isArray(d)) {
          // FastAPI 422 validation errors: [{loc, msg, …}]
          return d
            .map((e) =>
              e !== null && typeof e === "object" && "msg" in e
                ? String((e as Record<string, unknown>).msg)
                : JSON.stringify(e),
            )
            .join("; ");
        }
        return JSON.stringify(body);
      }
    }
    const text = await res.text();
    return text.trim() === "" ? res.statusText : text;
  } catch {
    return res.statusText;
  }
}

/** Statuses worth retrying on idempotent GETs. */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface RequestOptions {
  method: "GET" | "POST";
  /** Bearer JWT attached when true (default true for POST, see callers). */
  auth?: boolean;
  /** JSON body (POST only). */
  json?: unknown;
  /** Raw body + explicit content type (used for the OAuth2 form login). */
  raw?: { body: string; contentType: string };
  /** Expected binary response (PDF download). */
  blob?: boolean;
}

async function request<T>(path: string, opts: RequestOptions): Promise<T> {
  const isGet = opts.method === "GET";
  const attempts = isGet ? MAX_ATTEMPTS : 1;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const headers: Record<string, string> = { ...(opts.auth === false ? {} : authHeaders()) };
      let body: BodyInit | undefined;
      if (opts.raw) {
        headers["Content-Type"] = opts.raw.contentType;
        body = opts.raw.body;
      } else if (opts.json !== undefined) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(opts.json);
      }
      const res = await fetch(`${getApiBase()}${path}`, {
        method: opts.method,
        headers,
        body,
        signal: controller.signal,
      });
      if (!res.ok) {
        const detail = await extractDetail(res);
        const err = new ApiError(res.status, detail || `Request failed (${res.status})`);
        if (!isGet || !isRetryableStatus(res.status)) throw err;
        lastError = err;
      } else if (opts.blob) {
        return (await res.blob()) as T;
      } else if (res.status === 204) {
        return undefined as T;
      } else {
        return (await res.json()) as T;
      }
    } catch (err) {
      if (err instanceof ApiError && (!isGet || !isRetryableStatus(err.status))) throw err;
      lastError = err;
      if (attempt >= attempts) break;
      // Network failure / timeout / retryable status → back off, then retry.
    } finally {
      clearTimeout(timer);
    }
    if (attempt < attempts) await sleep(GET_RETRY_DELAYS_MS[attempt - 1] ?? 4_000);
  }

  if (lastError instanceof ApiError) throw lastError;
  if (lastError instanceof DOMException && lastError.name === "AbortError") {
    throw new ApiError(0, "Request timed out after 15 s. Check your connection and retry.");
  }
  throw new ApiError(
    0,
    lastError instanceof Error ? lastError.message : "Network request failed.",
  );
}

function get<T>(path: string, auth = false): Promise<T> {
  return request<T>(path, { method: "GET", auth });
}

function post<T>(path: string, json?: unknown, auth = true): Promise<T> {
  return request<T>(path, { method: "POST", auth, json });
}

// ── Public API ──────────────────────────────────────────────────────────────

export const SaarthiApi = {
  // Auth
  register(data: RegisterIn): Promise<UserOut> {
    return post<UserOut>("/auth/register", data, false);
  },

  /**
   * OAuth2 password login. Sends a FORM-ENCODED body
   * (`username=<email>&password=…`) — never JSON.
   */
  async token(email: string, password: string): Promise<TokenOut> {
    const form = new URLSearchParams({ username: email, password }).toString();
    return request<TokenOut>("/auth/token", {
      method: "POST",
      auth: false,
      raw: { body: form, contentType: "application/x-www-form-urlencoded" },
    });
  },

  me(): Promise<UserOut> {
    return get<UserOut>("/auth/me", true);
  },

  // Scheme (public)
  schemeRules(): Promise<SchemeRule[]> {
    return get<SchemeRule[]>("/api/scheme/rules");
  },

  schemeCalculate(input: SchemeCalculateIn): Promise<SchemeCalculateOut> {
    return post<SchemeCalculateOut>("/api/scheme/calculate", input, false);
  },

  // Feasibility (Bearer)
  feasibilityScore(input: FeasibilityIn): Promise<FeasibilityOut> {
    return post<FeasibilityOut>("/api/feasibility/score", input, true);
  },

  // Compliance (public, RAG fallback server-side)
  complianceLicenses(
    business_category: string,
    state?: string,
    district?: string,
  ): Promise<ComplianceOut> {
    const q = new URLSearchParams({ business_category });
    if (state) q.set("state", state);
    if (district) q.set("district", district);
    return get<ComplianceOut>(`/api/compliance/licenses?${q.toString()}`);
  },

  // Directory (public). Client clamps radius_m to the UI range ≤ 10000
  // (API allows up to 50000 — see DESIGN.md §7 open issue 4).
  directoryNearby(args: {
    lat: number;
    lon: number;
    radius_m?: number;
    category?: string;
  }): Promise<DirectoryOut> {
    const radius_m = Math.min(Math.max(args.radius_m ?? 10_000, 1000), 10_000);
    const q = new URLSearchParams({
      lat: String(args.lat),
      lon: String(args.lon),
      radius_m: String(radius_m),
    });
    if (args.category) q.set("category", args.category);
    return get<DirectoryOut>(`/api/directory/nearby?${q.toString()}`);
  },

  // DPR (Bearer)
  dprRender(input: DprRenderIn): Promise<DprRenderOut> {
    return post<DprRenderOut>("/api/dpr/render", input, true);
  },

  dprGet(id: string): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>(`/api/dpr/${encodeURIComponent(id)}`, true);
  },

  /** URL string for the PDF download (fetch it as a blob with Bearer). */
  dprDownloadUrl(id: string): string {
    return `${getApiBase()}/api/dpr/${encodeURIComponent(id)}/download`;
  },

  /** Download the DPR PDF as a Blob (Bearer JWT attached). */
  dprDownload(id: string): Promise<Blob> {
    return request<Blob>(`/api/dpr/${encodeURIComponent(id)}/download`, {
      method: "GET",
      auth: true,
      blob: true,
    });
  },

  dprTransition(
    id: string,
    args: { action: DprTransitionAction; note?: string },
  ): Promise<DprTransitionOut> {
    return post<DprTransitionOut>(
      `/api/dpr/${encodeURIComponent(id)}/transition`,
      { action: args.action, ...(args.note ? { note: args.note } : {}) },
      true,
    );
  },

  dprHistory(id: string): Promise<DprHistoryOut> {
    return get<DprHistoryOut>(`/api/dpr/${encodeURIComponent(id)}/history`, true);
  },

  // Audit (Bearer; staff only — applicant gets 403)
  auditLogs(page = 1, pageSize = 50): Promise<AuditLogsOut> {
    const q = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });
    return get<AuditLogsOut>(`/api/audit/logs?${q.toString()}`, true);
  },

  auditLogsByDpr(dprId: string): Promise<AuditLogsByDprOut> {
    return get<AuditLogsByDprOut>(
      `/api/audit/logs/dpr/${encodeURIComponent(dprId)}`,
      true,
    );
  },

  auditLogsByUser(
    userId: string,
    page = 1,
    pageSize = 50,
  ): Promise<AuditLogsByUserOut> {
    const q = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });
    return get<AuditLogsByUserOut>(
      `/api/audit/logs/user/${encodeURIComponent(userId)}?${q.toString()}`,
      true,
    );
  },

  // System
  health(): Promise<HealthOut> {
    return get<HealthOut>("/health");
  },
};
