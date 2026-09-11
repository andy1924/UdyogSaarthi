@echo off
REM Stops the UdyogSaarthi backend containers (PostGIS, Redis, API, worker).
REM Data volumes are kept - run scripts\start-dev.bat to resume.
REM If the start-dev window is still open, close it to stop the frontend.
setlocal
REM This script lives in scripts\ - run from the repo root it sits inside.
cd /d "%~dp0.."
set DOCKER_HOST=npipe:////./pipe/docker_engine
docker compose -f infra\docker-compose.yml -f infra\docker-compose.override.yml stop db redis api worker
pause
