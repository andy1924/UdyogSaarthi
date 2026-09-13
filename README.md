# UdyogSaarthi

UdyogSaarthi is a multilingual, accessibility-first platform for rural
micro-entrepreneurs. It helps applicants assess a business idea, understand
scheme-linked finance and compliance, and create a reviewable Detailed Project
Report (DPR).

## What it does

- Guides applicants through location, feasibility, finance, compliance, and DPR creation.
- Uses deterministic, server-side scheme calculations; no client-side or LLM-based financial arithmetic.
- Scores local business feasibility using geospatial data and local-government context.
- Supports applicant, DIC officer, and SCA auditor workflows with JWT-based roles and an audit trail.
- Generates DPR PDFs asynchronously through Celery.
- Provides a responsive Vite and React PWA with multilingual UI, guided onboarding, local-language suggestions, and an on-device English and Hindi voice assistant.

## Technology

- Frontend: Vite, React, TypeScript, Tailwind CSS, Vitest
- Backend: FastAPI, SQLAlchemy, Alembic, Celery
- Data: PostgreSQL with PostGIS and Redis
- Documents: Jinja2 and WeasyPrint
- Integrations: Mappls, LGD and Data.gov.in, OSM Overpass, and DigiLocker-compatible KYC settings

## Directory structure

```text
.
├── .github/                    GitHub Actions, issue templates, and PR template
├── backend/
│   ├── app/                    FastAPI routes, services, models, schemas, workers, and PDF templates
│   ├── db/                     Database base configuration and Alembic migrations
│   ├── tests/                  Backend tests
│   ├── pyproject.toml          Python package and tool configuration
│   └── Dockerfile              Backend container image
├── docs/
│   ├── frontend/               Frontend design and voice-assistant documentation
│   ├── plans/                  Approved implementation plans
│   ├── QUICKSTART.md           Local and Docker setup guide
│   ├── apiDocs.md              API contract
│   └── update.md               Current implementation status
├── frontend/
│   ├── public/                 Public browser assets
│   ├── src/
│   │   ├── assets/             Bundled visual assets
│   │   ├── components/         Shared UI, assessment, legal, and voice components
│   │   ├── lib/                API client, language, workflow, and voice logic
│   │   ├── pages/              Application routes and screens
│   │   └── worker/             Browser voice-model worker
│   ├── package.json            Frontend scripts and dependencies
│   └── vite.config.ts          Vite development and build configuration
├── infra/                      Docker Compose and local infrastructure configuration
├── scripts/                    Development, health-check, and shutdown helpers
└── README.md                   Project overview
```

## Quick start

For the full local stack, including PostGIS, Redis, the API, and the Celery
worker, follow the [Docker quickstart](docs/QUICKSTART.md).

To run the frontend independently:

```bash
cd frontend
npm install
npm run dev
```

The app is available at `http://localhost:5173` and expects the API at
`http://localhost:8000`.

## Quality checks

```bash
# Backend
cd backend
ruff check .
pytest

# Frontend
cd frontend
npm run typecheck
npm test
npm run lint
npm run build
```

## Documentation

- [Current project status](docs/update.md)
- [Developer quickstart](docs/QUICKSTART.md)
- [API documentation](docs/apiDocs.md)
- [Product overview](docs/PRODUCT.md)
- [Frontend design system](docs/frontend/DESIGN.md)
- [Voice assistant guide](docs/frontend/voice-assistant.md)
- [Security requirements](docs/cybersecurity.md)

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md),
and [SECURITY.md](SECURITY.md) before opening an issue or pull request.

## License

This project is licensed under the [MIT License](LICENSE).

Created with love by Team Butter Masala Dosa ❤️
