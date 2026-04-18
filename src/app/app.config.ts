// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { isDevMode, type ApplicationConfig } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { getFunctions, provideFunctions, connectFunctionsEmulator } from '@angular/fire/functions';
import {
  initializeAppCheck,
  provideAppCheck,
  ReCaptchaEnterpriseProvider,
} from '@angular/fire/app-check';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

/**
 * App configuration wires the providers so each Firebase product can be
 * injected anywhere via `inject()`. Order matters: App Check must initialize
 * after the FirebaseApp but before any product that relies on attestation.
 *
 * Emulator hosts are wired only when `environment.emulators === true`. We use
 * sentinel values that fail loudly if the emulator suite is not running, which
 * is preferable to silently falling back to production.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })
    ),

    provideFirebaseApp(() => initializeApp(environment.firebase)),

    provideAppCheck(() => {
      if (environment.emulators) {
        // Local debug token for emulators; the SDK reads this global.
        // Production builds never enter this branch.
        (globalThis as Record<string, unknown>)['FIREBASE_APPCHECK_DEBUG_TOKEN'] = true;
      }
      return initializeAppCheck(undefined, {
        provider: new ReCaptchaEnterpriseProvider(environment.appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    }),

    provideAuth(() => getAuth()),

    provideFirestore(() => {
      const db = getFirestore();
      if (environment.emulators) {
        connectFirestoreEmulator(db, '127.0.0.1', 8081);
      }
      return db;
    }),

    provideFunctions(() => {
      const fns = getFunctions(undefined, environment.region);
      if (environment.emulators) {
        connectFunctionsEmulator(fns, '127.0.0.1', 5001);
      }
      return fns;
    }),

    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
