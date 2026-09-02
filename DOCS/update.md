# UdyogSaarthi Project Update

## 1. Quick project view

The project is currently focused on the backend engine for a rural entrepreneurship support platform. The main folders are:

- backend/app
  - core: configuration, database setup, shared logic
  - routers: API route modules for scheme, feasibility, DPR, compliance, and directory
  - schemas: request/response models
  - services: geo, KYC, AI SWOT, and PDF generation logic
  - models: database ORM models
- backend/db: database and migrations setup
- backend/tests: basic backend verification
- docs: product, design, research, and project update notes
- infra: Docker and deployment-related configuration
- mobile: mobile app area planned for later work
- frontend: currently removed/deleted from active scope, so frontend development is not active right now

The present version is a backend-first MVP and is designed to support scheme calculation, feasibility checks, business compliance lookup, and DPR generation.

---

## 2. Functionalities added so far

### A. FastAPI application bootstrapping
- A FastAPI app is initialized in backend/app/main.py
- CORS is enabled for API access
- Health endpoint is available at /health
- Routes are registered for:
  - scheme
  - feasibility
  - DPR
  - compliance
  - directory

### B. Scheme calculation engine
- Added in backend/app/core/scheme.py and backend/app/routers/scheme.py
- Supports deterministic scheme rules for:
  - Micro finance scheme
  - Term loan scheme
- Includes:
  - TPC computation
  - raw loan calculation
  - capped loan calculation
  - scheme routing by project cost threshold
  - working capital buffer estimation
  - quarterly EMI/EQI schedule generation
- Rule versioning is implemented with v2024-11 metadata

### C. Feasibility scoring engine
- Added in backend/app/routers/feasibility.py and backend/app/services/geo_service.py
- Supports parsing of business category, location text, radius, population, and coordinates
- Resolves real LGD codes via Data.gov.in and performs Mappls reverse geocoding
- Generates density score and verdict based on competitive intensity
- Classifies zones as:
  - saturated
  - viable
  - niche-gap
- Produces an auditable Overpass-style query string for later geo validation

### D. Geo and provider fallback logic
- The system supports a provider chain for location analysis:
  - Mappls nearby search if configured
  - OSM Overpass fallback when Mappls is unavailable
- This is designed so feasibility checks can degrade gracefully instead of failing outright

### E. DPR generation flow
- Added in backend/app/routers/dpr.py
- Creates DPR IDs and collects structured data for a project report
- Assembles sections including:
  - applicant and business info
  - feasibility data
  - scheme data
  - CAPEX/OPEX data
  - verification status
  - licensing/compliance references
- Uses PDF generation service and stores DPR entries in the database model

### F. PDF rendering service
- Added in backend/app/services/pdf_service.py
- Supports generating DPR PDFs using Jinja2 templates and WeasyPrint
- Runs PDF generation in a background-safe thread to avoid blocking the event loop

### G. AI SWOT fallback service
- Added in backend/app/services/dpr_ai_service.py
- Tries to generate structured SWOT analysis using OpenAI API
- If the key is missing or the request fails, it falls back to a deterministic static SWOT
- This ensures DPR generation does not break on service unavailability

### H. KYC verification service
- Added in backend/app/services/kyc_service.py
- Tries to call external identity verification endpoints
- Returns structured KYC status and degrades safely when the service is unavailable

### I. Compliance checklist module
- Added in backend/app/routers/compliance.py
- Returns license requirements by business type
- Examples include:
  - dairy
  - food
  - retail
  - electronics
- Default fallback rules are also defined for unrecognized categories

### J. Directory lookup module
- Added in backend/app/routers/directory.py
- Generates nearby business profiles from a location and radius
- Can optionally filter by category
- Includes a PostGIS-style SQL statement for future real database use

### K. Database and ORM setup
- Added in backend/app/models and backend/app/core/database.py
- DPR records are modeled for persistence
- Database access patterns are prepared for PostgreSQL and async usage

### L. Health and environment monitoring
- Health endpoint checks:
  - database connectivity
  - Redis connectivity
- This gives a quick operational status for the app

### M. Geospatial Verification System
- Added in backend/app/services/geo_service.py
- Mappls Reverse Geocoding to resolve (lat, lon) to state, district, and block levels
- Live LGD Resolution using Data.gov.in CKAN API to fetch official Local Government Directory codes
- Enforces data integrity by replacing mock LGD implementations with verified government data

---

## 3. Current limitations

### A. Frontend is not active right now
- The frontend folder exists in the repository history and design docs, but it is currently not part of the active build scope
- This means there is no working UI currently implemented in the active project state

### B. Geographic fallbacks and partial data
- While official LGD resolution and Mappls reverse geocoding are now integrated, the system still heavily relies on OSM fallbacks for POI density when Mappls limits are reached or unavailable.
- Geo analysis depends on graceful degradation if external providers (Mappls, Data.gov.in) time out.
- This ensures high availability but means some results may lack real-world authoritative backing during service outages.

### C. External API integration is optional and fail-safe only
- Mappls, OpenAI, DigiLocker, and other integrations are treated as optional
- If they fail, the app generally continues with fallback logic instead of blocking the flow
- This makes the product more resilient, but less production-authoritative

### D. Database persistence is not yet fully production-ready
- ORM and model structure exists, but the project still needs stronger migration and deployment validation
- Real production database setup and data hygiene are still pending

### E. No authentication or role management
- The current API is open and does not enforce user login, admin access, or role-based permissions
- This is not suitable for live government or banking-grade deployment yet

### F. No audit trail / compliance-proof logs
- There is no full request logging or evidence ledger that tracks who generated which DPR and when
- This is important for auditability in formal public-sector workflows

### G. No full end-to-end field officer workflow yet
- The system supports calculations and report generation, but the full operational cycle for SCA, DIC, or bank review is still incomplete

### H. No real production deployment validation
- Docker setup and environment configuration are present, but there is no full production verification run yet
- Runtime health is known only in local development conditions

### I. No real business-data verification layer
- Competitor density, location viability, and compliance requirements are still rule-based or approximate, not validated against full official datasets

---

## 4. Project status summary

Current status: backend MVP is functional and demonstrates the core idea of UdyogSaarthi: scheme math + feasibility logic + DPR generation + compliance checks.

The system is useful as a technical prototype and validation layer, and has begun integrating real government data sources (like LGD API). However, it still needs:
- additional real-integrated government data sources (e.g., identity and licensing verifications)
- production-grade authentication and audit systems
- stronger deployment and migration setup
- complete operational workflow from field officer to final approval

This project is best described as a working prototype with core backend logic already built, while remaining intentionally limited in production readiness.

---

## 5. Key files in the current project

- backend/app/main.py
- backend/app/core/scheme.py
- backend/app/routers/scheme.py
- backend/app/routers/feasibility.py
- backend/app/routers/dpr.py
- backend/app/routers/compliance.py
- backend/app/routers/directory.py
- backend/app/services/geo_service.py
- backend/app/services/pdf_service.py
- backend/app/services/kyc_service.py
- backend/app/services/dpr_ai_service.py
- PRODUCT.md
- DESIGN.md
- docs/systemDesign.md
- docs/research.md
- docs/update.md

---

Last updated: 2026-09-02
