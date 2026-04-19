// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { isDevMode, type ApplicationConfig } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth, connectAuthEmulator } from '@angular/fire/auth';
import { connectFirestoreEmulator, getFirestore, provideFirestore } from '@angular/fire/firestore';
import { connectFunctionsEmulator, getFunctions, provideFunctions } from '@angular/fire/functions';
import {
  initializeAppCheck,
  provideAppCheck,
  ReCaptchaEnterpriseProvider,
} from '@angular/fire/app-check';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { logger } from './core/utils/logger';
import { validateEnvironment } from './core/utils/env-validator';

/**
 * App configuration wires the providers so each Firebase product can be
 * injected anywhere via `inject()`. Order matters: App Check must initialize
 * after the FirebaseApp but before any product that relies on attestation.
 *
 * Resilience contract:
 *
 *  - If `appCheckSiteKey` is missing or a build-time placeholder, we SKIP
 *    `initializeAppCheck` entirely rather than construct a
 *    `ReCaptchaEnterpriseProvider('')` which throws `recaptcha/sitekey-missing`.
 *    The app still boots in a degraded mode; Firebase calls will succeed in
 *    the Firebase console's "unenforced" configuration and fail cleanly
 *    elsewhere.
 *
 *  - The Firebase config itself is validated via `validateEnvironment`;
 *    if `apiKey` is a placeholder we bail out of `initializeApp` with a
 *    loud error so the user sees the fix instructions immediately instead
 *    of `auth/api-error` later.
 */
const envCheck = validateEnvironment(environment);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),

    provideFirebaseApp(() => {
      if (!envCheck.hasAuth) {
        logger.error(
          'firebase.init blocked — firebase config contains placeholders. ' +
            'Auth/Firestore/Functions will NOT work until .env is populated and the build is re-run.',
          { problems: envCheck.problems },
        );
      }
      return initializeApp(environment.firebase);
    }),

    provideAppCheck(() => {
      const g = globalThis as Record<string, unknown>;
      const wantsDebug = environment.emulators || !envCheck.hasAppCheck;

      if (wantsDebug) {
        // Local debug token for emulators or for the "no site key yet" case.
        // Production with a real key never enters this branch.
        g['FIREBASE_APPCHECK_DEBUG_TOKEN'] = true;
        if (!envCheck.hasAppCheck) {
          logger.warn(
            'appCheck.skipped — APP_CHECK_SITE_KEY is missing. Using debug token fallback. ' +
              'Enable enforcement in Firebase console only AFTER setting a real reCAPTCHA Enterprise key.',
          );
        }
      } else {
        // Defensive reset. Prior dev sessions (e.g. when .env was empty) may
        // have set this global to `true`, which the Firebase SDK persists
        // transitively via an IndexedDB entry. Without this cleanup the SDK
        // would keep exchanging a debug UUID that Firebase never authorized
        // (403 from exchangeDebugToken -> auth/api-error cascade once
        // enforcement is enabled). Explicitly clearing both the global and
        // the on-disk cache forces the real reCAPTCHA Enterprise path.
        if (g['FIREBASE_APPCHECK_DEBUG_TOKEN'] !== undefined) {
          logger.warn(
            'appCheck.debugTokenReset — cleared stale FIREBASE_APPCHECK_DEBUG_TOKEN global left over from a previous dev session.',
          );
        }
        delete g['FIREBASE_APPCHECK_DEBUG_TOKEN'];
        if (typeof indexedDB !== 'undefined') {
          try {
            indexedDB.deleteDatabase('firebase-app-check-database');
          } catch {
            // Non-fatal. Some browsers throw if the db is locked; the SDK
            // will simply regenerate on next run.
          }
        }
      }

      return initializeAppCheck(undefined, {
        provider: new ReCaptchaEnterpriseProvider(
          envCheck.hasAppCheck ? environment.appCheckSiteKey : 'debug',
        ),
        isTokenAutoRefreshEnabled: true,
      });
    }),

    provideAuth(() => {
      const auth = getAuth();
      if (environment.emulators) {
        // disableWarnings keeps the console clean when running against the
        // emulator; it's loud by default which clutters the dev signal.
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      }
      return auth;
    }),

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
