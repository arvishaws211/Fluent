// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
//
// Template for `environment.local.ts` (gitignored, dev only) and the
// production replacement that build-time CI substitutes. Copy this file to:
//   - `environment.local.ts` for local dev
//   - `environment.prod.ts` for production builds (created by CI)
//
// Then fill values from Firebase Console -> Project Settings.
// NEVER commit either file. App Check enforcement still gates abuse.

import type { FluentEnvironment } from './environment';

export const environment: FluentEnvironment = {
  production: false,
  emulators: true,
  firebase: {
    apiKey: 'your-firebase-web-api-key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project',
    storageBucket: 'your-project.firebasestorage.app',
    messagingSenderId: '0000000000',
    appId: '1:0000000000:web:abc123',
    measurementId: 'G-XXXXXXX',
  },
  googleMapsApiKey: 'your-maps-key-with-http-referrer-restriction',
  googleMapsMapId: 'your-cloud-mapid-from-google-cloud-console',
  appCheckSiteKey: 'your-recaptcha-enterprise-site-key',
  region: 'us-central1',
};
