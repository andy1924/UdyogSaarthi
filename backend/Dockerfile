# ============================================================
# UdyogSaarthi — Production Dockerfile
# ============================================================
# Stage 1: builder — installs all Python deps in an isolated layer.
# Stage 2: runtime — copies only the installed packages and source
#          from the builder; runs as a non-root user.
# ============================================================

FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    # WeasyPrint native deps
    libcairo2-dev \
    libpango1.0-dev \
    libgdk-pixbuf-2.0-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/pyproject.toml ./pyproject.toml
RUN pip install --upgrade pip && pip install --no-cache-dir ".[dev]"

# ============================================================
# Stage 2: runtime
# ============================================================
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # Ensures Python output is sent straight to stdout (no buffering).
    PYTHONFAULTHANDLER=1

WORKDIR /app

# Runtime system libraries only — no build tools.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    # curl for Docker HEALTHCHECK
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder.
COPY --from=builder /usr/local /usr/local

# Copy application source.
COPY backend /app

# ── Non-root user ──────────────────────────────────────────────────────────
# Create a minimal user without a home directory or shell.
# Running as non-root limits blast radius if the container is compromised.
RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup --no-create-home --shell /usr/sbin/nologin appuser && \
    # Allow the app user to write to the DPR output directory.
    mkdir -p /app/generated_dprs && \
    chown -R appuser:appgroup /app/generated_dprs

USER appuser

EXPOSE 8000

# ── Docker daemon health check ─────────────────────────────────────────────
# The daemon probes /health every 30s; 3 consecutive failures = unhealthy.
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# ── Entrypoint ─────────────────────────────────────────────────────────────
# Production: no --reload, single worker per container (scale horizontally).
# The docker-compose entrypoint overrides this with the Alembic upgrade step.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
