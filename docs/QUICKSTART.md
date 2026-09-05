# 🚀 Developer Quickstart Guide: Running UdyogSaarthi Locally

This guide provides step-by-step instructions for developers to spin up the **UdyogSaarthi** development environment locally using Docker and Docker Compose.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:
- **Docker Desktop** (or Docker Engine 20.10+ and Docker Compose v2+)
- **Git**
- *(Optional for Hybrid local dev)* **Python 3.11+**

---

## ⚙️ Environment Configuration

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd UdyogSaarthi
   ```

2. **Set up Environment Variables:**
   Create a `.env` file inside the `backend/` directory:
   ```bash
   cp backend/env.md backend/.env # or create backend/.env manually
   ```

   Ensure `backend/.env` contains key settings (default fallback values exist in `backend/app/core/config.py`):
   ```env
   # Database & Redis (when running Python outside Docker container)
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/udyogsaarthi
   REDIS_URL=redis://localhost:6379/0
   
   APP_ENV=development
   DEBUG=True
   SECRET_KEY=dev_secret_key_change_in_production

   # External API Keys & Services
   OPENAI_API_KEY=your_openai_api_key
   MAPPLS_REST_KEY=your_mappls_api_key
   DATA_GOV_API_KEY=your_data_gov_api_key
   LGD_API_RESOURCE_ID=9115b89c-b661-4d12-8a1c-6ef2dc81c7b5
   OVERPASS_API_URL=https://overpass-api.de/api/interpreter
   API_SETU_BEARER_TOKEN=b9eb74c511abde7b0b0ebcec34d6b11b6b0fc35d
   ```

---

## 🛠️ Method 1: Full Docker Compose Environment (Recommended)

Run the entire application stack—PostGIS database, Redis cache, and FastAPI backend API—inside Docker containers.

### Step 1: Spin up all services
From the repository root directory, run:
```bash
docker compose -f infra/docker-compose.yml up --build -d
```

This will launch:
- 🗄️ **PostGIS DB (`udyogsaarthi-db`)** on `localhost:5432`
- ⚡ **Redis (`udyogsaarthi-redis`)** on `localhost:6379`
- 🚀 **FastAPI Backend (`udyogsaarthi-api`)** on `localhost:8000` (with live code reloading mounted from `./backend`)
- ⚙️ **Celery Worker (`udyogsaarthi-worker`)** for PDF, AI, and background tasks

### Step 2: Apply Database Migrations
Once containers are healthy, run Alembic migrations inside the API container:
```bash
docker compose -f infra/docker-compose.yml exec api alembic upgrade head
```

### Step 3: Check Container Logs & Health
```bash
# View API live logs
docker compose -f infra/docker-compose.yml logs -f api

# View container status
docker compose -f infra/docker-compose.yml ps
```

---

## 🐍 Method 2: Hybrid Setup (Docker Services + Local Python Virtualenv)

Ideal for active Python code debugging, fast IDE integration, and running pytest locally while leveraging Docker for database and caching dependencies.

### Step 1: Start Database and Redis Containers
```bash
docker compose -f infra/docker-compose.yml up -d db redis
```

### Step 2: Set up Local Python Environment
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -e ".[dev]"
```

### Step 3: Run Database Migrations Locally
```bash
# Inside backend directory with .venv activated:
alembic upgrade head
```

### Step 4: Start Development Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 5: Start the Celery Worker

Run this in a second terminal with the backend virtual environment activated. It is required for asynchronous DPR PDF generation:

```bash
celery -A app.worker.celery_app worker -Q pdf,ai,default --pool=solo --loglevel=info
```

---

## 🔍 Verification & Health Checks

Once the services are running, verify by accessing:

- 🩺 **Health Check API**: [http://localhost:8000/health](http://localhost:8000/health)
- 📜 **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- 📖 **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

Test the health endpoint from CLI:
```bash
curl http://localhost:8000/health
# Expected shape: {"status":"ok","database":"up","redis":"up"}
```

---

## 🧪 Testing & Code Quality

Run tests and linter locally (with `.venv` activated):

```bash
cd backend

# Run code linter
ruff check .

# Run pytest suite
pytest
```

To run pytest inside the Docker container:
```bash
docker compose -f infra/docker-compose.yml exec api pytest
```

---

## 🛑 Stopping & Cleaning Up Docker

- **Stop all services:**
  ```bash
  docker compose -f infra/docker-compose.yml stop
  ```

- **Tear down containers & networks:**
  ```bash
  docker compose -f infra/docker-compose.yml down
  ```

- **Tear down containers & persistent volumes (Fresh DB Reset):**
  ```bash
  docker compose -f infra/docker-compose.yml down -v
  ```

---

## ⚡ Troubleshooting & FAQs

### 1. Port 5432 or 6379 already in use
If local PostgreSQL or Redis is already running on your host OS:
- Stop local services: `sudo service postgresql stop` / `brew services stop postgresql`
- Or use **Method 2 (Hybrid Setup)** connecting to your existing local DB instance.

### 2. Alembic migration fails inside container
Ensure `db` service is healthy before running migrations:
```bash
docker compose -f infra/docker-compose.yml ps
```

### 3. WeasyPrint / PDF dependencies missing
`WeasyPrint` dependencies (`libpq`, `build-essential`) are pre-installed in the Docker image specified in `backend/Dockerfile`. If running natively on macOS/Linux in hybrid mode, install system libraries:
- macOS: `brew install pango gdk-pixbuf cairo`
- Ubuntu/Debian: `sudo apt-get install build-essential python3-dev python3-pip python3-setuptools python3-wheel python3-cffi libcairo2 libpango-1.0-0 libgdk-pixbuf2.0-0 libffi-dev shared-mime-info`
