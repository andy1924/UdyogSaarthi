# UdyogSaarthi

**UdyogSaarthi** is a government-grade trust layer and companion platform designed for rural micro-entrepreneurs. It aims to replace predatory DPR (Detailed Project Report) middlemen by providing hyper-local business feasibility checks, deterministic scheme math, and automated DPR generation in the user's vernacular language.

## Purpose
Fix two critical decisions before money moves:
1. **Business viability:** Assessing competitive density and local demand.
2. **Loan structuring:** Deterministic calculations based on government schemes (e.g., Micro Finance, Term Loan).

## Core Features
- **Deterministic Scheme Engine:** Zero LLM arithmetic; strictly follows versioned scheme rules to compute TPC (Total Project Cost), margins, and EQI (Equated Quarterly Installment).
- **Geospatial Feasibility Scoring:** Uses live OSM Overpass POI density data and Mappls reverse geocoding combined with authoritative LGD (Local Government Directory) codes via Data.gov.in to produce an auditable density score.
- **DPR Generation:** Assembles applicant info, feasibility data, scheme calculations, and CAPEX/OPEX into a final PDF report using Jinja2 and WeasyPrint.
- **Compliance & Directory:** Provides rule-based license checklists and peer business directory lookups.

## Architecture & Tech Stack
The project is currently focused on the **Backend MVP**.
- **Backend Framework:** FastAPI (Python)
- **Database:** PostgreSQL (with PostGIS for future spatial queries) + Redis (planned for caching/queues)
- **Document Generation:** Jinja2 + WeasyPrint
- **External Integrations:** Mappls (Geocoding), Data.gov.in (LGD API), OSM Overpass (POI density), OpenAI (AI SWOT fallback)

## Directory Structure
- `backend/app`: FastAPI application (routers, schemas, services, core, models)
- `backend/db`: Database and migrations
- `docs/`: Product, design, update notes, and API documentation
- `infra/`: Docker and deployment configurations
- `frontend/`: (Currently removed from active scope)
- `mobile/`: (Planned for Phase 2)

## Current Status & Limitations
- The **frontend is inactive**; development is focused strictly on backend APIs.
- Core logic for feasibility, scheme math, and DPR generation is working.
- **Live LGD resolution** and **Mappls reverse geocoding** are integrated, throwing strict 502 errors if authoritative data cannot be fetched. OSM queries gracefully degrade.
- **Pending:** Production-grade authentication, robust database persistence/migrations, and real identity/licensing verification layers.

See `docs/update.md` and `docs/apiDocs.md` for more details on the latest API capabilities and project state.
