@echo off
REM Stops the UdyogSaarthi backend containers (PostGIS, Redis, API, worker).
REM Data volumes are kept - run start-dev.bat to resume.
REM If the start-dev window is still open, close it to stop the frontend.
setlocal
cd /d "%~dp0"
set DOCKER_HOST=npipe:////./pipe/docker_engine
docker compose -f infra\docker-compose.yml -f infra\docker-compose.override.yml stop db redis api worker
pause
