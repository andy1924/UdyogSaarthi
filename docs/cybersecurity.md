# UdyogSaarthi Cybersecurity Architecture and Policy

**Document status:** Authoritative security specification  
**Version:** 1.0  
**Date:** 2026-09-02  
**Owner:** UdyogSaarthi engineering and security owners  
**Applies to:** FastAPI API, PostgreSQL/PostGIS, Redis, Celery, Jinja2/WeasyPrint, integrations, CI/CD, and operators

> This document defines the target production security overlay. The current repository is a backend MVP. Controls labelled **Required** or **Deployment control** must be completed and evidenced before handling production personal or financial data. This document is a technical policy, not legal advice; the organisation must obtain current legal and regulatory review before launch.

## 1. Purpose and Security Model

UdyogSaarthi is a rural micro-entrepreneur companion platform handling identity, contact, location, financial, DPR, KYC, scheme and workflow data. The Security Overlay Architecture protects these data flows at boundaries without changing deterministic scheme or feasibility calculations.

### 1.1 Overlay architecture

```text
 Client / staff console
        |
        | TLS 1.3, HSTS, request timestamp, HMAC, correlation ID
        v
 [L1 Edge/WAF] -- IP/user token bucket, size limits, bot and API policy
        |
        v
 [L2 ASGI overlay]
        |-- security headers, CORS allow-list, auth, replay check
        |-- request validation, RBAC, audit context
        v
 [FastAPI business routes]       [Celery task producer]
        |                                  |
        | deterministic math unchanged       | signed task + least privilege
        v                                  v
 [L3 service boundary]              [L6 isolated workers]
        |                                  |-- PDF sandbox / no network
        v                                  |-- temporary non-sensitive files
 [L4 PostgreSQL/PostGIS] <----------+     |-- result TTL and cleanup
        | field envelope encryption         v
        | RLS, TLS, restricted roles       [Redis broker/cache]
        v
 [L5 hash-chained audit ledger] --> SIEM/WORM export --> security monitoring
        |
        +--> KMS/HSM: KEK only; DEKs remain encrypted in database
```

### 1.2 Guiding principles

- **Zero Trust:** Every request, worker task and database session is authenticated, authorised, scoped and observable. Network location is not an authorisation decision.
- **Defense in depth:** Edge, ASGI, service, database, worker, key-management and monitoring controls must fail independently.
- **Cryptographic accountability:** Requests, sensitive fields, tokens and audit records use authenticated cryptography. Hashes detect tampering; they do not replace access control or an external immutable copy.
- **Privacy by design:** Collect the minimum data needed, separate identity from business analytics, apply purpose limitation and retention expiry, and redact secrets from logs.
- **Secure defaults:** Production refuses default keys, debug mode, wildcard CORS, plaintext credentials, public data services and unrestricted worker egress.
- **Fail closed for security decisions:** Missing identity, stale signatures, unavailable revocation state or failed authorisation returns a safe error. Availability fallbacks must never bypass access control.

## 2. Compliance and Control Mapping

This mapping is an engineering control crosswalk, not a certification. Regulatory interpretations and current circulars must be revalidated at release time.

| Security layer | Technical control | DSCI Privacy Framework / DPDP Act 2023 | RBI cyber resilience guidance | CERT-In / SEBI expectations | OWASP API Security |
|---|---|---|---|---|---|
| L1-L2 perimeter | TLS 1.3, HSTS, WAF, rate limits, replay and HMAC checks | Confidentiality, safeguards, purpose-limited processing | Secure API channel, fraud and transaction integrity | Preventive controls and incident evidence | API1, API4, API8, API10 |
| Identity | Short-lived JWT, Redis revocation, MFA for staff, RBAC | Access control and privacy safeguards | Strong authentication, least privilege, session control | Account compromise detection | API2, API5 |
| L3 service | Pydantic validation, ownership checks, object-level authorisation | Data minimisation and privacy by design | Secure SDLC and change control | Input validation and vulnerability management | API1, API3, API6 |
| L4 database | AES-256-GCM envelope encryption, RLS, TLS, restricted roles | Security safeguards, breach impact reduction | Data protection and privileged access monitoring | Evidence preservation | API1, API3, API6 |
| L5 ledger | Hash chain, external WORM/SIEM copy, restricted append path | Accountability and breach investigation | Audit trails, monitoring and cyber incident evidence | Time-synchronised logs and retention | API10 |
| L6 workers | Queue isolation, no network, template allow-list, output validation | Processor safeguards and data minimisation | Third-party/component risk and operational resilience | Malware/SSRF/LFI prevention | API4, API7, API8 |
| Incident response | Alerting, containment, notification runbook, restore tests | Personal-data breach response and processor coordination | Incident reporting and recovery | CERT-In reporting timelines and audit preservation | API10 |

The security owner maintains a control register with: control ID, owner, implementation link, test, evidence location, exception, expiry and reviewer. Any incident or material architecture change triggers a compliance review.

## 3. Data Classification, Lifecycle and Trust Boundaries

| Class | Examples | Storage and handling |
|---|---|---|
| Restricted | Aadhaar/identity numbers, KYC responses, financial account data, credentials, signing keys | Field-level encryption; access only for an explicit purpose; never in logs, URLs, prompts or PDF filenames |
| Confidential | Phone/email, address, coordinates, DPR inputs, workflow decisions | TLS in transit; encrypted at rest; RLS and role/ownership checks; redacted audit snapshots |
| Internal | Scheme rules, operational metrics, queue metadata | Authenticated access; no public bucket or unauthenticated endpoint |
| Public | Published scheme explanations and approved directory data | Integrity-controlled release; no user data mixed into public exports |

Data inventory entries must record purpose, source, lawful basis/notice, fields, owner, processors, residency, retention and deletion method. Production retention defaults are: access/security logs 180 days online plus 12 months in restricted archive; audit ledger at least 7 years or the applicable approved period; generated DPRs 30 days unless a documented business/legal hold applies; Redis cache and Celery results use the shortest task-specific TTL. A deletion or correction request is handled by the privacy owner, with legal holds and audit integrity preserved.

## 4. Perimeter and Gateway Defenses (Layers 1 and 2)

### 4.1 TLS 1.3

- Terminate TLS at the managed edge or ingress. Redirect HTTP to HTTPS and do not expose API, PostgreSQL or Redis directly to the public internet.
- Permit TLS 1.3. TLS 1.2 may be enabled only for documented legacy clients with an approved exception; disable SSLv3, TLS 1.0/1.1, weak ciphers, compression and renegotiation.
- Use a managed certificate, automated renewal, certificate transparency monitoring and a tested expiry alert. Prefer ECDHE with AES-GCM or ChaCha20-Poly1305 as provided by the TLS 1.3 implementation.
- Use TLS or a private network for API-to-database, API-to-Redis and worker-to-broker connections. Verify certificates; do not set `ssl=False` to resolve an operational error.
- HSTS is sent only after HTTPS is confirmed: `max-age=31536000; includeSubDomains` and `preload` only when all subdomains are HTTPS-capable.

### 4.2 Rate limiting and resource controls

Use an atomic Redis Lua token bucket keyed by `rl:{version}:{route}:{principal}`, where the principal is the authenticated user ID and the fallback is the trusted proxy-normalised client IP. Store no raw sensitive identifiers in keys. The bucket has a documented capacity and refill rate per route class:

| Route class | Default policy | Additional control |
|---|---:|---|
| Login/token | 5 requests/minute/IP and account | exponential delay, alert after repeated failures |
| Read API | 120 requests/minute/user | response pagination and maximum page size |
| Mutating API | 30 requests/minute/user | idempotency key for retried writes |
| DPR/PDF/AI jobs | 5 jobs/minute/user | queue quota, payload and output size limits |
| Unauthenticated | 30 requests/minute/IP | no expensive downstream calls |

These are starting values; load tests and abuse telemetry may tune them. Return `429` with `Retry-After`, fail closed when the limiter cannot establish a decision, and prevent oversized bodies, deeply nested JSON, unbounded pagination and decompression bombs.

### 4.3 Replay protection and HMAC request integrity

For signed mutating requests, require:

```text
X-Key-Id: client-key-2026-01
X-Timestamp: 2026-09-02T12:34:56Z
X-Nonce: 32-byte-random-value
X-Signature: base64url(HMAC-SHA256(secret, canonical_request))
```

The canonical request is `METHOD + "\n" + normalized_path + "\n" + X-Timestamp + "\n" + X-Nonce + "\n" + SHA256(raw_body)`. Use a constant-time comparison. Accept timestamps only within 120 seconds of trusted server UTC time; reject malformed, future or reused nonces. Store `replay:{key_id}:{nonce}` in Redis with an atomic `SET NX EX 120`; a failed set is a replay. Verify the key is active, scoped to the route and rotated according to the key register. HMAC authenticates a request but does not replace user authentication or authorisation.

## 5. Identity, Authentication and Authorisation

### 5.1 JWT lifecycle

- Use a short-lived access token: target 15 minutes, maximum 30 minutes. Include `sub`, `jti`, `iat`, `exp`, `iss`, `aud` and a token version. Reject missing or invalid claims, wrong issuer/audience, algorithm confusion and tokens outside their validity period.
- Prefer an asymmetric signing key (RS256 or ES256) with a published key ID and KMS-backed rotation. HS256 is permitted only for a single controlled deployment with a high-entropy secret and documented rotation.
- Store refresh tokens only as hashes, rotate them on use, bind them to a device/session record, and revoke the entire token family after reuse detection. Do not put tokens in URLs or audit snapshots.
- Redis revocation is checked by `jti` and user/session version on every request. Key `revoked:jti` expires at the token expiry; a user disable or password reset increments the user token version. If Redis is unavailable, protected requests fail closed.
- Staff accounts require MFA, phishing-resistant factors where supported, reauthentication for sensitive exports and an idle timeout. Login failures are rate limited and audited without storing passwords.

### 5.2 RBAC and object-level authorisation

RBAC is necessary but insufficient: every DPR, audit entry and profile access also requires ownership, assignment or explicit case scope. Deny by default and enforce checks in the service layer, not only in the UI.

| Capability | `applicant` | `dic_officer` | `sca_auditor` |
|---|---:|---:|---:|
| Manage own profile and submit own DPR | Create/read/update own | No | No |
| Read assigned applicant/DPR case | Own only | Assigned cases | Approved audit scope only |
| Run feasibility and view own result | Yes | Assigned case | No |
| Review/return DPR | No | Yes, assigned case | No |
| Approve financial/security-sensitive transition | No | Per workflow policy | Read-only evidence unless explicitly assigned |
| Read audit ledger | No | Case-scoped operational events | Yes, read-only, least-privilege scope |
| Manage users, roles, keys or retention | No | No | No; security administrator only |
| Export restricted data | Own permitted report | Approved assigned case | Approved, logged investigation only |

Every denied decision is audited with actor, resource, action, reason code and correlation ID, without sensitive payloads.

## 6. Data Protection and Cryptographic Vault (Layer 4)

### 6.1 Envelope encryption

Restricted fields use envelope encryption before persistence:

1. Obtain a versioned DEK from the KMS abstraction or generate it with a CSPRNG.
2. Encrypt the UTF-8 field using AES-256-GCM with a unique 96-bit nonce.
3. Use AAD containing `tenant_or_case_id`, table, column, record ID and key version. AAD is authenticated but not secret.
4. Store only ciphertext, nonce, encrypted DEK, KMS key ID/version, algorithm/version and encryption metadata. Never store plaintext or reusable nonces.
5. On read, authorise first, unwrap the DEK through KMS, verify the GCM tag and AAD, then decrypt in memory. Authentication failure is an error and must not return partial data.

Aadhaar, phone, financial fields, KYC responses and comparable identifiers are encrypted individually. Search uses a separate keyed blind index only where operationally necessary; never use plaintext equality indexes. Mask displays (for example, last four digits) and prohibit restricted values from logs, analytics, prompts and filenames.

### 6.2 KEK, DEK and KMS policy

The KMS/HSM holds KEKs, not bulk application data. Application processes receive a narrowly scoped unwrap operation, not a reusable KEK. Use separate keys for field data, audit export, backups and signing. Rotate KEKs at least annually and on compromise; rewrap DEKs without rewriting plaintext. Rotate DEKs when a record is changed or a compromise requires it. Maintain a key register with owner, purpose, version, activation/deactivation, rotation, access logs and destruction approval. Backups are encrypted and restore-tested.

### 6.3 PostgreSQL and RLS

- Use separate migration, application, read-only reporting and audit-writer database roles. The application role cannot alter schema, disable RLS or delete audit rows.
- Enable RLS on user, profile, DPR and restricted case tables. Set a transaction-local, server-validated context such as `app.user_id`, `app.role` and `app.case_ids`; reject requests without context.
- Policies must enforce applicant ownership and staff assignment. An example policy shape is:

```sql
ALTER TABLE dpr_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY dpr_case_scope ON dpr_records
  USING (
    applicant_id = current_setting('app.user_id', true)::uuid
    OR current_setting('app.role', true) IN ('dic_officer', 'sca_auditor')
  );
```

The production policy must additionally check assignment and action scope; role context cannot be accepted directly from a client. Test both positive and negative cases with separate database roles. Use parameterised SQL/SQLAlchemy, encrypted connections, statement timeouts and `search_path` hardening.

## 7. Tamper-Proof Audit Ledger (Layer 5)

### 7.1 Event policy

Audit authentication successes/failures, token revocation, role changes, access denials, DPR creation and state transitions, role-based reviews, exports, KYC access, key events, configuration changes, worker task outcomes and security alerts. Each event includes `event_id`, UTC timestamp, actor or anonymous marker, action, resource type/ID, endpoint, outcome, reason, request ID, source IP (subject to privacy policy), schema version and a redacted snapshot. Do not store passwords, bearer tokens, HMAC secrets, raw KYC documents or unnecessary PII.

### 7.2 Hash chain

For each append-only stream, order records by a database sequence and record:

```text
canonical = version || sequence || event_id || timestamp_utc || actor_id ||
            action || resource_id || outcome || canonical_json(redacted_payload) || previous_hash
current_hash = SHA256(canonical)
```

The first record uses a fixed, documented genesis value. Canonical JSON uses UTF-8, sorted keys, no insignificant whitespace and explicit null handling. Store `previous_hash` and `current_hash` as binary or fixed lowercase hex. The append transaction locks the stream head, verifies the expected previous hash, inserts the row and advances the head atomically. Concurrent writers must serialize; a missing or duplicate sequence is a security alert.

### 7.3 Verification and anti-deletion controls

A verifier recomputes every hash and checks sequence continuity, event ID uniqueness, timestamp ordering policy and that each `previous_hash` equals the preceding `current_hash`. It compares the current head with a separately stored signed checkpoint. Run verification daily and after restore; export signed checkpoints and events to an access-controlled WORM/SIEM destination. PostgreSQL triggers deny UPDATE/DELETE for the application and audit roles; only a break-glass migration role can alter ledger structure, and that access is separately logged. Hash chaining detects modification or deletion but cannot prevent a privileged database operator from rewriting both rows and head, which is why external checkpoints and WORM storage are mandatory.

The current prototype has audit middleware and a database delete-protection rule, but its audit model does not yet contain hash fields or an external checkpoint. Those are **Required** before claiming tamper-proof production compliance.

## 8. Sandboxed PDF and Background Worker Security (Layer 6)

### 8.1 Jinja2 and WeasyPrint

- Use a fixed, version-controlled template directory. Resolve templates from that directory only; never accept a user-controlled template path.
- Render user text as escaped text. If rich text is required, sanitize with `bleach` using an explicit allow-list such as `p`, `br`, `strong`, `em`, `ul`, `ol`, `li`; remove all style, script, event, iframe, form, SVG, object and embed content. Sanitize before persistence and again immediately before rendering.
- Do not interpolate user input into CSS, URLs, file paths, HTML attributes or template names. Encode output for its target context.
- Disable or intercept WeasyPrint fetchers. Permit only approved local assets under a read-only asset root, using canonical-path checks that reject traversal, symlinks, UNC paths, `file://`, `data:` where unnecessary and all non-HTTP schemes. Do not allow remote URL fetching by default. If a remote asset is necessary, use a separate allow-listed fetch service with DNS rebinding protection, private/link-local IP rejection, redirect limits, size/time limits and no credentials.
- Use a safe filename derived from an internal UUID, not a user field. Write to a private temporary directory, apply restrictive permissions, scan output, serve through an authorisation-checked endpoint and delete temporary files after the retention period.

### 8.2 Worker isolation

Run PDF, AI and external-integration workers as non-root containers with a read-only root filesystem, dropped Linux capabilities, no host mounts, seccomp/AppArmor profile, CPU/memory/time limits and isolated queues. PDF workers have no network egress; AI/geo workers have only named HTTPS egress through an allow-list and no access to the database beyond the minimum service account. Use separate broker credentials and queues for trust domains. Validate task signatures, task type, schema, actor/case scope, expiry and idempotency before execution. Do not put restricted data in queue metadata. A worker failure must not bypass workflow authorisation or expose a traceback to users.

## 9. Security Headers and Browser Policy

The ASGI/edge layer must send, at minimum:

```text
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cache-Control: no-store
```

Adjust CSP only for documented frontend assets and use nonces or hashes instead of `unsafe-inline`. Configure CORS to exact HTTPS origins, methods and headers; never use wildcard origins with credentials. Add `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy` where compatible. API errors are generic and correlation-ID based; debug tracebacks, SQL errors and secrets are never returned.

## 10. Secrets, Dependencies and Operations

Secrets come from a KMS, secret manager or Docker/Kubernetes secret, never source control, images, `.env` files committed to the repository, logs or command arguments. Rotate the current development/test credentials before any production use. The default `SECRET_KEY` must fail startup in production; production also requires `DEBUG=false`, non-wildcard CORS and non-public database/Redis bindings.

Pin and review dependencies, generate a lock/SBOM, run SCA and secret scanning in CI, verify container image provenance, use minimal base images and patch critical vulnerabilities under a documented SLA. Separate development, staging and production databases and keys. Backups are encrypted, access-controlled, immutable where possible and restore-tested quarterly. Monitor authentication anomalies, rate-limit spikes, RLS violations, ledger verification failures, queue abuse, SSRF blocks, key use and privileged access.

## 11. Incident Response

The incident commander preserves evidence, declares severity, records a timeline and assigns containment, communications and recovery owners. Initial actions are to revoke affected tokens/keys, isolate workers or integrations, preserve database/ledger/SIEM evidence, block indicators and protect affected accounts. Do not destroy logs during cleanup.

The privacy owner assesses personal-data impact and coordinates required notifications. The security owner evaluates CERT-In reporting obligations and applicable RBI/SEBI contractual or regulatory notifications using the current required timelines. Recovery requires clean images, rotated credentials, verified backups, ledger continuity verification and a post-incident corrective-action record. Run tabletop exercises at least annually and after major architecture changes.

## 12. Verification and Testing Protocol

### 12.1 Automated checks

Run from `backend/` in CI and before release:

```bash
ruff check .
pytest
```

The security test suite must include:

- expired, malformed, wrong-audience, wrong-issuer, wrong-algorithm and revoked JWTs;
- inactive users, every RBAC matrix denial, cross-user/case object access and RLS bypass attempts;
- token bucket atomicity, `429` responses, body/page limits and Redis failure fail-closed behaviour;
- HMAC canonicalisation, constant-time comparison, invalid key, altered body/path, stale timestamp, future timestamp and nonce replay;
- AES-GCM round trips, altered ciphertext/AAD/tag rejection, nonce uniqueness and key-version rotation;
- audit hash recomputation, altered payload detection, deleted-row/sequence detection, concurrent append serialization and checkpoint mismatch;
- Jinja escaping, sanitisation allow-list, traversal, symlink, `file://`, private-IP, redirect and oversized-resource PDF cases;
- security headers, exact CORS, no sensitive values in response bodies/logs/audit snapshots, dependency/image scanning and worker network policy.

Use property-based or fuzz tests for parsers and canonicalisation. Run DAST against a non-production environment with synthetic data. Test migrations both forward and from a production-like backup.

### 12.2 Manual evidence checks

**Ledger continuity:** export a bounded stream, recompute `current_hash` from the exact canonical representation, compare every link and sequence, then compare the head to the signed external checkpoint. Record verifier version, time, stream, result and evidence URI.

**HMAC signature:** independently construct the canonical string from the raw byte body, verify `SHA256(body)`, calculate HMAC with the key-register secret, compare in constant time, and confirm the nonce is accepted once and rejected on the second request. Test clock skew at `-120`, `+120`, and outside the boundary.

**Access control:** use one applicant, two cases, one DIC officer assigned to one case and one SCA auditor. Prove allowed access, cross-case denial, role denial and audit evidence for each decision. Run tests through the API and directly through RLS-enabled database sessions.

**Worker sandbox:** submit a synthetic template containing traversal, external URL, private IP, redirects, oversized content and malicious markup. Confirm no network request succeeds, no host file is read, the job is bounded, output is rejected or sanitised, and the failure is audited.

### 12.3 Release gates

A production release is blocked when a critical/high vulnerability is open without approved exception, any restricted field is plaintext, default credentials are active, revocation or RLS tests fail, ledger verification fails, worker isolation is unproven, backups cannot restore, or required security headers are absent. Exceptions require a business owner, security owner, compensating control, expiry date and tracked remediation.

## 13. Control Ownership and Change Management

Engineering owns implementation and tests; platform engineering owns TLS, network, containers, secrets and backups; the data/privacy owner owns inventory, retention and data-subject workflows; security owns threat modelling, monitoring, incident response and control evidence; product owners approve business-purpose access. Any change to authentication, cryptography, database schema, worker egress, templates, integrations or role permissions requires threat-model review, migration/rollback planning, focused security tests and updated evidence before release.

## Appendix A: Current Repository Gap Register

| Gap | Required action | Evidence of closure |
|---|---|---|
| Access tokens default to 24 hours and no active revocation check | Implement 15-minute tokens, Redis `jti`/version revocation and staff MFA | Automated lifecycle and outage tests |
| Audit rows lack hash-chain fields/checkpoints | Add canonical hash chain, serialized head and external WORM/checkpoint export | Daily verifier report and tamper test |
| RLS/envelope encryption are policy requirements, not yet demonstrated in the MVP | Implement migrations, KMS adapter and negative tests | Migration review, KMS audit and RLS test report |
| PDF fetcher and worker egress require hardening | Enforce custom fetcher, isolated worker profile and egress policy | Sandbox/SSRF test and container policy evidence |
| Production configuration has development-style defaults in settings/compose | Require environment validation, private service bindings, TLS and secret-manager integration | Startup failure tests and deployment review |
| DPR ownership checks are documented as a prototype limitation | Enforce case ownership/assignment in every read, write and render path | Cross-user API tests |

This register is part of the security policy and must be updated when a gap is closed or a new trust boundary is introduced.

## Appendix B: Implemented Layer Overlays

This document is the single cybersecurity document for the repository. Future security layers must add their implementation notes, file inventory, configuration, tests and known gaps here; do not create separate `cybersecurity_layerN.md` files.

### B.1 Layer 1: Edge and Gateway Security

Layer 1 is the active perimeter overlay providing request integrity, replay protection, Redis token-bucket rate limiting and defensive response headers.

- Mutating requests (`POST`, `PUT`, `PATCH`) require `X-Timestamp`, `X-Nonce` and `X-Signature`.
- The HMAC-SHA256 message is `METHOD + raw path + timestamp + nonce + body`.
- Timestamps outside the 120-second window and reused nonces are rejected.
- Redis policies are 30 requests/minute for public routes, 5 requests/minute for login routes, and 5 requests/minute for job/PDF creation routes.
- Responses receive CSP, `X-Frame-Options`, `X-Content-Type-Options`, HSTS and `Referrer-Policy` headers.
- Redis failures fail closed for replay and rate-limit decisions in production. Development/test mode allows the request to continue when only rate-limit storage is unavailable, so route-level authentication can return its normal `401`; replay protection remains fail closed.
- Docker activation: `app.main` registers `setup_layer1_security(app)`, and the Compose API service uses the internal `redis` hostname so nonce and rate-limit checks reach the Redis container. Production receives `SECRET_KEY` through the Docker secret; local Compose uses the development-only key from the override file.

Implementation files:

- `backend/app/core/security/layer1_hmac.py` - HMAC validation and nonce reservation.
- `backend/app/core/security/layer1_ratelimit.py` - Redis token bucket and route policies.
- `backend/app/core/security/layer1_headers.py` - defensive response headers.
- `backend/app/core/security/setup.py` - Layer 1 composition wrapper.

Layer 1 testing includes missing headers, stale timestamps, altered signatures/bodies, nonce reuse, `429` responses, Redis outage handling and security-header assertions. A PowerShell HMAC request example is included below.

### B.2 Layer 2: Identity and Authorisation

Layer 2 provides JWT lifecycle controls, fail-closed bearer validation, request identity context, role checks and DPR object-level scope checks.

New access tokens contain `sub`, `role`, `jti`, `token_version` and `exp`; generated expiry is capped at 30 minutes. Revoked identifiers are stored as `revoked:<jti>` in Redis until token expiry. Invalid, expired or revoked bearer tokens receive `401`; unavailable revocation storage receives `503`. Requests without bearer credentials remain available to public routes, while valid credentials populate `request.state.identity` with `user_id`, `role`, `jti` and `token_version`.

Use `RequireRole(["dic_officer", "sca_auditor"])` for staff-only dependencies. `verify_dpr_ownership` fails closed unless an applicant matches `owner_user_id` or staff matches the loaded case `assigned_user_id`.

Implementation files:

- `backend/app/core/security/layer2_jwt.py` - JWT decoding, revocation and TTL helpers.
- `backend/app/core/security/layer2_auth_middleware.py` - bearer validation and identity injection.
- `backend/app/core/security/layer2_rbac.py` - role and DPR scope guards.
- `backend/app/core/security/setup_layer2.py` - Layer 2 composition wrapper.

Existing integration files:

- `backend/app/main.py` - registers `setup_layer2_security(app)`.
- `backend/app/core/security.py` - adds lifecycle claims and caps token lifetime.

Layer 2 testing includes malformed, expired, tampered and revoked tokens, missing claims, Redis outage fail-closed behavior, role denials, cross-user DPR access and assignment checks.

### B.3 Layer 1 HMAC request example

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
curl.exe -i -X POST "http://localhost:8000$path" -H "X-Timestamp: $timestamp" -H "X-Nonce: $nonce" -H "X-Signature: $signature" --data "$body"
```

Without the three headers, the request receives `401`. Altering the signature receives `401`, reusing the nonce receives `409`, and exceeding a route policy receives `429` with `Retry-After`.
