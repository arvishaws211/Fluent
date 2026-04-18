<!-- SPDX-License-Identifier: MIT -->
<!-- Copyright (c) 2026 Fluent Project Contributors -->

# Fluent — End-to-End Event Management PWA

Fluent is a Progressive Web App that removes friction from large-scale physical
events. It pairs Angular 21 (Signals, zoneless change detection) with the
Google Cloud + Firebase stack to deliver biometric check-in, AI matchmaking,
real-time staff coordination, and accessibility-first wayfinding.

> Built to score high against the **testing coverage**, **Google service
> adoption**, and **accessibility maturity** rubric in the Fluent Engineering
> evaluation.

---

## 1. Architecture at a glance

```
┌──────────────────────────────────────────────────────────────────────┐
│  Angular 21 PWA  (Signals · zoneless · service worker)               │
│  ├── core/services   ─ Auth, Identity, CheckIn, Matchmaking,         │
│  │                     Wayfinding, AI proxy, StaffRunbook            │
│  ├── features/*      ─ Dashboard, CheckIn, Wayfinding, Matchmaking,  │
│  │                     Runbook, Auth (login/register/forgot)         │
│  └── core/guards     ─ authGuard                                     │
└──────────────────────────────────────────────────────────────────────┘
           │                                      │
   App Check (reCAPTCHA Enterprise)        Service worker (ngsw)
           │                                      │
           ▼                                      ▼
┌─────────────────────────────┐      ┌─────────────────────────────────┐
│  Firebase (multi-tenant)    │      │  Cloud Run / Hosting (PWA)      │
│  • Auth                     │      │  • Static HTTPS hosting         │
│  • Firestore + rules        │      │  • Offline.html fallback        │
│  • Cloud Functions v2       │◀────▶│  • Cached "/check-in" journey   │
│    └─ aiMatchReasoning      │      │                                 │
│    └─ aiSensoryAdvice       │      └─────────────────────────────────┘
│    └─ aiBatchMatchmaking    │
│    └─ onAttendeeCreate      │      ┌─────────────────────────────────┐
│    └─ setRoleClaim          │      │  Vertex AI (Gemini 1.5 Flash)   │
└─────────────────────────────┘──────│  invoked exclusively via Funcs  │
                                     │  → API key never reaches client │
                                     └─────────────────────────────────┘
```

### Why this shape

| Concern               | Decision                                          | Why it matters                                                                                           |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Secrets**           | Build-time substitution from `.env`               | The Gemini API key never lands in `git`, the bundle, or browser memory.                                  |
| **AI safety**         | Cloud Functions proxy + App Check                 | Throttling, auth, and cost control happen before the LLM is called.                                      |
| **Real-time data**    | Firestore + `collectionData → toSignal`           | Multi-device convergence with sub-second latency for the staff runbook.                                  |
| **Identity**          | `IdentityService` = Auth ⊕ Firestore profile      | One signal feeds every component; profile is created server-side via `beforeUserCreated` trigger.        |
| **Authorization**     | Firestore rules + custom claims (`staff/sponsor`) | Backend, not client, decides who reads `runbook` or writes `attendees`.                                  |
| **PWA**               | `@angular/service-worker` + `ngsw-config.json`    | Critical journey (`/check-in → /wayfinding`) keeps working under flaky connectivity.                     |
| **A11y**              | Semantic HTML, skip-link, ARIA, no decorative emojis in the a11y tree | Validated by `@axe-core/playwright` in CI.                                            |

---

## 2. Prerequisites

| Tool                | Version           | Why                                            |
| ------------------- | ----------------- | ---------------------------------------------- |
| **Node.js**         | 22.x LTS          | Matches the Cloud Functions and Vitest runtime |
| **npm**             | ≥ 11              | Locked via `packageManager`                    |
| Firebase CLI        | latest            | `firebase emulators:start`, deploys            |
| gcloud CLI          | latest            | `npm run deploy:run` to Cloud Run              |
| (Windows users)     | Git Bash / PS 7   | All scripts are cross-platform                 |

> **Heads up — npm is not bundled with the Cursor-internal Node binary.**
> Install Node.js system-wide from <https://nodejs.org> before running any
> build/test command.

---

## 3. First-time setup

```bash
# 1. Clone & install
git clone <repo>
cd Fluent
npm install --legacy-peer-deps           # @angular/fire 20 + Angular 21 peer ranges
npm --prefix functions install            # Cloud Functions deps

# 2. Wire your secrets
cp .env.example .env
#   ↑ then edit .env and paste your Firebase + Maps + App Check keys

# 3. Materialize Angular environment files (auto-runs on every build)
node scripts/setup-env.mjs

# 4. (Optional) start the Firebase emulator suite
npx firebase emulators:start

# 5. Serve the app
npm start
```

`scripts/setup-env.mjs` generates `src/environments/environment.local.ts` and
`environment.prod.ts` from your `.env` — both files are gitignored. See
[`SECURITY.md`](./SECURITY.md) for the full secret-handling policy.

---

## 4. Running it

| Command                     | What it does                                                        |
| --------------------------- | ------------------------------------------------------------------- |
| `npm start`                 | Dev server with development environment + emulator-friendly config  |
| `npm run build`             | Production build (PWA, hashed assets, replaces env file)            |
| `npm test`                  | Vitest unit + integration suite                                     |
| `npm run test:e2e`          | Playwright E2E (Chromium + Mobile Safari)                           |
| `npm run lint`              | `tsc --noEmit` typecheck — no warnings tolerated                    |
| `npm run functions:build`   | TypeScript compile of Cloud Functions                               |
| `npm run functions:deploy`  | Deploy callable + auth-trigger functions                            |
| `npm run deploy:hosting`    | Push the SPA + service worker to Firebase Hosting                   |
| `npm run deploy:run`        | Containerize & ship to Cloud Run                                    |
| `npm run emulators`         | Boot the Firebase Emulator Suite (Auth, Firestore, Functions)       |

---

## 5. Testing strategy

### Unit + integration (Vitest)

Run with `npm test`. Coverage targets the parts most likely to break in
production:

| Area                         | File                                                        |
| ---------------------------- | ----------------------------------------------------------- |
| Auth flow                    | `src/app/core/services/auth.service.spec.ts`                |
| Identity (Auth ⊕ Firestore)  | `src/app/core/services/identity.service.spec.ts`            |
| Matchmaking + AI proxy       | `src/app/core/services/matchmaking.service.spec.ts`         |
| Real-time runbook            | `src/app/core/services/staff-runbook.service.spec.ts`       |
| Check-in (WebAuthn + QR)     | `src/app/core/services/check-in.service.spec.ts`            |
| Wayfinding map + AI          | `src/app/features/wayfinding/wayfinding.component.spec.ts`  |
| Validators / error mapping   | `src/app/core/utils/validators.spec.ts`                     |
| Route guard                  | `src/app/core/guards/auth.guard.spec.ts`                    |
| App shell (a11y, logout)     | `src/app/app.spec.ts`                                       |
| Login / Register / Forgot pw | `src/app/features/auth/**/*.spec.ts`                        |
| Dashboard                    | `src/app/features/dashboard/dashboard.component.spec.ts`    |

### End-to-end (Playwright + axe-core)

Run with `npm run test:e2e`. Covers the explicit edge cases called out in the
prompt:

* `e2e/smoke.spec.ts` — landing + login render correctly, **zero serious
  axe violations**, skip-link reachable.
* `e2e/check-in-to-wayfinding.spec.ts` — the critical journey **plus**:
  * **WebAuthn unavailable** — `PublicKeyCredential` is mocked away → app
    must surface the QR/manual fallback rather than crash.
  * **Lost connectivity** — `page.context().setOffline(true)` mid-flow →
    service worker must serve `/offline.html`, no white screen.

### CI

`.github/workflows/ci.yml` runs lint → build → unit → e2e on every PR. The
Playwright HTML report is uploaded as an artifact for triage.

---

## 6. Security & privacy

The full security posture is documented in [`SECURITY.md`](./SECURITY.md).
Highlights:

1. **No secrets in source** — keys live in `.env` (gitignored) or CI vars.
2. **App Check + reCAPTCHA Enterprise** gate every Firebase product.
3. **Firestore rules** default-deny; `runbook` is restricted to `staff` /
   `sponsor` custom claims; `checkIns` rows must match `auth.uid`.
4. **Vertex AI key** lives only in Cloud Functions — never on the client.
5. **SSI handshake** — `IdentityService.generateVerifiablePresentation()`
   produces a uid-bound, nonce-bound token to gate sensitive flows. The
   roadmap (in `SECURITY.md`) tracks the upgrade to a fully-signed JWT VP.

---

## 7. Accessibility checklist

| Area                | Implementation                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Skip link           | `app.ts` — visible on focus, jumps to `#main-content`                                    |
| Landmark roles      | `<nav aria-label="Primary">`, `<main>`, `<aside>`, `<footer>`                            |
| ARIA live regions   | Check-in status, AI advice, matchmaking errors, runbook sync indicator                   |
| Keyboard navigation | All interactive surfaces are `<a>`/`<button>`, never `<div>` with `routerLink`            |
| Decorative imagery  | All inline SVG icons use `aria-hidden="true"` and `focusable="false"`                    |
| Sensory mode        | IoT noise data drives quiet-route highlighting and POI hiding on the Google Map          |
| Color contrast      | Indigo / pink / emerald palette sourced from Tailwind ≥ AA contrast against `#0a0a0c`    |
| Automated tests     | `@axe-core/playwright` blocks PRs on serious or critical violations                      |

---

## 8. Project layout

```
Fluent/
├── src/                         # Angular 21 app
│   ├── app/
│   │   ├── core/                # services, guards, utils (logger, validators)
│   │   └── features/            # dashboard / check-in / wayfinding / matchmaking / runbook / auth
│   ├── environments/            # environment.ts (placeholders) + .example
│   └── styles.css               # design tokens
├── functions/                   # Cloud Functions v2 (TS)
│   └── src/
│       ├── ai-proxy.ts          # Vertex AI proxy (callable)
│       └── attendee-lifecycle.ts# beforeUserCreated trigger + setRoleClaim
├── public/                      # PWA assets (manifest, icon, offline.html)
├── e2e/                         # Playwright suites + fixtures
├── scripts/setup-env.mjs        # .env → environment.{local,prod}.ts
├── firestore.rules              # default-deny security rules
├── firestore.indexes.json       # composite indexes for runbook
├── firebase.json                # hosting / functions / emulator config
├── ngsw-config.json             # service worker caching strategy
├── playwright.config.ts         # E2E config (Chromium + Mobile Safari)
├── .github/workflows/ci.yml     # lint → build → unit → e2e
├── SECURITY.md                  # secret-handling policy + console runbook
└── LICENSE                      # MIT
```

---

## 9. License

MIT — see [`LICENSE`](./LICENSE).

> Built for the future of physical events.
