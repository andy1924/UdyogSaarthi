# Cybersecurity Layer 1: Edge & Gateway Security Overlay

## Layer overview

Layer 1 is an opt-in perimeter overlay for the FastAPI gateway. It provides:

- Request integrity: mutating requests (`POST`, `PUT`, and `PATCH`) must carry an HMAC-SHA256 signature over `METHOD + raw path + timestamp + nonce + body`.
- Anti-replay: timestamps older than 120 seconds are rejected and each nonce is atomically reserved in Redis for the same window.
- Rate limiting: Redis token buckets apply 30 requests/minute to public routes, 5 requests/minute to login routes, and 5 requests/minute to job/PDF creation routes, per client address.
- Defensive headers: responses receive CSP, frame protection, MIME sniffing protection, HSTS, and a strict referrer policy.

Layer 1 does not replace authentication, authorization, TLS termination, input validation, or application-level audit controls. Run it behind HTTPS and use a dedicated production secret.

## Backend files used/read

The following existing files were inspected before implementation:

- `backend/app/main.py` - FastAPI construction and current middleware order.
- `backend/app/core/config.py` - `SECRET_KEY`, `REDIS_URL`, and environment settings.
- `backend/requirements.txt` - installed backend dependencies.
- `backend/pyproject.toml` - package dependencies and Python version.
- `backend/app/core/` - existing core module layout.

## New files created

- `backend/app/core/security/__init__.py` - package export for the setup function.
- `backend/app/core/security/layer1_hmac.py` - HMAC request validation, timestamp checks, and Redis nonce reservation.
- `backend/app/core/security/layer1_ratelimit.py` - Redis token bucket and route policy selection.
- `backend/app/core/security/layer1_headers.py` - defensive response headers.
- `backend/app/core/security/setup.py` - `setup_layer1_security(app)` composition wrapper.
- `docs/cybersecurity_layer1.md` - this implementation and testing guide.

## Modifications log

No existing backend files were modified. In particular, `backend/app/main.py` remains unchanged. To enable the overlay, call `setup_layer1_security(app)` after creating the FastAPI app; integration is intentionally left explicit so existing deployments are not changed implicitly.

## Testing guidance

With the overlay enabled and the API running, a missing signature is rejected:

```bash
curl -i -X POST http://localhost:8000/auth/token
```

To generate a valid signature, use the exact raw path and body. This PowerShell example uses the configured `SECRET_KEY`:

```powershell
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
$nonce = [guid]::NewGuid().ToString('N')
$method = 'POST'
$path = '/auth/token'
$body = ''
$message = [Text.Encoding]::UTF8.GetBytes($method + $path + $timestamp + $nonce + $body)
$key = [Text.Encoding]::UTF8.GetBytes($env:SECRET_KEY)
$hmac = [Security.Cryptography.HMACSHA256]::new($key)
$signature = ([BitConverter]::ToString($hmac.ComputeHash($message))).Replace('-', '').ToLowerInvariant()
curl.exe -i -X POST "http://localhost:8000$path" -H "X-Timestamp: $timestamp" -H "X-Nonce: $nonce" -H "X-Signature: $signature" -H "Content-Type: application/x-www-form-urlencoded" --data "$body"
```

Change one character in `X-Signature` to verify invalid signatures are rejected with `401`. Reuse the same nonce to verify replay rejection with `409`. Send more than 5 requests per minute to `/auth/token` from one client to verify `429` and `Retry-After`; public endpoints allow 30 requests per minute.