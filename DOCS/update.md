# UdyogSaarthi — Project Update & Status (2026-09-02)

## Overview

UdyogSaarthi is a government-grade fintech platform designed to help first-time rural micro-entrepreneurs make two critical decisions **before** money moves: **business viability** and **loan structuring**. The platform replaces predatory DPR (Detailed Project Report) middlemen with deterministic scheme math and hyper-local feasibility analysis.

**Current State:** MVP backend API with 5 core modules; frontend PWA scaffold with design system complete; local-first offline architecture designed; production infrastructure ready (Docker, PostgreSQL+PostGIS, Redis).

---

## ✅ Implemented Functionalities

### 1. **Scheme Finance Calculator** (`/api/scheme/*`)
**Module:** `backend/app/routers/scheme.py`

#### Features:
- **Versioned Scheme Rules** (`GET /api/scheme/rules`)
  - Micro Finance Scheme: ₹1.25L cap, 6.5% p.a., 3-year tenure, 3-month moratorium
  - Term Loan Scheme: ₹45L cap, 8% p.a., 7-year tenure, 6-month moratorium
  - Rule version `v2024-11` (effective 2024-11-01) with audit trail

- **Deterministic Loan Calculation** (`POST /api/scheme/calculate`)
  - Input: Margin money (entrepreneur's cash)
  - Processing:
    - Computes Total Project Cost (TPC) = margin / 10%
    - Routes to Micro (≤₹1.4L) or Term (>₹1.4L) scheme automatically
    - Caps loan to scheme maximum
  - Output:
    - Maximum loan amount (90% of TPC)
    - Tier assignment (micro/term)
    - Working capital buffer (25% of loan)
    - **Equal Quarterly Installment (EQI) Schedule** with:
      - Quarter-by-quarter principal, interest, EMI, balance
      - Moratorium quarters (no payment)
      - Precision to ₹ (no LLM arithmetic)

#### Limitations:
- ⚠️ No dynamic interest rate adjustment (fixed per scheme)
- ⚠️ No prepayment penalty configuration
- ⚠️ No subsidy/guarantee eligibility calculation (state-level PMMY/MUDRA mapping not implemented)
- ⚠️ No credit score validation (offline-capable; requires optional AA integration)
- ⚠️ No multi-loan portfolio tracking

---

### 2. **Feasibility Analysis Engine** (`/api/feasibility/*`)
**Module:** `backend/app/routers/feasibility.py`

#### Features:
- **Location Resolution** (LGD + Mock OSM)
  - Text-to-coordinate resolution (Bihar-centric mock data: Hilsa, Nalanda blocks)
  - Deterministic hash-based fallback for unmapped locations
  - Returns: State, district, block, GP, LGD code, lat/lon

- **Business Category POI Density Analysis** (`POST /api/feasibility/score`)
  - Input: Location text, business category (dairy/retail/food/electronics), radius (1–50 km), population
  - Mock POI count (simulates OSM Overpass query): weighted by category saturation
    - Electronics/dairy: higher saturation bias (reflects rural market reality)
    - Retail: baseline
  - Density score (0–100): combines POI count + population dampening
  - Verdict: **saturated** (>70), **viable** (30–70), **niche-gap** (<30)

- **SWOT Template** per verdict:
  - Saturated: "High competition" + "Price war risk" with 3 pivot opportunities (agro-processing, cold storage, repair hub)
  - Viable: "Local demand" + "Need awareness" + "First-mover gap"
  - Niche-gap: "Need awareness" + "Input cost volatility"

- **Overpass Query Generation** (auditable OSM query string)
  - Returns the exact `node["shop"="..."]` query used (reproducible for DIC/SCA review)

#### Limitations:
- ⚠️ **Mock LGD data only:** Hardcoded 2 locations (Hilsa, Nalanda); deterministic hash for others — NOT real LGD database
- ⚠️ **Mock POI counts:** Simulated with MD5 hash + category bias, not live OSM Overpass API
- ⚠️ **No real population data:** Ignored in calculations; placeholder field only
- ⚠️ **No competitor pricing:** SWOT is template-based, not market-scraped
- ⚠️ **No demand-supply matching:** Verdict is density-only; does not consider seasonal crops, migration, or input costs
- ⚠️ **No real-time routing:** Distance to supplier/market not computed
- ⚠️ **No competitor financial health:** Does not flag NPA-prone categories

---

### 3. **DPR Document Generation** (`/api/dpr/*`)
**Module:** `backend/app/routers/dpr.py`

#### Features:
- **DPR Orchestration** (`POST /api/dpr/render`)
  - Input: Applicant name, business name, feasibility output, scheme output, CAPEX/OPEX breakdown, verification flag
  - Processing:
    - Generates unique DPR ID (`DPR-XXXXXXXX`)
    - Assembles 7-section document skeleton:
      1. Cover (branding, date, DIC stamp)
      2. Feasibility (POI density, SWOT, verdict)
      3. Scheme Structure (loan tier, EMI, tenure)
      4. CAPEX/OPEX (applicant-provided breakdown)
      5. EQI Schedule (quarterly installments)
      6. License Checklist (compliance)
      7. Declaration (signature block)
    - Returns JSON payload ready for PDF rendering

- **DPR Retrieval** (`GET /api/dpr/{dpr_id}`)
  - Status check; mock PDF URL endpoint

#### Limitations:
- ⚠️ **No PDF generation:** Mock URL only; WeasyPrint + S3 enqueue deferred (requires Celery integration)
- ⚠️ **No digital signature:** Signature block is placeholder; no PKI/e-sign gateway (e-Mudra, NIC e-Sig not integrated)
- ⚠️ **No DPR versioning:** Cannot track amendments or re-applies; single snapshot only
- ⚠️ **No bank pre-fill:** DPR is not auto-submitted to NaBFL / SBI PMS
- ⚠️ **No OCR validation:** CAPEX/OPEX not validated against quotations; applicant text is taken as-is
- ⚠️ **No financial ratio analysis:** DPR does not compute Debt Service Coverage Ratio (DSCR), working capital adequacy, or IRR
- ⚠️ **No collateral valuation:** Land/asset verification not included

---

### 4. **Compliance & License Checklist** (`/api/compliance/*`)
**Module:** `backend/app/routers/compliance.py`

#### Features:
- **Category-Specific License Rules** (`GET /api/compliance/licenses`)
  - Input: Business category (dairy, retail, food, electronics, or default)
  - Output: Ordered checklist of required licenses:
    - **Dairy:** Udyam, FSSAI, Trade Licence
    - **Food:** Udyam, FSSAI, Trade Licence
    - **Retail:** Udyam, Trade Licence, GST (if applicable)
    - **Electronics:** Udyam, Trade Licence
    - **Default:** Udyam + Trade Licence (fallback)
  - Each item includes: ID, label, brief description

#### Limitations:
- ⚠️ **Hardcoded rules:** Only 4 categories defined; new categories default to generic 2-license list
- ⚠️ **No location-specific compliance:** Does not vary by state, district, or municipal corporation rules
- ⚠️ **No turnover/scale thresholds:** GST exemption not calculated (hardcoded "if applicable" text)
- ⚠️ **No license application flow:** No guidance on forms, docs, fees, timelines
- ⚠️ **No compliance tracking:** Cannot record which licenses are applied, approved, or pending
- ⚠️ **No pollution/environment checks:** No SPCB/DPCC requirements for food/dairy
- ⚠️ **No labor law compliance:** No building permit, fire safety, or factory license flags

---

### 5. **Directory & Peer Lookup** (`/api/directory/*`)
**Module:** `backend/app/routers/directory.py`

#### Features:
- **Nearby Profiles Discovery** (`GET /api/directory/nearby`)
  - Input: Lat/lon, radius (1–50 km), optional category filter
  - Output: 2–5 profiles of similar nearby businesses (mock deterministic)
    - Each profile: name, category, distance, coordinates
    - Profiles are generated deterministically (same query = same results)
    - Sorted by distance
  - SQL scaffold for real PostGIS query (commented, future-ready)

#### Limitations:
- ⚠️ **Mock data only:** Business names and locations are deterministic hash-generated, not real peer businesses
- ⚠️ **No real database:** Does not query actual PostgreSQL/PostGIS; profiles are in-memory computed
- ⚠️ **No peer financial data:** Cannot show profitability, turnover, NPA status of similar businesses
- ⚠️ **No peer contact info:** No WhatsApp/mobile for peer mentorship
- ⚠️ **No peer lending network:** No peer-to-peer fund access or guarantee groups
- ⚠️ **No success/failure metrics:** Does not show survival rate of similar businesses in area
- ⚠️ **No supply chain mapping:** Cannot identify shared suppliers or bulk-buy opportunities

---

### 6. **Health Check & Infrastructure** 
**Module:** `backend/app/main.py`

#### Features:
- **Composite Health Endpoint** (`GET /health`)
  - Checks database connectivity (PostgreSQL via AsyncSessionLocal)
  - Checks Redis connectivity (timeout-safe, mocked in-memory for local dev)
  - Returns status: "ok" (both up), "degraded" (partial), with component-level flags
  - Total timeout: 1.6s

- **CORS Middleware**
  - Allow all origins (`*`), credentials, methods, headers (dev-friendly; restricted in prod)

- **API Metadata**
  - Title: "UdyogSaarthi API"
  - Version: 0.1.0
  - Description: Deterministic scheme math, KYN feasibility, DPR, compliance (mocked LGD/OSM, auditable rules v2024-11)

#### Limitations:
- ⚠️ **No authentication:** No JWT, API key, or OAuth; all endpoints public
- ⚠️ **No rate limiting:** No request throttling; susceptible to brute-force or DoS
- ⚠️ **No audit logging:** No request/response log to database for compliance review
- ⚠️ **No request signing:** No HMAC/signature validation for DIC kiosk deployment
- ⚠️ **No graceful shutdown:** No drainage of in-flight requests on deployment

---

## 🏗️ Architecture & Dependencies

### Backend Stack
- **Framework:** FastAPI 0.104+
- **ASGI:** Uvicorn
- **Database:** PostgreSQL + PostGIS (configured; not yet populated)
- **Cache:** Redis (health-checked; mock local for dev)
- **ORM:** SQLAlchemy 2.0 (AsyncSession)
- **Validation:** Pydantic v2
- **Migrations:** Alembic (scaffolded; not yet versioned)

### Frontend (Scaffolded, Not Yet Implemented)
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS + design tokens (hex → CSS vars)
- **UI Primitives:** Radix UI + custom receipt-slip components
- **State:** Dexie (IndexedDB) for offline-first queue
- **PWA:** next-pwa (manifest, SW, offline fallback)
- **Design:** Vernacular-inspired (Devanagari serif, wheat/vermilion palette, receipt-slip cards)

### Infrastructure
- **Containerization:** Docker + docker-compose (db, cache, api services defined)
- **Deployment:** Ready for k8s or Railway; not yet live

---

## 📊 Data Schemas (Implemented)

| Schema | Fields | Purpose |
|--------|--------|---------|
| `SchemeCalculateIn` | `margin: float` | Entrepreneur's cash contribution |
| `SchemeCalculateOut` | `margin, tpc, max_loan_raw, max_loan_capped, tier, rules, working_capital_buffer, eqi_schedule[], eqi_amount` | Loan structure |
| `FeasibilityIn` | `location_text, business_category, lat/lon, radius_m, population` | Market analysis input |
| `FeasibilityOut` | `lgd, business_category, poi_count, density_score, verdict, swot, opportunities[], overpass_ql` | Viability signal |
| `DPRGenerateIn` | `applicant_name, business_name, feasibility, scheme, capex_opex, verified` | DPR assembly input |
| `DPRGenerateOut` | `dpr_id, pdf_url, status, data, verified` | DPR document snapshot |
| `ComplianceOut` | `business_category, licenses[]` | License checklist |
| `DirectoryOut` | `query, count, profiles[], sql` | Peer lookup result |

---

## 🚨 Critical Gaps & Next Steps

### Tier 1: MVP Blocking Issues
1. **No real LGD/OSM integration**
   - All feasibility data is mocked; real gov.in LGD API + Overpass integration required
   - Impact: DIC field officers cannot trust location/POI data

2. **No PDF generation**
   - DPR is JSON only; WeasyPrint + S3 enqueue must be implemented
   - Impact: No printable/signable document for applicant

3. **No database population**
   - PostgreSQL + Redis running, but no schema migrations applied
   - Impact: Cannot persist DPRs or user state

4. **No authentication/authorization**
   - Public endpoints; no role-based access (DIC officer vs. applicant vs. auditor)
   - Impact: Security risk for prod; cannot audit who generated which DPR

### Tier 2: UX/Business Logic
5. **No field officer workflow**
   - DIC/SCA user flow, approval flags, AA-verification integration not implemented
   - Impact: Cannot deploy to district offices yet

6. **No loan approval gateway**
   - DPR does not flow to NaBFL/SBI backend; no approval/rejection tracking
   - Impact: Applicant must manually take DPR to bank; defeats middleman-elimination goal

7. **No vernacular support**
   - API returns English only; no Hindi/Marathi/Bengali response templates
   - Impact: Rural entrepreneurs cannot use without translation

8. **No offline sync**
   - Frontend PWA skeleton exists, but no backend `/sync` endpoint for IndexedDB ↔ server reconciliation
   - Impact: Cannot queue DPRs on 2G and replay later

### Tier 3: Compliance & Audit
9. **No compliance audit trail**
   - No request logging, no rule-version annotations on DPRs, no amendment history
   - Impact: SCA audits cannot verify scheme correctness retrospectively

10. **No financial ratio computation**
    - DPR lacks DSCR, working capital adequacy, collateral valuation
    - Impact: Banks reject as incomplete; applicants over-borrow

---

## 📈 Known Mock Behaviors

| Component | Mock Behavior | Production Replacement |
|-----------|---------------|------------------------|
| LGD Resolver | Hardcoded Bihar blocks; hash fallback | `lms.gov.in` LGD API |
| POI Counts | MD5-hash deterministic; category bias | OSM Overpass API `node["shop"=...]` |
| Peer Directory | Deterministic name list + distance hash | PostgreSQL + PostGIS real queries |
| DPR PDF | Mock URL `/mock/{dpr_id}.pdf` | WeasyPrint + S3 enqueue via Celery |
| Redis | Health-checked; not actually used | Real Redis cache for session/DPR queue |
| Email/SMS | Not implemented | Twilio + SendGrid for notifications |
| Digital Signature | Placeholder | e-Sign gateway (e-Mudra/NIC) |

---

## 🎯 Success Criteria (Current State)

| Metric | Status | Evidence |
|--------|--------|----------|
| Scheme math deterministic (no LLM) | ✅ | EQI schedule `math.ceil` + `Decimal` precision |
| Feasibility verdict in <500ms | ✅ | Hash-based; no I/O |
| DPR JSON complete (7 sections) | ✅ | `DPRGenerateOut` includes all schema fields |
| Health check <2s | ✅ | `@app.get("/health")` with 1.6s timeout |
| CORS configured (dev) | ✅ | `CORSMiddleware` allow `*` |
| API docs auto-generated | ✅ | Swagger `/docs` + ReDoc `/redoc` |
| Offline-capable architecture | ⚠️ | Dexie schema drafted; no `/sync` endpoint |
| Production Docker ready | ⚠️ | `Dockerfile` + `docker-compose.yml` present; not tested |

---

## 🔄 Deployment Readiness

- **Local Development:** ✅ Works via `uvicorn main:app --reload`
- **Docker Compose:** ⚠️ Services defined; no health-check integration tested
- **Environment Config:** ⚠️ `.env` via `pydantic.BaseSettings`; secrets not yet managed
- **Database Migrations:** ⚠️ Alembic scaffolded; no versioned schema yet
- **CI/CD:** ❌ No GitHub Actions, no automated tests, no linting

---

## 📝 Testing & Quality

- **Unit Tests:** 1 health check test (`tests/test_health.py`)
- **Integration Tests:** None
- **Load Tests:** None
- **Security Tests:** None
- **Coverage:** Not measured

---

## 🎓 Documentation

- ✅ `PRODUCT.md` — Product truth, scheme rules, design language
- ✅ `DESIGN.md` — Visual system, typography, accessibility, PWA manifest
- ✅ `docs/systemDesign.md` — Module boundaries, data layer, offline queue
- ✅ `docs/research.md` — Scheme math derivation, failure modes, NPA targets
- ✅ `docs/superpowers/` — Product vision roadmap (Phase 1: web, Phase 2: mobile, Phase 3: IVR/SMS)
- ⚠️ API documentation — Auto-generated Swagger only; no usage guide for field officers
- ❌ Deployment guide — Not written
- ❌ Troubleshooting guide — Not written

---

## 🚀 Quick Start (For Contributors)

```bash
# Backend
cd backend
source .venv/bin/activate
pip install -r pyproject.toml
cd app && python -m uvicorn main:app --reload

# Frontend (Phase 2)
cd frontend
npm install
npm run dev

# Docker
docker-compose up -d
```

**API Base:** `http://localhost:8000`  
**Docs:** `http://localhost:8000/docs`

---

## 📞 Support & Feedback

All functionalities are mocked for feasibility demo. For prod deployment, engage with:
- **Gov.in APIs:** LGD portal team, OSM India community
- **Banking:** NaBFL, SBI PMS integration
- **Security:** DSCI compliance for rural fintech
- **Accessibility:** IAMAI guidelines for rural digital

---

**Last Updated:** 2026-09-02  
**Version:** 0.1.0-alpha  
**Maintainers:** SIH26 UdyogSaarthi team
