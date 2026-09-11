# Developer scripts

These scripts are the canonical entry points for local development:

- `dev.sh` — macOS/Linux/WSL launcher
- `dev.ps1` — Windows PowerShell launcher
- `start-dev.bat` — Windows double-click launcher (Docker Desktop + Vite)
- `stop.sh` — stop backend containers without deleting volumes
- `stop-dev.bat` — Windows launcher that stops backend containers
- `doctor.sh` — verify prerequisites and repository configuration

They intentionally use the checked-in Docker Compose files and
`frontend/package-lock.json`, so contributors do not need OS-specific paths or
package-manager choices.
