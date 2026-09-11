# Developer scripts

These scripts are the canonical entry points for local development:

- `dev.sh` — macOS/Linux/WSL launcher
- `dev.ps1` — Windows PowerShell launcher
- `stop.sh` — stop backend containers without deleting volumes
- `doctor.sh` — verify prerequisites and repository configuration

They intentionally use the checked-in Docker Compose files and
`frontend/package-lock.json`, so contributors do not need OS-specific paths or
package-manager choices.
