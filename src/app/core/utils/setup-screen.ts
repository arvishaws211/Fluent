// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
//
// Renders a developer-facing "setup required" screen directly into the DOM
// without booting Angular or Firebase. Used when `validateEnvironment`
// determines the Firebase apiKey is a placeholder — in that state,
// `initializeApp` throws `auth/invalid-api-key` synchronously and kills
// bootstrap, leaving a blank page. Showing this page keeps the failure
// debuggable without having to open DevTools.

import type { EnvValidationResult } from './env-validator';

const STYLE = `
:root { color-scheme: light dark; }
body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  background: #0b1220;
  color: #e6edf7;
  min-height: 100vh;
}
.setup {
  max-width: 860px;
  margin: 0 auto;
  padding: 48px 24px 96px;
}
.setup h1 {
  font-size: 1.75rem;
  margin: 0 0 0.25em;
}
.setup .lede {
  color: #93a2c1;
  margin: 0 0 2em;
}
.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  background: #f59e0b33;
  color: #fbbf24;
  border: 1px solid #f59e0b55;
}
.card {
  background: #121a2c;
  border: 1px solid #223055;
  border-radius: 14px;
  padding: 24px 28px;
  margin-bottom: 20px;
}
.card h2 {
  margin: 0 0 12px;
  font-size: 1.05rem;
}
.card ul {
  margin: 0;
  padding-left: 20px;
}
.card li {
  margin: 6px 0;
  line-height: 1.55;
}
.card code {
  background: #0b1220;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.88em;
  border: 1px solid #223055;
}
.steps {
  counter-reset: step;
  padding: 0;
  list-style: none;
  margin: 0;
}
.steps li {
  counter-increment: step;
  padding-left: 38px;
  position: relative;
  margin: 10px 0;
  line-height: 1.55;
}
.steps li::before {
  content: counter(step);
  position: absolute;
  left: 0;
  top: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #2563eb;
  color: white;
  display: grid;
  place-items: center;
  font-size: 0.85rem;
  font-weight: 700;
}
.kbd {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  background: #0b1220;
  padding: 8px 12px;
  border-radius: 6px;
  display: inline-block;
  border: 1px solid #223055;
  font-size: 0.88rem;
}
.muted { color: #93a2c1; font-size: 0.88rem; }
a { color: #60a5fa; }
`;

function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderSetupScreen(result: EnvValidationResult): void {
  const root = document.querySelector('app-root') ?? document.body;
  const problems = result.problems.map((p) => `<li>${escape(p)}</li>`).join('');

  const status = [
    `<span class="badge">Firebase ${result.hasAuth ? 'OK' : 'not configured'}</span>`,
    `<span class="badge">App Check ${result.hasAppCheck ? 'OK' : 'not configured'}</span>`,
    `<span class="badge">Maps ${result.hasMaps ? 'OK' : 'not configured'}</span>`,
  ].join(' ');

  root.innerHTML = `
    <style>${STYLE}</style>
    <main class="setup" role="main">
      <h1>Fluent setup required</h1>
      <p class="lede">
        The app cannot start because one or more required credentials are missing
        or still contain build-time placeholders. This screen is shown in place of
        a crash to help you fix the environment without reading a stack trace.
      </p>
      <p>${status}</p>

      <section class="card" aria-labelledby="what-missing">
        <h2 id="what-missing">What's missing</h2>
        <ul>${problems}</ul>
      </section>

      <section class="card" aria-labelledby="how-to-fix">
        <h2 id="how-to-fix">How to fix</h2>
        <ol class="steps">
          <li>Copy the example file to create a local env:
            <div class="kbd">cp .env.example .env</div>
          </li>
          <li>Open <code>.env</code> and fill in the values from the URLs listed in the comments.
              Most common mistake: using a Firebase key from a different project than the <code>FIREBASE_PROJECT_ID</code>.</li>
          <li>Rebuild so the env generator produces fresh environment files:
            <div class="kbd">npm run build</div>
          </li>
          <li>Reload this page. If anything is still wrong, the list above will update with the remaining problems.</li>
        </ol>
      </section>

      <section class="card">
        <h2>Need the exact console URLs?</h2>
        <ul>
          <li>Firebase web config &mdash;
            <a target="_blank" rel="noopener" href="https://console.firebase.google.com/">Firebase Console</a>
            &rarr; your project &rarr; Project settings &rarr; General &rarr; Your apps &rarr; SDK setup &amp; configuration.
          </li>
          <li>Maps API key &mdash;
            <a target="_blank" rel="noopener" href="https://console.cloud.google.com/google/maps-apis/credentials">Google Cloud Console &rarr; Maps credentials</a>.
            Restrict to HTTP referrers <em>before</em> shipping.
          </li>
          <li>Maps Map ID &mdash;
            <a target="_blank" rel="noopener" href="https://console.cloud.google.com/google/maps-apis/studio/maps">Maps Studio &rarr; Map Styles</a>.
          </li>
          <li>App Check site key &mdash;
            <a target="_blank" rel="noopener" href="https://console.cloud.google.com/security/recaptcha">reCAPTCHA Enterprise</a>
            &rarr; create a Website key &rarr; register it in
            <a target="_blank" rel="noopener" href="https://console.firebase.google.com/">Firebase Console &rarr; App Check</a>.
          </li>
        </ul>
        <p class="muted">
          This screen is only visible in builds that haven't been configured.
          Once <code>.env</code> is populated and <code>npm run build</code> is rerun, the normal application mounts here.
        </p>
      </section>
    </main>
  `;
  document.title = 'Fluent — setup required';
}
