#!/usr/bin/env sh
set -eu
ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"
fail=0
command -v docker >/dev/null 2>&1 || { echo '✗ docker missing'; fail=1; }
command -v node >/dev/null 2>&1 || { echo '✗ node missing (20+ recommended)'; fail=1; }
command -v npm >/dev/null 2>&1 || { echo '✗ npm missing'; fail=1; }
docker info >/dev/null 2>&1 || { echo '✗ Docker daemon unavailable'; fail=1; }
[ -f infra/secrets/db_password.txt ] || { echo '✗ missing infra/secrets/db_password.txt'; fail=1; }
[ -f infra/secrets/app_secret_key.txt ] || { echo '✗ missing infra/secrets/app_secret_key.txt'; fail=1; }
[ -f frontend/package-lock.json ] || { echo '✗ frontend/package-lock.json missing'; fail=1; }
[ -f backend/.env ] || { echo '✗ backend/.env missing (copy backend/env.md)'; fail=1; }
if [ -f backend/.env ] && ! grep -Eq '^SARVAM_API_KEY=.+' backend/.env; then
  echo '⚠ translation provider key missing (set SARVAM_API_KEY in backend/.env)'
fi
[ "$fail" -eq 0 ] && echo '✓ UdyogSaarthi development environment is ready'
exit "$fail"
