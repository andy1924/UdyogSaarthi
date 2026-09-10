/**
 * UdyogSaarthi API Client
 *
 * Implements communication with the FastAPI backend per docs/apiDocs.md:
 * - Layer 1 HMAC request signing for mutating calls (POST/PUT/PATCH)
 * - Auto-authentication for protected endpoints (feasibility score, DPR render)
 * - Scheme calculation, compliance licenses, nearby directory, and health status
 */

const DEV_SECRET_KEY = 'change-me-in-production-udyogsaarthi-secret-key';
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

/**
 * Computes SHA-256 HMAC signature per Layer 1 security overlay.
 */
async function computeHmacHeaders(
  method: string,
  path: string,
  bodyStr: string,
  secretKey: string = DEV_SECRET_KEY
): Promise<Record<string, string>> {
  const timestamp = String(Date.now() / 1000);
  const nonce =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `nonce-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return {
      'x-timestamp': timestamp,
      'x-nonce': nonce,
    };
  }

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const message = `${method.toUpperCase()}${path}${timestamp}${nonce}${bodyStr}`;
    const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(message));
    const signature = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return {
      'x-timestamp': timestamp,
      'x-nonce': nonce,
      'x-signature': signature,
    };
  } catch (err) {
    console.warn('HMAC signing failed in client, continuing without signature', err);
    return {
      'x-timestamp': timestamp,
      'x-nonce': nonce,
    };
  }
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
    const headers = await computeHmacHeaders('POST', path, body);
    const response = await fetch(path, {
      method: 'POST', body, signal, headers: { ...headers, 'Content-Type': 'application/json' },
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
    if (response.status === 401) {
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
    return this.token;
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
    if (this.token) return this.token;
    throw new Error('Sign in is required');
  }

  async login(email: string, password: string): Promise<void> {
    const body = new URLSearchParams({ username: email, password }).toString();
    const headers = await computeHmacHeaders('POST', '/auth/token', body);
    const response = await fetch('/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
      body,
    });
    if (!response.ok) throw new Error(response.status === 401 ? 'Incorrect email or password' : 'Sign in is unavailable');
    const result = await response.json();
    this.setToken(result.access_token);
  }

  async registerApplicant(input: { email: string; password: string; fullName: string }): Promise<void> {
    const body = JSON.stringify({ email: input.email, password: input.password, full_name: input.fullName });
    const headers = await computeHmacHeaders('POST', '/auth/register', body);
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body,
    });
    if (!response.ok) {
      if (response.status === 409) throw new Error('An account already exists for this email');
      throw new Error('We could not create your account');
    }
    await this.login(input.email, input.password);
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

    const hmacHeaders = await computeHmacHeaders('POST', path, bodyStr);
    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...hmacHeaders,
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

    const hmacHeaders = await computeHmacHeaders('POST', path, bodyStr);
    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...hmacHeaders,
      },
      body: bodyStr,
    });

    if (!res.ok) {
      return this.handleProtectedFailure(res, 'Local demand check failed');
    }

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
    });

    const hmacHeaders = await computeHmacHeaders('POST', path, bodyStr);
    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...hmacHeaders,
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
}

export const api = new ApiService();
