/**
 * UdyogSaarthi API Client
 *
 * Implements communication with the FastAPI backend per docs/apiDocs.md:
 * - Auto-authentication for protected endpoints (feasibility score, DPR render)
 * - Scheme calculation, compliance licenses, nearby directory, and health status
 */

const TOKEN_STORAGE_KEY = 'udyog_access_token';
export const AUTH_REQUIRED_EVENT = 'udyogsaarthi:auth-required';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isAuthenticationError(reason: unknown): boolean {
  return reason instanceof ApiError && reason.status === 401;
}

// Types from docs/apiDocs.md and backend schemas
export interface SchemeRule {
  tier: string;
  cap: number;
  rate: number;
  tenure_years: number;
  moratorium_months: number;
  effective_from: string;
  version: string;
}

export interface EqiInstallment {
  quarter: number;
  principal: number;
  interest: number;
  emi: number;
  balance: number;
  due_label: string;
}

export interface SchemeCalculationResult {
  margin: number;
  tpc: number;
  max_loan_raw: number;
  max_loan_capped: number;
  tier: string;
  rules: SchemeRule;
  working_capital_buffer: number;
  eqi_schedule: EqiInstallment[];
  eqi_amount: number;
}

export interface LGDInfo {
  state: string;
  district: string;
  block: string;
  gp: string | null;
  code: string;
  lat: number;
  lon: number;
}

export interface SwotAnalysis {
  strength: string;
  weakness: string;
  opportunity: string;
  threat: string;
}

export interface FeasibilityResult {
  lgd: LGDInfo;
  business_category: string;
  poi_count: number;
  density_score: number;
  verdict: 'viable' | 'niche-gap' | 'saturated';
  swot: SwotAnalysis;
  opportunities: Array<{ title: string; reason: string }>;
  overpass_ql?: string;
}

export interface CapitalEstimate {
  rent_deposit: number;
  equipment: number;
  labour_setup: number;
  materials_inventory: number;
  licences_utilities: number;
  total: number;
  explanation: string;
}

export interface NearbyProfile {
  id: string;
  name: string;
  category: string;
  distance_m: number;
  lat: number;
  lon: number;
}

export interface DirectoryResult {
  query: {
    lat: number;
    lon: number;
    radius_m: number;
    category?: string | null;
  };
  count: number;
  profiles: NearbyProfile[];
  sql?: string;
}

export interface LicenseItem {
  id: string;
  label: string;
  desc: string;
  required: boolean;
}

export interface ComplianceResult {
  business_category: string;
  state: string;
  district: string;
  licenses: LicenseItem[];
  sources: string[];
  ai_generated: boolean;
  confidence: number;
}

export interface SessionUser {
  id: string;
  email: string;
  username?: string | null;
  full_name?: string | null;
  role: string;
  is_active: boolean;
}

export type FundingPreference = 'scheme_linked_loan' | 'standard_bank_loan' | 'need_guidance';
export interface DprFullRecord {
  dpr_id: string;
  applicant_name: string;
  business_name: string;
  business_category?: string;
  status: string;
  verified?: string;
  pdf_url?: string;
  created_at?: string | null;
  data?: {
    applicant?: string;
    business?: string;
    location?: { state?: string; district?: string; block?: string; code?: string; lat?: number; lon?: number };
    feasibility?: { business_category?: string; poi_count?: number; density_score?: number; verdict?: string };
    scheme?: { tpc?: number; margin?: number; max_loan_capped?: number; eqi_amount?: number; tier?: string; rules?: { version?: string } };
    funding_preference?: string;
    verified?: string;
  } | null;
}

export interface DprHistoryEntry {
  from?: string;
  to?: string;
  trigger?: string;
  by_user_id?: string;
  timestamp?: string;
  note?: string;
}

export interface DprHistory {
  dpr_id: string;
  current_state: string;
  allowed_triggers: string[];
  history: DprHistoryEntry[];
}

export interface DprTransitionResult {
  dpr_id: string;
  previous_state: string;
  current_state: string;
  triggered_by: string;
  history: DprHistoryEntry[];
}

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  endpoint: string | null;
  ip_address: string | null;
  timestamp: string | null;
  payload_snapshot: unknown;
}

export interface AuditLogPage {
  page: number;
  page_size: number;
  count: number;
  logs: AuditLogEntry[];
}

export class ApiService {
  async translationLanguages(): Promise<{ available: boolean; languages: string[] }> {
    const response = await fetch('/api/translation/languages');
    if (!response.ok) throw new Error('Language service unavailable');
    return response.json();
  }

  async translateTexts(texts: string[], target: string, signal?: AbortSignal): Promise<string[]> {
    const path = '/api/translation/text';
    const body = JSON.stringify({ texts, target });
    const response = await fetch(path, {
      method: 'POST', body, signal, headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Translation temporarily unavailable');
    const result = await response.json();
    if (!Array.isArray(result.texts) || result.texts.length !== texts.length ||
        !result.texts.every((text: unknown) => typeof text === 'string' && text.trim())) {
      throw new Error('Incomplete translation');
    }
    return result.texts;
  }
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_STORAGE_KEY);
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }

  private async handleProtectedFailure(response: Response, fallback: string): Promise<never> {
    // Only a bearer challenge means the JWT is invalid/expired. Other layers
    // may also use 401 (for example request-integrity middleware); clearing a
    // valid session in those cases causes the sign-in modal to loop.
    const bearerChallenge = response.headers.get('www-authenticate')?.toLowerCase().includes('bearer');
    if (response.status === 401 && bearerChallenge) {
      this.clearToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(AUTH_REQUIRED_EVENT));
      }
      throw new ApiError('Your session has expired. Sign in again to continue.', 401);
    }
    const detail = await response.text();
    throw new ApiError(`${fallback} (${response.status})${detail ? `: ${detail}` : ''}`, response.status);
  }

  getToken(): string | null {
    if (this.token) {
      try {
        const payload = JSON.parse(atob(this.token.split('.')[1])) as { exp?: number };
        if (payload.exp && payload.exp * 1000 <= Date.now()) {
          this.clearToken();
        }
      } catch {
        // Opaque or malformed tokens are verified by /auth/me and protected APIs.
      }
    }
    return this.token;
  }

  logout() {
    this.clearToken();
  }

  /**
   * Health Check
   */
  async checkHealth(): Promise<{ status: string; database: string; redis: string }> {
    const res = await fetch('/health');
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return res.json();
  }

  /**
   * Return the current access token. Authentication is always user-initiated.
   */
  async ensureAuthenticated(): Promise<string> {
    const token = this.getToken();
    if (token) return token;
    throw new Error('Sign in is required');
  }

  private async readErrorDetail(response: Response): Promise<string | null> {
    try {
      const text = await response.text();
      if (!text) return null;
      try {
        const data = JSON.parse(text) as { detail?: unknown };
        if (typeof data.detail === 'string') return data.detail;
        if (Array.isArray(data.detail)) {
          const msgs = data.detail
            .map((item) => {
              if (typeof item === 'string') return item;
              if (item && typeof item === 'object' && 'msg' in item && typeof (item as { msg: unknown }).msg === 'string') {
                return (item as { msg: string }).msg.replace(/^Value error,\s*/, '');
              }
              return null;
            })
            .filter((msg): msg is string => Boolean(msg));
          if (msgs.length) return msgs.join('. ');
        }
      } catch {
        return text.slice(0, 200);
      }
      return null;
    } catch {
      return null;
    }
  }

  async login(email: string, password: string): Promise<void> {
    let response: Response;
    try {
      const body = new URLSearchParams({ username: email, password }).toString();
      response = await fetch('/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch {
      throw new Error('Cannot reach the server. Make sure the backend is running, then try again.');
    }
    if (!response.ok) {
      if (response.status === 401) throw new Error('Incorrect email or password. New here? Use “Create an account” below to register first.');
      const detail = await this.readErrorDetail(response);
      throw new Error(detail ? `Sign in failed: ${detail}` : 'Sign in is unavailable. Check your connection and try again.');
    }
    const result = await response.json();
    this.setToken(result.access_token);
  }

  async registerApplicant(input: { email: string; password: string; fullName: string }): Promise<void> {
    const body = JSON.stringify({ email: input.email, password: input.password, full_name: input.fullName || undefined });
    let response: Response;
    try {
      response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
    } catch {
      throw new Error('Cannot reach the server. Make sure the backend is running, then try again.');
    }
    if (!response.ok) {
      if (response.status === 409) throw new Error('An account already exists for this email. Switch back to “Sign in” and enter your password.');
      const detail = await this.readErrorDetail(response);
      throw new Error(detail ? `We could not create your account: ${detail}` : 'We could not create your account. Try again.');
    }
    await this.login(input.email, input.password);
  }

  async getCurrentUser(): Promise<SessionUser> {
    const token = await this.ensureAuthenticated();
    const response = await fetch('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return this.handleProtectedFailure(response, 'Account check failed');
    return response.json();
  }

  /**
   * Fetch Versioned Scheme Rules (Public)
   */
  async getSchemeRules(): Promise<SchemeRule[]> {
    const res = await fetch('/api/scheme/rules');
    if (!res.ok) throw new Error(`Failed to load scheme rules: ${res.status}`);
    return res.json();
  }

  /**
   * Calculate Scheme Financials (Public, mutating POST)
   */
  async calculateScheme(margin: number, businessCategory: string): Promise<SchemeCalculationResult> {
    const path = '/api/scheme/calculate';
    const bodyStr = JSON.stringify({
      margin: Math.round(margin),
      business_category: businessCategory,
    });

    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: bodyStr,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Scheme calculate failed (${res.status}): ${err}`);
    }

    return res.json();
  }

  /**
   * Calculate Feasibility Score (Protected endpoint)
   */
  async getFeasibilityScore(params: {
    location_text: string;
    business_category: string;
    lat?: number;
    lon?: number;
    radius_m?: number;
    population?: number;
  }): Promise<FeasibilityResult> {
    const token = await this.ensureAuthenticated();
    const path = '/api/feasibility/score';
    const bodyStr = JSON.stringify({
      location_text: params.location_text,
      business_category: params.business_category,
      lat: params.lat ?? 18.5204,
      lon: params.lon ?? 73.8567,
      radius_m: params.radius_m ?? 5000,
      population: params.population ?? 50000,
    });

    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: bodyStr,
    });

    if (!res.ok) {
      return this.handleProtectedFailure(res, 'Local demand check failed');
    }

    return res.json();
  }

  async getCapitalEstimate(params: { business: string; location: string; state: string; base_capex: number }): Promise<CapitalEstimate> {
    const token = await this.ensureAuthenticated();
    const res = await fetch('/api/feasibility/capital-estimate', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(params),
    });
    if (!res.ok) return this.handleProtectedFailure(res, 'Local capital estimate failed');
    return res.json();
  }

  /**
   * Reverse Geocode (lat, lon) to State, District, Block
   */
  async reverseGeocode(lat: number, lon: number): Promise<{ state: string; district: string; block: string; display_name?: string }> {
    const res = await fetch(`/api/feasibility/reverse-geocode?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);
    return res.json();
  }

  /**
   * Forward Geocode Location Query to Coordinates & Administrative Info
   */
  async forwardGeocode(query: string): Promise<{ lat: number; lon: number; state: string; district: string; block: string; display_name: string }> {
    const res = await fetch(`/api/feasibility/geocode?query=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`Forward geocode failed: ${res.status}`);
    return res.json();
  }

  /**
   * Query Nearby Peer Businesses (Public)
   */
  async getNearbyDirectory(
    lat: number,
    lon: number,
    radius_m: number = 10000,
    category?: string
  ): Promise<DirectoryResult> {
    const query = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      radius_m: String(radius_m),
    });
    if (category) {
      query.set('category', category);
    }

    const res = await fetch(`/api/directory/nearby?${query.toString()}`);
    if (!res.ok) {
      throw new Error(`Directory query failed: ${res.status}`);
    }
    return res.json();
  }


  /**
   * Fetch Compliance Licenses (Public)
   */
  async getComplianceLicenses(
    businessCategory: string,
    state: string = 'Maharashtra',
    district: string = 'Pune'
  ): Promise<ComplianceResult> {
    const query = new URLSearchParams({
      business_category: businessCategory,
      state,
      district,
    });

    const res = await fetch(`/api/compliance/licenses?${query.toString()}`);
    if (!res.ok) {
      throw new Error(`Compliance licenses query failed: ${res.status}`);
    }
    return res.json();
  }

  /**
   * Render and Queue DPR PDF (Protected endpoint)
   */
  async renderDpr(payload: {
    applicant_name: string;
    business_name: string;
    feasibility: FeasibilityResult;
    scheme: SchemeCalculationResult;
    capex_opex?: { capex: number; opex: number; notes?: string };
    verified?: 'self-reported' | 'aa-verified';
    funding_preference: FundingPreference;
    identity_simulation?: { pan?: string; income_tier?: string; override_scheme?: string };
  }): Promise<{ dpr_id: string; pdf_url: string; status: string; verified: string }> {
    const token = await this.ensureAuthenticated();
    const path = '/api/dpr/render';
    const bodyStr = JSON.stringify({
      applicant_name: payload.applicant_name,
      business_name: payload.business_name,
      feasibility: payload.feasibility,
      scheme: payload.scheme,
      capex_opex: payload.capex_opex,
      verified: payload.verified ?? 'self-reported',
      funding_preference: payload.funding_preference,
      identity_simulation: payload.identity_simulation,
    });

    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: bodyStr,
    });

    if (!res.ok) {
      return this.handleProtectedFailure(res, 'Project report generation failed');
    }

    return res.json();
  }

  /**
   * Download generated DPR PDF as a binary Blob.
   */
  async downloadDprPdf(dprId: string): Promise<Blob> {
    const token = await this.ensureAuthenticated();
    const res = await fetch(`/api/dpr/${dprId}/download`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return this.handleProtectedFailure(res, 'Project report download failed');
    }

    return res.blob();
  }

  async getDpr(dprId: string): Promise<{ status: string; pdf_url?: string }> {
    const token = await this.ensureAuthenticated();
    const response = await fetch(`/api/dpr/${encodeURIComponent(dprId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return this.handleProtectedFailure(response, 'Project report status check failed');
    return response.json();

  }
  async getDprFull(dprId: string): Promise<DprFullRecord> {
    const token = await this.ensureAuthenticated();
    const response = await fetch(`/api/dpr/${encodeURIComponent(dprId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return this.handleProtectedFailure(response, 'Project report status check failed');
    return response.json();
  }

  async getDprHistory(dprId: string): Promise<DprHistory> {
    const token = await this.ensureAuthenticated();
    const response = await fetch(`/api/dpr/${encodeURIComponent(dprId)}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return this.handleProtectedFailure(response, 'Workflow history check failed');
    return response.json();
  }

  async transitionDpr(dprId: string, action: string, note = ''): Promise<DprTransitionResult> {
    const token = await this.ensureAuthenticated();
    const response = await fetch(`/api/dpr/${encodeURIComponent(dprId)}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, note }),
    });
    if (!response.ok) return this.handleProtectedFailure(response, 'Workflow transition failed');
    return response.json();
  }

  async getAuditLogs(page = 1, pageSize = 50): Promise<AuditLogPage> {
    const token = await this.ensureAuthenticated();
    const query = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    const response = await fetch(`/api/audit/logs?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return this.handleProtectedFailure(response, 'Audit log check failed');
    return response.json();
  }
}

export const api = new ApiService();
