# UdyogSaarthi

**UdyogSaarthi** is a government-grade trust layer and companion platform designed for rural micro-entrepreneurs. It aims to replace predatory DPR (Detailed Project Report) middlemen by providing hyper-local business feasibility checks, deterministic scheme math, and automated DPR generation in the user's vernacular language.

---

## 🎯 Core Features
- **Deterministic Scheme Engine:** Zero LLM arithmetic; strictly follows versioned scheme rules to compute TPC (Total Project Cost), margins, and EQI (Equated Quarterly Installment).
- **Geospatial Feasibility Scoring:** Uses live OSM Overpass POI density data and **Mappls reverse geocoding** combined with authoritative **LGD (Local Government Directory) codes via Data.gov.in** to produce an auditable density score.
- **DPR Generation:** Assembles applicant info, feasibility data, scheme calculations, and CAPEX/OPEX into a final PDF report using Jinja2 and WeasyPrint.
- **Compliance & Directory:** Provides RAG-assisted license checklists with static fallback and PostGIS-backed nearby business lookups.
- **Authentication, Workflow & Audit:** Provides JWT login, role-based DPR review transitions, and staff-only audit log queries.

---

## 🏗️ Architecture & Tech Stack
The project is currently focused on the **Backend MVP**.
- **Backend Framework:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL with PostGIS + Redis for caching and Celery queues
- **Document Generation:** Jinja2 + WeasyPrint through Celery
- **External Integrations:** Mappls (geocoding/POI), Data.gov.in (LGD API), OSM Overpass (POI fallback), OpenAI (SWOT/compliance), and DigiLocker/API Setu-compatible KYC settings

---

## 📂 Directory Structure
- `backend/app`: FastAPI application (routers, schemas, services, core, models)
- `backend/db`: Database and migrations
- `backend/tests`: Test suite for the backend application
- `docs/`: Product, design, frontend specs, and API documentation
- `infra/`: Docker and deployment configurations
- `frontend/`: *(Currently removed from active scope)*
- `mobile/`: *(Planned for Phase 2)*

---

## 🚀 Getting Started

> 💡 **Quickstart with Docker:** For a one-command containerized setup (PostGIS + Redis + FastAPI), see our [**Developer Docker Quickstart Guide**](docs/QUICKSTART.md).

### Prerequisites
- Python 3.11 or higher
- PostgreSQL (or PostGIS) running locally on port `5432`
- Redis running locally on port `6379`

### Installation
1. **Clone the repository and enter the backend directory:**
   ```bash
   cd backend
   ```
2. **Set up a virtual environment and install dependencies:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install --upgrade pip
   pip install -e ".[dev]"
   ```

### Environment Configuration
Create a `.env` file in the `backend` directory. The following variables are supported (see `backend/app/core/config.py` for defaults):
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/udyogsaarthi
REDIS_URL=redis://localhost:6379/0
DEBUG=True
SECRET_KEY=your_secret_key_here

# Geo Integrations
MAPPLS_REST_KEY=your_mappls_api_key
DATA_GOV_API_KEY=your_data_gov_api_key
LGD_API_RESOURCE_ID=9115b89c-b661-4d12-8a1c-6ef2dc81c7b5

# AI Fallback
OPENAI_API_KEY=your_openai_api_key
```

### Running the Application
Start the FastAPI development server:
```bash
uvicorn app.main:app --reload
```
- API Docs: `http://localhost:8000/docs`
- Healthcheck: `http://localhost:8000/health`

---

## 🧪 Testing & CI
The project uses `pytest` for testing and `ruff` for linting, enforced via GitHub Actions.
```bash
# Run the linter
ruff check .

# Run the test suite
pytest
```

---

## 🚧 Current Status & Limitations
- Backend **and frontend are live-wired**: FastAPI APIs plus a Next.js PWA (applicant wizard, officer review, audit console, DPR view) talking to the live API.
- Core logic for authentication, scheme math, feasibility, compliance, DPR generation, PDF queuing, workflow transitions, and audit logging is implemented.
- **Live LGD resolution** and **Mappls reverse geocoding** are integrated. The feasibility API returns `502 Bad Gateway` if authoritative location or POI data cannot be fetched.
- This remains a prototype: AI/KYC/compliance fallbacks are not authoritative, DPR persistence is best-effort, PDF output requires a Celery worker, and DPR ownership checks are not yet enforced.

---

## 📖 Documentation
- [**Developer Docker Quickstart**](docs/QUICKSTART.md)
- [**API Documentation**](docs/apiDocs.md)
- [**Project Status Updates**](docs/update.md) ← read this first for what exists
- [**Product Truth**](docs/PRODUCT.md)
- [**Design System**](docs/DESIGN.md)
- [**Frontend Theme (pine/emerald, authoritative)**](docs/frontend/DESIGN.md)
