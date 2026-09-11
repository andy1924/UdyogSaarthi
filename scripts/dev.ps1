$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker Desktop/Engine is required.' }
docker info *> $null
if ($LASTEXITCODE -ne 0) { throw 'Start Docker Desktop/Engine and retry.' }

if (-not (Test-Path 'frontend/node_modules')) {
  Push-Location frontend
  npm ci
  Pop-Location
}

docker compose -f infra/docker-compose.yml -f infra/docker-compose.override.yml up -d db redis api worker
Push-Location frontend
npm run dev -- --host 0.0.0.0
Pop-Location
