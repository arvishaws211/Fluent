// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';
import { environment } from './environments/environment';
import { reportEnvironment } from './app/core/utils/env-validator';
import { renderSetupScreen } from './app/core/utils/setup-screen';

// Validate config FIRST so the developer sees precise remediation text
// before any Firebase SDK throws its generic `auth/api-error`.
const envCheck = reportEnvironment(environment);

if (!envCheck.hasAuth) {
  // Firebase `initializeApp` throws synchronously when `apiKey` is empty or
  // invalid (auth/invalid-api-key), which kills Angular bootstrap and leaves
  // the page blank. Render a developer-facing setup screen instead so the
  // failure is actionable without opening DevTools.
  renderSetupScreen(envCheck);
} else {
  bootstrapApplication(AppComponent, appConfig).catch((err: unknown) => {
    console.error('[bootstrap] application failed to start', err);
  });
}
