#!/usr/bin/env sh
set -eu
ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"
docker compose -f infra/docker-compose.yml -f infra/docker-compose.override.yml stop db redis api worker
