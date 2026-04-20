// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
/**
 * Vitest setup for Angular component / service specs.
 *
 * - Boots zone.js so `fakeAsync` and Angular's TestBed scheduler behave the
 *   same way they do under `ng test`.
 * - Initializes the Angular testing platform exactly once (the try/catch
 *   guards against the multi-worker case where Vitest re-imports this file).
 * - Polyfills `globalThis.crypto.subtle` from Node's `webcrypto` because
 *   jsdom does not expose Web Crypto, and identity / SSI helpers depend on
 *   `crypto.subtle.digest('SHA-256', ...)`.
 */
import 'zone.js';
import 'zone.js/testing';
import { webcrypto } from 'node:crypto';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

import { environment } from './environments/environment';

(globalThis as { IS_ANGULAR_TEST?: boolean }).IS_ANGULAR_TEST = true;
environment.googleMapsApiKey = 'TEST_MAPS_API_KEY';

if (!globalThis.crypto || !globalThis.crypto.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    enumerable: true,
    get: () => webcrypto,
  });
}

try {
  getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
} catch {
  // Environment already initialized
}
