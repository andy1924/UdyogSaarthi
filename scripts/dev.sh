#!/usr/bin/env sh
set -eu
ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

command -v docker >/dev/null 2>&1 || { echo 'Docker Desktop/Engine is required.' >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo 'Start Docker Desktop/Engine and retry.' >&2; exit 1; }

if [ ! -d frontend/node_modules ]; then
  echo '[dev] Installing frontend dependencies from package-lock.json…'
  (cd frontend && npm ci)
fi

echo '[dev] Starting API, worker, PostGIS and Redis…'
docker compose -f infra/docker-compose.yml -f infra/docker-compose.override.yml up -d db redis api worker
echo '[dev] Starting Vite at http://localhost:5173 (Ctrl-C stops Vite only)'
cd frontend
exec npm run dev -- --host 0.0.0.0
