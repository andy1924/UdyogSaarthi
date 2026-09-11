@echo off
REM UdyogSaarthi dev launcher: backend (Docker) + frontend (Vite).
REM Double-click or run from anywhere; services keep running after this closes.
setlocal
REM This script lives in scripts\ - run from the repo root it sits inside.
cd /d "%~dp0.."

REM Docker Desktop on Windows listens on npipe; ignore any stale DOCKER_HOST
REM (e.g. tcp://127.0.0.1:2375) for this session only.
set DOCKER_HOST=npipe:////./pipe/docker_engine

docker info >nul 2>&1
if %errorlevel%==0 goto dockerup
echo Docker daemon not reachable - starting Docker Desktop...
REM %ProgramFiles% keeps this drive-independent, so a non-default install
REM location or system drive does not break the launcher.
start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
call :waitdocker
if %errorlevel% neq 0 (
  echo Docker Desktop did not start in time. Aborting.
  pause
  exit /b 1
)
:dockerup
echo Docker daemon is up.

echo Starting backend (db, redis, api, worker)...
docker compose -f infra\docker-compose.yml -f infra\docker-compose.override.yml up -d db redis api worker
if %errorlevel% neq 0 (
  echo Backend failed to start. Aborting.
  pause
  exit /b 1
)

if not exist frontend\node_modules (
  echo Installing frontend dependencies...
  pushd frontend
  call npm install
  popd
)

echo Starting frontend in THIS window (its logs stream below)...
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000  (docs: http://localhost:8000/docs)
echo.
echo Closing this window stops the frontend.
echo Backend containers have no windows and keep running - stop them with scripts\stop-dev.bat
echo.
pushd frontend
call npm run dev
popd

echo.
echo Frontend exited.
pause
exit /b 0

:waitdocker
set tries=0
:waitloop
timeout /t 10 /nobreak >nul
docker info >nul 2>&1
if %errorlevel%==0 exit /b 0
set /a tries+=1
if %tries% geq 30 exit /b 1
echo Still waiting for Docker Desktop... (%tries%/30)
goto waitloop
