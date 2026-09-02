# UdyogSaarthi: Frontend Requirements & Design Specification

This document provides a comprehensive guide for frontend developers building the UdyogSaarthi client application. It maps the backend API capabilities to required frontend user flows and establishes strict design principles tailored for rural, low-literacy users.

---

## 1. Target Audience & Core Philosophy
The primary user is a **first-time rural micro-entrepreneur** (18–35 years old). They possess low financial and digital literacy, operate low-end Android devices with spotty internet connectivity, and speak regional vernaculars. 

Your goal is not to build a standard "fintech SaaS dashboard." You are building a **Sarkaar Ledger / Human Saarthi (Companion)**. 
- **Voice-first & Vernacular:** Text should be minimal and readable, with voice note capture available as a primary input mechanism.
- **Deterministic Trust:** Visual design must evoke government-grade trust (India Post ledger, District Gazette).

---

## 2. Design Principles & Aesthetics (From `DESIGN.md`)

To create an accessible and highly trusted UI for rural users, adhere to the following design system:

### A. The "Receipt Slip" Grammar
- The interface should look like physical, tactile receipt slips. 
- **Cards:** White (`#FFFCF6`), 14px radius, dashed ledger borders, with a subtle drop shadow (`0 6px 24px rgba(15,42,68,0.08)`).
- **Perforations:** Cards should feel like tear-off slips using dashed top/bottom borders.
- **Stamps:** Success/Rejection verdicts should look like physical vermilion/sindoor rubber stamps (scaling in with an animation).

### B. Color Palette
Never use generic hex codes or Tailwind defaults. Stick strictly to the following tokens:
- **Ink (`#0F2A44`):** Primary text, headers, main buttons.
- **Vermilion (`#C73D2E`):** Call-to-actions, stamps, errors, focus rings.
- **Wheat (`#E8C36A`):** Text on ink buttons, highlights, warmth.
- **Paper (`#FFFCF6`):** App background, card footers.
- **Ledger (`#E6E8EC`):** Borders, perforations, disabled states.
- **Success (`#0F6B4A`) & Warn (`#9A6A00`):** AA-verified statuses, saturated area warnings.

### C. Typography & Accessibility
- **Serif (Tiro Devanagari Hindi):** For headings, stamps, and vernacular translations.
- **Sans (Inter):** For labels and standard UI.
- **Mono (Fragment Mono):** ALWAYS use monospace fonts for numbers, loan calculations, LGD codes, and scheme rules to simulate a typewriter ledger.
- **Tap Targets:** Minimum tap area for all buttons, inputs, and sliders MUST be **44px** (fat-finger friendly).

---

## 3. Required Functionalities & API Mapping

The frontend must provide a smooth, linear workflow: **Locate → Feasibility → Finance → Compliance → DPR**. 

### A. Location & Feasibility (The "Shield")
*Prevent users from making bad investments in saturated markets.*
- **Action:** Ask the user for their business category (e.g., Dairy) and location. Request GPS permissions (`lat`/`lon`) or allow manual text entry.
- **API Call:** `POST /api/feasibility/score`
- **UI State:**
  - Display the exact LGD (Local Government Directory) block to build trust.
  - Render the `verdict` (Saturated, Viable, Niche-Gap) as a large, highly visible "Stamp".
  - Simplify the SWOT analysis into actionable bullet points (or text-to-speech readable blocks).
- **Error Handling:** If the API returns a `502 Bad Gateway` (meaning authoritative government geo-data failed to resolve), degrade gracefully. Inform the user and allow them to retry or manually verify their location.

### B. Scheme Math & Finance Calculation
*Deterministic math with zero hidden fees.*
- **Action:** Allow the user to input their available "Margin Money" (using a slider or large numpad input). 
- **API Call:** `POST /api/scheme/calculate`
- **UI State:**
  - Display the `max_loan_capped` and `tpc` (Total Project Cost) in large Mono typography.
  - Show the EQI (Equated Quarterly Installment) clearly so they know exactly what they will owe.
  - Render the scheme rule footnote (e.g., `Scheme rules v2024.11 · 6.5% MF`) in a pill at the bottom of the card to establish auditability. Do NOT recalculate math on the client.

### C. Compliance & Licensing Checklist
- **API Call:** `GET /api/compliance/licenses?business_category={category}`
- **UI State:** Render a simple, interactive checklist of required licenses (e.g., Udyam, FSSAI). Use simple vernacular text. 

### D. Peer Directory
- **API Call:** `GET /api/directory/nearby`
- **UI State:** Show a visual or list-based map of peer businesses nearby to ground the feasibility score in reality.

### E. DPR (Detailed Project Report) Generation
*The final, high-value output.*
- **Action:** Collect all previously gathered data (applicant name, feasibility score, scheme math, CAPEX estimates) and submit.
- **API Call:** `POST /api/dpr/render`
- **UI State:** Show a physical "printing" or "processing" loading animation. Once ready, provide a massive, unmissable button to download the PDF using the returned `pdf_url`. 

---

## 4. Offline & PWA Requirements

Because rural internet is intermittent, the frontend must be resilient:
1. **Progressive Web App (PWA):** Must be installable on Android (`manifest.json` configured with `standalone` display).
2. **Local-First Queue:** Use **IndexedDB** (e.g., Dexie) to save form progress. If the user loses internet before generating the DPR, save the state locally and show an offline fallback page (`/offline`).
3. **Resumability:** When connectivity is restored, background sync should allow the user to pick up exactly where they left off and submit the DPR generation request.
