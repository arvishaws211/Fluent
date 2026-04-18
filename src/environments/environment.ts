// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
//
// DEFAULT (development) environment. Real keys are NOT committed here.
// Local developers create `environment.local.ts` (gitignored) overriding these
// values; CI/CD substitutes via `fileReplacements` defined in `angular.json`.
//
// Firebase web config is *technically* identifier-not-secret, but we still keep
// it out of source so we can rotate without a code change and so that App Check
// is the only thing standing between the public and our Gemini/Firestore quota.

export interface FluentEnvironment {
  production: boolean;
  emulators: boolean;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  googleMapsApiKey: string;
  googleMapsMapId: string;
  appCheckSiteKey: string;
  region: string;
}

export const environment: FluentEnvironment = {
  production: false,
  emulators: false,
  firebase: {
    apiKey: '__FIREBASE_API_KEY__',
    authDomain: '__FIREBASE_AUTH_DOMAIN__',
    projectId: '__FIREBASE_PROJECT_ID__',
    storageBucket: '__FIREBASE_STORAGE_BUCKET__',
    messagingSenderId: '__FIREBASE_SENDER_ID__',
    appId: '__FIREBASE_APP_ID__',
    measurementId: '__FIREBASE_MEASUREMENT_ID__',
  },
  googleMapsApiKey: '__GOOGLE_MAPS_API_KEY__',
  googleMapsMapId: '__GOOGLE_MAPS_MAP_ID__',
  appCheckSiteKey: '__APP_CHECK_SITE_KEY__',
  region: 'us-central1',
};
