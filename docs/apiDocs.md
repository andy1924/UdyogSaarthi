# UdyogSaarthi API Guide

This guide documents the active backend API for the current prototype.

Base URL: `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs` and `http://localhost:8000/redoc` when `APP_ENV` is not `production`.

## Authentication

Protected endpoints require:

```http
Authorization: Bearer <access_token>
```

| Endpoint | applicant | dic_officer | sca_auditor |
|---|:---:|:---:|:---:|
| `POST /auth/token` | public | public | public |
| `POST /auth/register` | public | public | public |
| `GET /auth/me` | yes | yes | yes |
| `GET /api/scheme/rules` | public | public | public |
| `POST /api/scheme/calculate` | public | public | public |
| `POST /api/feasibility/score` | yes | yes | yes |
| `GET /api/compliance/licenses` | public | public | public |
| `GET /api/directory/nearby` | public | public | public |
| `POST /api/dpr/render` | yes | yes | yes |
| `GET /api/dpr/{dpr_id}` | yes | yes | yes |
| `GET /api/dpr/{dpr_id}/download` | yes | yes | yes |
| `POST /api/dpr/{dpr_id}/transition` | yes, action-dependent | yes, action-dependent | yes, action-dependent |
| `GET /api/dpr/{dpr_id}/history` | yes | yes | yes |
| `/api/audit/*` | `403` | yes | yes |

Authentication proves that a user is active. The current prototype does not enforce DPR ownership on DPR read, download, or history endpoints.

## System

### `GET /health`

Checks PostgreSQL and Redis independently.

```json
{
  "status": "ok",
  "database": "up",
  "redis": "up"
}
```

`status` is `degraded` when either dependency is unavailable. This endpoint is public.

## Authentication Endpoints

### `POST /auth/register`

Creates an applicant account. Send JSON:

```json
{
  "email": "ravi.kumar@example.com",
  "password": "Secure123",
  "full_name": "Ravi Kumar",
  "username": "ravi_dairy"
}
```

Password must be at least 8 characters and contain a letter and a digit. `full_name` and `username` are optional. The response is `201 Created`; duplicate email returns `409`.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "ravi.kumar@example.com",
  "username": "ravi_dairy",
  "full_name": "Ravi Kumar",
  "role": "applicant",
  "is_active": true
}
```

### `POST /auth/token`

OAuth2 form request, not JSON:

```text
username=user@example.com&password=yourpassword
```

Returns a JWT valid for the configured access-token lifetime, 24 hours by default:

```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer"
}
```

Invalid credentials return `401`; inactive accounts return `403`.

### `GET /auth/me`

Returns the authenticated user profile using the same shape as registration.

## Scheme Endpoints

### `GET /api/scheme/rules`

Returns versioned rules for the `micro` and `term` tiers. The current rule version is `v2024-11`.

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
  }
]
```

### `POST /api/scheme/calculate`

JSON input:

```json
{
  "margin": 250000,
  "business_category": "dairy"
}
```

`margin` is required and must be between `5000` and `5000000`. The response includes `tpc`, `max_loan_raw`, `max_loan_capped`, `tier`, the applied `rules`, `working_capital_buffer`, `eqi_schedule`, and `eqi_amount`.

## Feasibility

### `POST /api/feasibility/score` 🔒

Requires an authenticated user. Provide either `location_text` or both `lat` and `lon`:

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

`location_text`, `lat`, and `lon` are alternative location anchors; coordinates are optional when the location text is sufficient. `radius_m` defaults to `5000` and is limited to `1000-10000`.

The response contains `lgd`, `poi_count`, `density_score`, `verdict`, `swot`, `opportunities`, and `overpass_ql`. `verdict` is one of `saturated`, `viable`, or `niche-gap`.

- `401`: missing or invalid JWT.
- `502`: live authoritative location or POI data could not be resolved.

## Compliance

### `GET /api/compliance/licenses`

Required query parameter: `business_category`. Optional query parameters: `state` and `district`.

```text
/api/compliance/licenses?business_category=dairy&state=Bihar&district=Nalanda
```

The service uses ChromaDB/OpenAI when available and falls back to static rules otherwise.

```json
{
  "business_category": "dairy",
  "state": "Bihar",
  "district": "Nalanda",
  "licenses": [
    {
      "id": "fssai",
      "label": "FSSAI Licence",
      "desc": "Food safety for milk/products",
      "required": true
    }
  ],
  "sources": ["food.md"],
  "ai_generated": false,
  "confidence": 0.0
}
```

`ai_generated`, `sources`, and `confidence` describe the result; they do not constitute official licensing approval.

## Directory

### `GET /api/directory/nearby`

Queries PostGIS business profiles. Required query parameters are `lat` and `lon`; `radius_m` defaults to `10000` and is limited to `1000-50000`. `category` is optional.

```text
/api/directory/nearby?lat=25.32&lon=85.28&radius_m=10000&category=dairy
```

Returns up to 20 nearest profiles. If the database/spatial query is unavailable, the endpoint returns `503` with `Authoritative directory data unavailable`.

## DPR

### `POST /api/dpr/render` 🔒

Requires authentication. The request requires `feasibility` and `scheme` objects produced by the corresponding endpoints. `capex_opex`, `business_name`, and `verified` are optional; `verified` is `self-reported` or `aa-verified`.

```json
{
  "applicant_name": "Ravi Kumar",
  "business_name": "Lakshmi Dairy Unit",
  "feasibility": { "...": "Feasibility response" },
  "scheme": { "...": "Scheme calculation response" },
  "capex_opex": {
    "capex": 500000,
    "opex": 180000,
    "notes": "draft estimate"
  },
  "verified": "self-reported"
}
```

The endpoint assembles the report, runs SWOT and KYC concurrently, persists a DPR record, and queues PDF rendering through Celery. A normal response is:

```json
{
  "dpr_id": "DPR-A1B2C3D4",
  "pdf_url": "/api/dpr/DPR-A1B2C3D4/download",
  "status": "queued",
  "data": { "...": "assembled DPR payload" },
  "verified": "self-reported"
}
```

`status` is `queued` when the Celery broker accepts the task. If dispatching the
task fails, it is `pdf_failed`. The download endpoint can return `404` until the
worker finishes and writes the PDF.

### `GET /api/dpr/{dpr_id}` 🔒

Returns persisted DPR metadata, status, verification, timestamps, payload, and a
PDF URL. DPR PDF statuses are `queued`, `ready`, or `pdf_failed`: `ready` means
the file has been written and can be downloaded. Historical records may retain
the older `generated`, `verified`, or `archived` values. Returns `404` when the
DPR record does not exist.

### `GET /api/dpr/{dpr_id}/download` 🔒

Returns the generated PDF as `application/pdf`. Returns `404` when the record is missing, the worker has not generated the file, or the file is missing from disk.

## DPR Workflow

### `POST /api/dpr/{dpr_id}/transition` 🔒

JSON body:

```json
{
  "action": "submit_for_review",
  "note": "Ready for review"
}
```

Valid transitions and roles:

| Current state | Action | Next state | Allowed roles |
|---|---|---|---|
| `draft` | `submit_for_review` | `sca_review` | applicant, dic_officer |
| `sca_review` | `approve_sca` | `dic_approved` | dic_officer |
| `sca_review` | `reject` | `rejected` | dic_officer, sca_auditor |
| `dic_approved` | `send_to_bank` | `bank_review` | dic_officer |
| `bank_review` | `finalize` | `finalized` | sca_auditor |
| `bank_review` | `reject` | `rejected` | sca_auditor |
| any non-terminal state | `force_reject` | `rejected` | sca_auditor |

`rejected` and `finalized` are terminal. The response includes `previous_state`, `current_state`, the triggering user, and the full history. Invalid transitions or roles return `403`.

### `GET /api/dpr/{dpr_id}/history` 🔒

Returns the current workflow state, valid triggers for that state, and append-only application-level history entries. History entries include `from`, `to`, `trigger`, `by_user_id`, `timestamp`, and `note`.

## Audit Trail

Audit endpoints are read-only and restricted to `dic_officer` and `sca_auditor`.

- `GET /api/audit/logs?page=1&page_size=50`: paginated logs, maximum page size `200`.
- `GET /api/audit/logs/dpr/{dpr_id}`: events whose payload references the DPR.
- `GET /api/audit/logs/user/{user_id}?page=1&page_size=50`: events for a user UUID.

Audit entries include action, endpoint, user ID when available, IP address, timestamp, and a redacted payload snapshot where applicable. Mutating `/api/*` requests are recorded by middleware; route-level events can therefore produce more than one entry for a single operation.

## Recommended Client Flow

1. Register or log in and retain the JWT.
2. Call feasibility with a location anchor and business category.
3. Call scheme calculation with the project margin.
4. Load compliance requirements and optionally nearby directory profiles.
5. Submit feasibility and scheme results to DPR render.
6. Poll `GET /api/dpr/{dpr_id}` or retry the download until the worker has produced the PDF.
7. Use the workflow endpoints for review transitions.

For the source of truth at runtime, use the generated OpenAPI schema at `/openapi.json` in development.
