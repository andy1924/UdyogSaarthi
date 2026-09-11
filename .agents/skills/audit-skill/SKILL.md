---
name: audit-skill
description: Use when the user wants to visually audit a website by clicking elements and pinning comments, or says audit the site, annotate the UI, leave feedback on divs, or review pages and send notes back.
---

# audit-skill

The agent gives the user a wrapper link. The target site opens inside a
viewport framed by the audit bar — the user clicks elements, writes notes,
and pastes them back as structured JSON via Copy.
No console snippets, no bookmarklets, no injection.

## How it works

- `GET /audit?url=<site>` serves `public/wrapper.html`: the site loads in
  an `<iframe>` viewport next to a black-and-white audit bar.
- The iframe loads through a same-origin proxy (`/p/<target>/<path>`) on
  the collector. The proxy strips `X-Frame-Options` / `CSP` so any site can
  be framed, and injects `<base>` so relative links stay inside the proxy.
  Same origin lets the wrapper pick elements directly.
- `server.js` (zero dependencies) serves wrapper + proxy and stores notes
  in `audit-notes.json`.

## Agent workflow

1. **Get the target URL.** If the user didn't give one, ask. Local dev
   (`http://localhost:3000`) or any public URL both work.

2. **Start the collector** (default port 4317). Run in background:
   ```bash
   cd <this-skill-dir> && node server.js 4317
   ```

3. **Start it and give the user the link.** Reply with this clickable link
   (URL-encoded target) plus what-to-do instructions — never leave the
   user guessing what is open or what to do next:
   ```
   http://localhost:4317/audit?url=<encodeURIComponent target>
   ```
   Tell them: hit the crosshair (**Mark**), click anything in the viewport,
   write the note, Add. Repeat on every page — navigate inside the
   viewport (URL bar up top for jumps). Hit **Copy** in the pill when done
   and paste the JSON back here.

4. **Collect.** The user pastes the Copy-button JSON back into chat —
   apply each note to code —
   one note = one change. Confirm per note.

5. **Reset.** `DELETE http://localhost:4317/api/notes` for a fresh round.

## Copy format (human-review inspired)

Copy produces one batch grouped by page. Find each comment by `quote` +
`anchor` (rendered text — `prefix`/`suffix` disambiguate repeats).
`component`/`section` say where it lives; `selector` is a fallback locator.

```json
{
  "status": "feedback",
  "pages": [
    {
      "url": "http://localhost:3000/pricing",
      "path": "/pricing",
      "pageTitle": "UdyogSaarthi — Pricing",
      "comments": [
        {
          "id": "n_m3k2x1_a1b2c3",
          "kind": "element",
          "quote": "Start free trial",
          "anchor": { "prefix": "…text just before…", "quote": "Start free trial", "suffix": "…text just after…" },
          "feedback": "Button touches card edge on mobile 360px",
          "component": "Navbar",
          "section": "header > nav \"Main navigation\"",
          "selector": "main > div:nth-of-type(2) > button.cta"
        }
      ]
    }
  ]
}
```

## Rules

- Never guess selectors or element text — every fix must trace to a note's
  `selector` + `url`.
- If a selector no longer matches, ask the user for a fresh note instead
  of inferring.
- Nothing is committed to the audited repo — the wrapper and proxy live
  entirely in this skill dir.

## Troubleshooting

- **Blank viewport**: the target server isn't running — start it first.
- **"Navigated outside the audit proxy" banner**: an absolute link broke
  out of the iframe — paste that page's URL into the wrapper URL bar.
- **Login-walled pages**: the proxy doesn't carry the target's cookies —
  audit public pages, or paste Copy-JSON output back manually.
- **Copy fails**: notes persist in the wrapper's localStorage
  (`__audit_notes_v1`) — reopening the same link recovers them.
