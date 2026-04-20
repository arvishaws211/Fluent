<!-- SPDX-License-Identifier: MIT -->
<!-- Copyright (c) 2026 Fluent Project Contributors -->

# Contributing to Fluent

Thanks for considering a contribution. Fluent is an accessibility-first,
security-first PWA for physical events. Every contribution is expected to hold
that bar — **no regressions on a11y, no secrets in source, no "temporary" hacks
to the security model**.

This document exists so you never have to guess what "done" means. Follow it
top-to-bottom and your PR will sail through review.

---

## 1. Code of conduct

Be kind, be specific, assume good intent, and keep discussions public wherever
possible. Harassment, discrimination, or personal attacks are not tolerated and
will result in a ban from the project. Report incidents privately via the
repo's GitHub **Security** tab or directly to a maintainer.

---

## 2. Before you start

1. **Search existing issues and discussions.** Most feature ideas have a prior
   thread; extending it is cheaper than forking the conversation.
2. **For non-trivial work, open an issue first.** State:
   - the problem (not the solution),
   - the affected actors (attendee / staff / sponsor),
   - any Google service you expect to touch.
     A maintainer will confirm scope before you invest implementation time.
3. **For security-sensitive findings, do not open a public issue.** Use the
   private advisory flow in the **Security** tab. See [`SECURITY.md`](./SECURITY.md).

---

## 3. Development setup

Follow the [README → First-time setup](./README.md#4-first-time-setup). Short
version:

```bash
npm install --legacy-peer-deps
npm --prefix functions install
cp .env.example .env            # fill in real values
npm start                       # or `npm run emulators` for offline dev
```

Never commit `.env` or anything under `src/environments/environment.local.ts`
or `environment.prod.ts` — they are gitignored for a reason. If you need to
share a configuration shape, update `.env.example` instead.

---

## 4. Branching and commits

| Work type     | Branch prefix | Example                             |
| ------------- | ------------- | ----------------------------------- |
| Feature       | `feat/`       | `feat/sensory-mode-heat-map`        |
| Bug fix       | `fix/`        | `fix/check-in-webauthn-fallback`    |
| Docs / README | `docs/`       | `docs/contributing-guide`           |
| Refactor      | `refactor/`   | `refactor/identity-signal-plumbing` |
| Test only     | `test/`       | `test/e2e-offline-journey`          |
| CI / tooling  | `chore/`      | `chore/upgrade-angular-21`          |
| Security      | `security/`   | `security/rotate-maps-key`          |

Use **Conventional Commits** for every commit message:

```
feat(matchmaking): cache Gemini reasoning in Firestore per uid
fix(check-in): surface fallback when PublicKeyCredential is undefined
docs(readme): document Cloud Run deploy path
```

The type must be one of `feat`, `fix`, `docs`, `refactor`, `test`, `chore`,
`perf`, `security`, `build`, `ci`. A scope is strongly encouraged.

Keep commits **atomic** — one logical change each. Squash merge is the default
on `main`, so your PR title becomes the squashed commit subject; make it
descriptive.

---

## 5. What every PR must pass

Your PR will be rejected by CI if any of these fail. Run them locally first —
it's faster than a round-trip through GitHub Actions.

| Gate                                     | Command                                             | Enforced by                                  |
| ---------------------------------------- | --------------------------------------------------- | -------------------------------------------- |
| ESLint with **zero warnings**            | `npm run lint`                                      | `.github/workflows/ci.yml` → `quality-gates` |
| Prettier formatting                      | `npm run format:check`                              | `.github/workflows/ci.yml` → `quality-gates` |
| Stylelint (property order + standard)    | `npm run stylelint`                                 | `.github/workflows/ci.yml` → `quality-gates` |
| TypeScript (`tsc --noEmit`)              | `npm run typecheck`                                 | `.github/workflows/ci.yml` → `lint-build`    |
| Production build (app + Functions)       | `npm run build && npm --prefix functions run build` | `.github/workflows/ci.yml` → `lint-build`    |
| Vitest unit + integration suite          | `npm test`                                          | `.github/workflows/ci.yml` → `unit-tests`    |
| Playwright E2E (Chromium + WebKit)       | `npm run test:e2e`                                  | `.github/workflows/ci.yml` → `e2e-tests`     |
| **Zero serious/critical axe violations** | built into `e2e/smoke.spec.ts`                      | `.github/workflows/ci.yml` → `e2e-tests`     |

A `.husky/pre-commit` hook runs `lint-staged` (eslint --fix, stylelint --fix,
prettier --write) on every staged file — **do not bypass it with `--no-verify`**.

---

## 6. Code style

### TypeScript / Angular

- **Angular 21 idioms** — standalone components, Signals, zoneless change
  detection, the new control-flow syntax (`@if` / `@for` / `@switch`). Do not
  reintroduce `*ngIf` / `*ngFor`.
- **Injection** via `inject()`, not constructor injection, unless you need the
  constructor for a specific reason.
- **No `any`.** `@typescript-eslint/no-explicit-any` is `error`. If you truly
  need an escape hatch, justify it in a comment and gate it with a narrower
  `unknown` + type guard.
- **Type-only imports** — prefer `import type { Foo }` for types; the linter
  warns otherwise.
- **No inline dynamic `import()`** inside component classes — they break the
  build's module boundary analysis. See the `no-inline-imports` workspace rule.
- **Exhaustive switches** — use `satisfies never` in the default branch so
  adding a variant breaks compilation instead of silently falling through.

### Components

- Selectors use the `app-` prefix (kebab-case for elements, camelCase for
  attribute directives). Enforced by `@angular-eslint/component-selector` and
  `@angular-eslint/directive-selector`.
- Templates live inside the component file unless they exceed ~200 lines.
- Every interactive element is `<a>` or `<button>` — never a `<div>` with a
  `routerLink`.

### CSS

- Use the design tokens in `src/styles.css` (`--primary`, `--accent`,
  `--glass-bg`, `--radius-md`, etc.). Do not hard-code colours or radii.
- `stylelint-order` enforces property ordering; `stylelint --fix` will sort
  for you.

### File headers

Every new `.ts`, `.js`, `.mjs`, `.html`, `.md`, `.css`, and `.yml` file starts
with:

```ts
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
```

Adjust the comment syntax to the file type.

---

## 7. Testing requirements

New code without tests will not be merged. Aim for the same coverage shape as
the existing codebase:

- **Service layer** — Vitest unit tests with Firebase SDK mocked at the module
  boundary. See `src/app/core/services/*.spec.ts` for patterns.
- **Components** — Vitest + Angular TestBed for logic; Playwright for the end
  user journey.
- **Firestore rules** — any rule change must ship with a test under
  `firebase emulators:exec --only firestore "npm test"`.
- **Accessibility** — any new user-visible surface adds a line to
  `e2e/smoke.spec.ts` or an equivalent spec that runs axe-core and asserts
  zero serious/critical violations.
- **Offline / degraded paths** — if your feature touches the critical
  `/check-in → /wayfinding` journey, exercise the offline + WebAuthn-missing
  variants in `e2e/check-in-to-wayfinding.spec.ts`.

---

## 8. Security checklist

Before you request review, confirm:

- [ ] No new secret lands in `git` — keys live only in `.env` or CI secrets.
- [ ] No new Firebase product is reachable without App Check.
- [ ] Any new Firestore collection has an explicit rule block **above** the
      default-deny in `firestore.rules`, plus tests.
- [ ] Vertex AI or any other paid API is only called from Cloud Functions,
      never the browser.
- [ ] Any new callable enforces auth via the pattern in `functions/src/ai-proxy.ts`.
- [ ] New environment variables are added to `.env.example` with a comment
      explaining where to source the value.

If you touch IAM, App Check enforcement, or Firestore rules in a way a reviewer
can't verify by running tests, document the required console steps in
[`SECURITY.md`](./SECURITY.md).

---

## 9. Accessibility checklist

Fluent ships to attendees who rely on screen readers, keyboard-only
navigation, and quiet routes. Every UI PR must confirm:

- [ ] Keyboard reachable end-to-end (Tab, Shift+Tab, Enter, Esc).
- [ ] Focus outlines are visible; never `outline: none` without a replacement.
- [ ] Colour contrast ≥ AA against `#0a0a0c`.
- [ ] All decorative SVGs carry `aria-hidden="true"` and `focusable="false"`.
- [ ] Live regions (`aria-live="polite"` / `role="status"`) wrap anything that
      updates asynchronously.
- [ ] `@axe-core/playwright` passes with zero serious or critical violations.

---

## 10. Pull request template

Open your PR with this structure:

```markdown
## Summary

<1–3 sentences: what changed, for which actor, which Google service.>

## Why

<The problem or rubric item. Link the issue.>

## Screenshots / recordings

<Before / after for any UI change. Mobile viewport encouraged.>

## Testing

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run test:e2e`
- [ ] Manual: <route(s) exercised, browser(s)>

## Security & a11y

- [ ] No new secrets in source; `.env.example` updated if needed.
- [ ] Firestore rules + App Check posture preserved.
- [ ] Axe-core: zero serious/critical violations.
```

---

## 11. Review SLA

- **Draft PRs** are auto-ignored; mark your PR **Ready for review** when you
  want eyes on it.
- A maintainer will respond within **two business days** with either an
  approval, a changes request, or a clarifying question.
- If CI is red, the clock resets — fix CI first.

---

## 12. Licensing of contributions

By opening a pull request, you agree that your contribution is licensed under
the MIT license that covers the rest of the repository (see [`LICENSE`](./LICENSE))
and that you have the right to submit it. Do not copy code from sources with
incompatible licenses (GPL, proprietary, or licence-unknown scrapes). If you
use a snippet from Stack Overflow or a blog post, attribute it in a code
comment and confirm the snippet is under an MIT-compatible license.

---

## 13. Getting help

- **Setup or build issues** — open a Discussion on the repo.
- **Behavioural bugs** — open an Issue with reproduction steps, browser, and
  a console log.
- **Security concerns** — private advisory only (see `SECURITY.md`).

Welcome aboard.
