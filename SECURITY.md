# Security Policy

## Supported Versions

UdyogSaarthi is currently a prototype under active development. Only the
latest commit on `main` receives security fixes; no older release lines are
maintained.

| Version      | Supported          |
| ------------ | ------------------ |
| `main` (latest) | :white_check_mark: |
| Older commits / forks | :x:           |

## Reporting a Vulnerability

**Do not open a public issue for a suspected vulnerability.** Instead, use
GitHub's [private vulnerability reporting](https://github.com/andy1924/UdyogSaarthi/security/advisories/new) on this
repository so details stay confidential until a fix is ready.

Please include, where possible:

* A description of the vulnerability and its potential impact
* Steps to reproduce (endpoints, payloads, configuration)
* The commit hash you tested against

We will review every report promptly, keep you informed as a fix is prepared,
and credit you in the fix notes if you wish.

## Scope Notes

* Scheme math is server-side by design (`Scheme rules v2024-11`); anything
  that lets a client alter a computed figure is treated as a vulnerability.
* `VITE_`-prefixed frontend variables compile into the public JS bundle, so a
  secret in frontend env is a finding, not a configuration choice. API keys
  belong server-side (see `backend/env.md`).
* The voice assistant runs speech models on-device; audio must never leave
  the browser (see `docs/frontend/voice-stack.md`, "Hard constraints").
* There is deliberately no production user data in this repository. Test
  fixtures only - never commit real credentials, Aadhaar numbers, or key
  material.