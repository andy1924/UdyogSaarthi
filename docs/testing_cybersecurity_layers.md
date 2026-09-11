# Cybersecurity Layer 1 and Layer 2 Test Suite

## Overview

`backend/tests/test_security_overlay.py` verifies the active security overlay without changing business code or requiring a live Redis/PostgreSQL service for the middleware tests.

Layer 1 coverage includes security headers, missing and stale HMAC signatures, valid gateway passage, and login token-bucket limits with `429` and `Retry-After` assertions.

Layer 2 coverage includes unauthenticated endpoint protection, Redis-backed JWT revocation, staff-only RBAC denial for applicants, ASGI identity-state injection, and a combined HMAC/JWT business-route check. The business-route check compares the response from the existing scheme calculation callable with the same callable's expected result, confirming the overlay does not alter scheme arithmetic.

Layer 3 coverage includes generated and preserved correlation IDs, sanitized generic `500` responses, unknown-path `403` denial, delegation of known API paths, strict Pydantic extra-field rejection, unsafe markup rejection, and bounded numeric validation.

Layer 4 coverage includes AES-256-GCM round trips with unique envelopes, tampered-ciphertext rejection, transaction-local RLS context setup/clear operations, RLS policy template presence, and Layer 4 composition state registration.

The suite uses an in-memory Redis fake for deterministic nonce, rate-limit, and revocation behavior. Endpoint tests use FastAPI `TestClient`; if platform-native application dependencies are unavailable, those endpoint tests are skipped with the import reason rather than failing during test collection.

## Run From VS Code Terminal

Open the integrated terminal at the repository root (the directory that
contains `backend/` and `frontend/`):

```sh
cd /path/to/UdyogSaarthi   # omit this if you are already at the repo root
```

Create or activate the backend environment and install dependencies:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
```

On macOS or Linux the activation step is `source .venv/bin/activate` instead;
every other command on this page is identical.

Run only the cybersecurity overlay suite from the repository root:

```powershell
python -m pytest backend/tests/test_security_overlay.py -v -s
```

Run only Layer 1 checks from the repository root:

```powershell
python -m pytest backend/tests/test_security_overlay.py -k "test_layer1" -v -s
```

Run only Layer 2 checks:

```powershell
python -m pytest backend/tests/test_security_overlay.py -k "test_layer2" -v -s
```

Run only Layer 3 checks:

```powershell
python -m pytest backend/tests/test_security_overlay.py -k "test_layer3" -v -s
```

Run only Layer 4 checks:

```powershell
python -m pytest backend/tests/test_security_overlay.py -k "test_layer4" -v -s
```

Run it from the backend directory instead:

```powershell
cd backend
python -m pytest tests/test_security_overlay.py -v -s
```

From `frontend/` or any unrelated directory, a relative path such as
`tests/test_security_overlay.py` points to that current directory and will fail.

The test file resolves `backend/` from its own absolute location before
importing `app.*`, so both commands use the same import path. From any other
directory, invoke pytest with the absolute path to the test file in your
checkout:

```sh
# from the repository root
python -m pytest backend/tests/test_security_overlay.py -v -s

# or from anywhere, with the absolute path to this checkout
python -m pytest /path/to/UdyogSaarthi/backend/tests/test_security_overlay.py -v -s
```

Run lint and compilation checks:

```powershell
cd backend
python -m ruff check .
python -m compileall -q app tests
```

For CI/Linux, install the native WeasyPrint libraries used by the existing application before importing `app.main`. The Docker image already installs the required Cairo, Pango, GDK Pixbuf, and related runtime libraries.

On Windows, WeasyPrint also needs native GTK/GObject DLLs. Install MSYS2 with `winget`, install the MinGW64 runtime packages, and add the runtime directory to the user PATH:

```powershell
winget install --id MSYS2.MSYS2 --exact
& C:\msys64\usr\bin\pacman.exe -S --needed mingw-w64-x86_64-pango mingw-w64-x86_64-cairo mingw-w64-x86_64-gdk-pixbuf2
[Environment]::SetEnvironmentVariable('Path', "$([Environment]::GetEnvironmentVariable('Path', 'User'));C:\msys64\mingw64\bin", 'User')
```

Restart the VS Code terminal after changing PATH, then verify:

```powershell
python -c "import weasyprint; print('WeasyPrint native runtime loaded')"
```

## Interpreting Failures

- Header failure: Layer 1 security-header middleware is missing, ordered incorrectly, or a required header value changed.
- Missing or stale HMAC failure: request canonicalisation, timestamp validation, or mutating-request interception changed.
- Valid HMAC failure: signature construction, raw path/body handling, nonce reservation, or Redis test double behavior is inconsistent with the middleware.
- Rate-limit failure: route policy selection, token-bucket accounting, `429`, or `Retry-After` behavior changed.
- Unauthenticated endpoint failure: Layer 2 allowed a protected route through, or Layer 1/Redis returned an earlier infrastructure error. Check the response status and body first.
- Revoked-token failure: `revoked:<jti>` lookup, token decoding, or fail-closed revocation handling changed.
- RBAC failure: role allow-list or `Insufficient permissions` behavior changed.
- State injection failure: `scope["state"]["identity"]` is absent or no longer contains `user_id` and `role`.
- Business-route integrity failure: investigate the overlay chain and the existing scheme route separately. The expected value is generated from the existing calculation callable, so a mismatch indicates payload handling or response serialization changed.
- Application import skip: the test environment lacks a native dependency such as WeasyPrint's `libgobject-2.0-0`; install the platform dependencies rather than changing application logic.

A failure in one category does not automatically imply a failure in another. Use the focused test name and first failing assertion to identify whether the issue is perimeter validation, identity lifecycle, RBAC, or business-route integration.
