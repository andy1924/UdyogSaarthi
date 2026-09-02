# UdyogSaarthi API Guide for Frontend Developers

This document gives a short, practical view of the active backend APIs that a frontend app should call. It focuses on the required inputs, important responses, and the way data flows between screens.

Base URL:
- Local: http://localhost:8000
- API docs: http://localhost:8000/docs

---

## 1. Health check

### Endpoint
GET /health

### Purpose
Check whether the backend, database, and Redis are active.

### Example response
```json
{
  "status": "ok",
  "database": "up",
  "redis": "up"
}
```

### Notes for frontend
- Use this on app startup or for a quick system status indicator.
- Status may be "degraded" if one dependency is down.

---

## 2. Scheme rules

### Endpoint
GET /api/scheme/rules

### Purpose
Return the versioned government scheme rules that should be displayed in the UI.

### Example response
```json
[
  {
    "tier": "micro",
    "cap": 125000,
    "rate": 0.065,
    "tenure_years": 3,
    "moratorium_months": 3,
    "effective_from": "2024-11-01",
    "version": "v2024-11"
  },
  {
    "tier": "term",
    "cap": 4500000,
    "rate": 0.08,
    "tenure_years": 7,
    "moratorium_months": 6,
    "effective_from": "2024-11-01",
    "version": "v2024-11"
  }
]
```

### Frontend usage
- Show scheme tiers in the finance step.
- Use the returned `rate`, `tenure_years`, and `moratorium_months` for UI labels.
- Do not recompute scheme math in the frontend if a backend response is available.

---

## 3. Scheme calculation

### Endpoint
POST /api/scheme/calculate

### Required input
```json
{
  "margin": 250000,
  "business_category": "dairy"
}
```

### Input rules
- `margin`: number, required
- range: 5000 to 5000000
- `business_category`: optional string, used mainly for context and future extension

### Example response
```json
{
  "margin": 250000,
  "tpc": 2500000,
  "max_loan_raw": 2250000,
  "max_loan_capped": 125000,
  "tier": "micro",
  "rules": {
    "tier": "micro",
    "cap": 125000,
    "rate": 0.065,
    "tenure_years": 3,
    "moratorium_months": 3,
    "effective_from": "2024-11-01",
    "version": "v2024-11"
  },
  "working_capital_buffer": 31250,
  "eqi_schedule": [
    {
      "quarter": 4,
      "principal": 1234.56,
      "interest": 234.56,
      "emi": 1456.12,
      "balance": 0,
      "due_label": "Q4"
    }
  ],
  "eqi_amount": 1456.12
}
```

### Frontend usage
- Use this for the loan calculator screen.
- Show `tpc`, `max_loan_capped`, `tier`, `eqi_amount`, and the payment schedule.
- Keep the rule version visible near the numbers for audit trust.

---

## 4. Feasibility scoring

### Endpoint
POST /api/feasibility/score

### Required input
```json
{
  "location_text": "Hilsa, Nalanda, Bihar",
  "business_category": "dairy",
  "lat": 25.32,
  "lon": 85.28,
  "radius_m": 5000,
  "population": 50000
}
```

### Input rules
- `location_text`: required, free text location for matching or fallback resolution
- `business_category`: required, e.g. `dairy`, `retail`, `food`, `electronics`
- `lat` and `lon`: optional, but helpful if available from the user’s place selection
- `radius_m`: optional; default 5000, range 1000 to 10000
- `population`: optional, used to normalize density score

### Example response
```json
{
  "lgd": {
    "state": "Bihar",
    "district": "Nalanda",
    "block": "Hilsa",
    "gp": "Hilsa",
    "code": "BR-NA-HI-001",
    "lat": 25.32,
    "lon": 85.28
  },
  "business_category": "dairy",
  "poi_count": 18,
  "density_score": 62.5,
  "verdict": "viable",
  "swot": {
    "strength": "Local demand for daily-need category",
    "weakness": "Need awareness",
    "opportunity": "First-mover gap in 5km",
    "threat": "Input cost volatility"
  },
  "opportunities": [
    {
      "title": "Cold storage micro-unit",
      "reason": "Perishables gap"
    }
  ],
  "overpass_ql": "[out:json][timeout:5];\nnode[shop=dairy](around:5000,25.32,85.28);\nout count;"
}
```

### Frontend usage
- Use this to power the viability screen.
- Show:
  - LGD block and district
  - `density_score`
  - `verdict`
  - `swot`
  - list of opportunities
- Put the `overpass_ql` in a debug or audit panel if needed.

---

## 5. Compliance / license checklist

### Endpoint
GET /api/compliance/licenses

### Required query parameter
```text
business_category=dairy
```

### Example response
```json
{
  "business_category": "dairy",
  "licenses": [
    {
      "id": "udyam",
      "label": "Udyam Registration",
      "desc": "MSME registration via udyamregistration.gov.in",
      "required": true
    },
    {
      "id": "fssai",
      "label": "FSSAI Licence",
      "desc": "Food safety for milk/products",
      "required": true
    },
    {
      "id": "trade",
      "label": "Trade Licence",
      "desc": "Panchayat/municipal trade licence",
      "required": true
    }
  ]
}
```

### Frontend usage
- Show the list as a compliance checklist for the business category.
- Use `required: true` to display completion states.
- Support fallback handling when category is unknown.

---

## 6. Nearby directory / peer lookup

### Endpoint
GET /api/directory/nearby

### Required query params
```text
lat=25.32&lon=85.28&radius_m=10000&category=dairy
```

### Example response
```json
{
  "query": {
    "lat": 25.32,
    "lon": 85.28,
    "radius_m": 10000,
    "category": "dairy"
  },
  "count": 3,
  "profiles": [
    {
      "id": "p1",
      "name": "Lakshmi Dairy",
      "category": "dairy",
      "distance_m": 850,
      "lat": 25.33,
      "lon": 85.29
    }
  ],
  "sql": "SELECT * FROM profiles WHERE ST_DWithin(...)"
}
```

### Frontend usage
- Use this to show local peer businesses or similar nearby units.
- Show distance and category in a card list.
- At the moment this is deterministic mock data, not a live database-backed directory.

---

## 7. DPR generation

### Endpoint
POST /api/dpr/render

### Required input
```json
{
  "applicant_name": "Ravi Kumar",
  "business_name": "Lakshmi Dairy Unit",
  "feasibility": {
    "lgd": {
      "state": "Bihar",
      "district": "Nalanda",
      "block": "Hilsa",
      "gp": "Hilsa",
      "code": "BR-NA-HI-001",
      "lat": 25.32,
      "lon": 85.28
    },
    "business_category": "dairy",
    "poi_count": 18,
    "density_score": 62.5,
    "verdict": "viable",
    "swot": {},
    "opportunities": [],
    "overpass_ql": "[out:json][timeout:5]; node[shop=dairy](around:5000,25.32,85.28); out count;"
  },
  "scheme": {
    "margin": 250000,
    "tpc": 2500000,
    "max_loan_raw": 2250000,
    "max_loan_capped": 125000,
    "tier": "micro",
    "rules": {
      "tier": "micro",
      "cap": 125000,
      "rate": 0.065,
      "tenure_years": 3,
      "moratorium_months": 3,
      "effective_from": "2024-11-01",
      "version": "v2024-11"
    },
    "working_capital_buffer": 31250,
    "eqi_schedule": [],
    "eqi_amount": 1456.12
  },
  "capex_opex": {
    "capex": 500000,
    "opex": 180000,
    "notes": "draft estimate"
  },
  "verified": "self-reported"
}
```

### Example response
```json
{
  "dpr_id": "DPR-A1B2C3D4",
  "pdf_url": "/api/dpr/DPR-A1B2C3D4/download",
  "status": "ready",
  "data": {
    "applicant": "Ravi Kumar",
    "business": "Lakshmi Dairy Unit",
    "location": {},
    "feasibility": {},
    "scheme": {},
    "capex_opex": {},
    "verified": "self-reported"
  },
  "verified": "self-reported"
}
```

### Frontend usage
- Call this after user completes feasibility and finance steps.
- Show a loading state while DPR is being generated.
- Use `pdf_url` to open or download the generated PDF.

---

## 8. Important frontend implementation notes

### Data flow recommended
1. User enters business category and location
2. Call `POST /api/feasibility/score`
3. Call `POST /api/scheme/calculate` using margin
4. Fetch compliance checklist via `GET /api/compliance/licenses`
5. Optionally show nearby businesses via `GET /api/directory/nearby`
6. Generate DPR via `POST /api/dpr/render`

### Best practices
- Preserve the exact rule version shown in the UI for user trust.
- Always show the user the result of `verdict` and `density_score` before continuing.
- Validate the shape of data before rendering, especially for nested objects like `feasibility` and `scheme`.
- Treat all external services as optional and gracefully handle missing or failed responses.

### Important caveats
- This is still a prototype backend, not a fully production-grade government workflow.
- Some modules are deterministic/mock implementations rather than live government data sources.
- The backend is designed to degrade gracefully, which is good for reliability but not for final official verification.

---

## 9. Suggested frontend screen mapping

| Screen | API to call |
|---|---|
| Home / landing | GET /health |
| Feasibility | POST /api/feasibility/score |
| Finance | GET /api/scheme/rules + POST /api/scheme/calculate |
| Compliance | GET /api/compliance/licenses |
| Directory | GET /api/directory/nearby |
| DPR preview | POST /api/dpr/render |
| Download | GET /api/dpr/{dpr_id}/download |

---

This document is intentionally concise to help frontend developers integrate with the current backend contract quickly.
